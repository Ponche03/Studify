const OpenAI = require("openai");
const Conversacion = require("../models/conversacionModel");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are an educational assistant for children. Your role is to guide students through learning without giving direct answers. Your goal is to promote curiosity, critical thinking, and independent discovery.
Purpose:
-Never provide explicit answers.
-Instead, help with questions, hints, or strategies so the child can think for themselves.
Tone and personality:
-Always be friendly, encouraging, patient, and positive.
-Adjust your language and explanations to the child's age.
-Be creative and curious: use games, analogies, or metaphors to make learning fun and clear.

Response rules:
-Ask guiding questions to help the child reflect and explore.
-If the child is frustrated, respond with encouragement and different approaches.
-Celebrate effort, creativity, and persistence, not just correct answers.
-never give direct factual answers; instead, offer hints or steps to figure it out.
-If the child asks about inappropriate or sensitive topics, gently redirect the conversation to something educational and appropriate.
-Never give the direct answer. Your job is to teach how to think, not what to think.

Always respond in Spanish, using language that is simple, fun, and appropriate for children.
Be clear and concise
IMPORTANT: Never give the direct answer. Your job is to teach how to think, not what to think.
`;

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

exports.handleChat = async (req, res) => {
  const { userId, message } = req.body;

  try {
    if (!userId || !message) {
      return res.status(400).json({ error: "userId y message son requeridos." });
    }

    let conversacion = await Conversacion.findOne({ userId, isActive: true });
    const now = Date.now();

    // Verificar tiempo de sesión activa
    if (!conversacion || now - conversacion.lastInteraction > SESSION_TIMEOUT) {
      if (conversacion) {
        conversacion.isActive = false;
        await conversacion.save();
      }

      conversacion = await Conversacion.create({
        userId,
        messages: [{ role: "system", content: SYSTEM_PROMPT }],
        lastInteraction: now
      });
    }

    // Agregar mensaje del usuario
    conversacion.messages.push({ role: "user", content: message });
    conversacion.lastInteraction = now;

    // Limitar historial si lo deseas (últimos 15)
    const maxHistory = 15;
    const recentMessages = conversacion.messages.slice(-maxHistory);

    // Obtener respuesta del modelo
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: recentMessages,
      temperature: 0.7
    });

    const botReply = response.choices[0].message.content;

    // Guardar respuesta del asistente
    conversacion.messages.push({ role: "assistant", content: botReply });
    await conversacion.save();

    res.json({ reply: botReply });

  } catch (error) {
    console.error("Error en handleChat:", error);
    res.status(500).json({ error: "Error al procesar la conversación." });
  }
};
// GET /api/chatbot/conversation/:userId
exports.getActiveConversation = async (req, res) => {
  const { userId } = req.params;

  try {
    let conversacion = await Conversacion.findOne({ userId, isActive: true });

    if (conversacion) {
      const now = Date.now();
      const lastInteraction = new Date(conversacion.lastInteraction).getTime();

      if (now - lastInteraction > SESSION_TIMEOUT) {
        conversacion.isActive = false;
        await conversacion.save();
        conversacion = null;
      }
    }

    if (!conversacion) {
      return res.status(404).json({ message: "No hay conversación activa" });
    }

    res.json({ conversacion });
  } catch (error) {
    console.error("Error al obtener la conversación:", error);
    res.status(500).json({ error: "Error al buscar la conversación" });
  }
};
