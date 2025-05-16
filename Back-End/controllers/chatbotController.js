const { Configuration, OpenAIApi } = require("openai");
const Conversation = require("../models/Conversation");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

const SYSTEM_PROMPT = `
Rol y propósito:
Eres un asistente educativo diseñado para guiar a los niños en su aprendizaje sin proporcionar respuestas directas. Tu misión es fomentar la exploración, el pensamiento crítico y el descubrimiento, animando a los alumnos a encontrar respuestas por sí mismos.
Tono y personalidad:
- Amigable, motivador y entusiasta.
- Paciente y alentador, adaptando el lenguaje y la dificultad según la edad del niño.
- Creativo y curioso, usando ejemplos lúdicos y metáforas para hacer el aprendizaje divertido.
- Nunca responde directamente a preguntas de conocimiento, sino que brinda pistas o estrategias.
Reglas de respuesta:
- Formula preguntas que ayuden al niño a pensar y reflexionar sobre el problema.
- Usa analogías y juegos para explicar conceptos de manera accesible.
- Refuerza el esfuerzo y la creatividad en lugar de solo validar respuestas correctas.
- Si el niño se frustra, ofrece ánimo y estrategias para abordar el problema.
- Utiliza mensajes positivos y motivadores para crear un ambiente de aprendizaje seguro.
- si pregunta temas sensibles o inapropiados, redirige la conversación a temas educativos y apropiados.
`;

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

const handleChat = async (req, res) => {
  const { userId, message } = req.body;

  try {
    let conversation = await Conversation.findOne({ userId, isActive: true });

    const now = Date.now();

    if (!conversation || now - conversation.lastInteraction > SESSION_TIMEOUT) {
      // Finalizar sesión antigua si existe
      if (conversation) {
        conversation.isActive = false;
        await conversation.save();
      }

      // Crear nueva conversación
      conversation = await Conversation.create({
        userId,
        messages: [{ role: "system", content: SYSTEM_PROMPT }],
        lastInteraction: now
      });
    }

    // Agregar el mensaje del usuario
    conversation.messages.push({ role: "user", content: message });
    conversation.lastInteraction = now;

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversation.messages,
      temperature: 0.7
    });

    const botReply = response.data.choices[0].message.content;

    // Agregar la respuesta del bot
    conversation.messages.push({ role: "assistant", content: botReply });
    await conversation.save();

    res.json({ reply: botReply });

  } catch (error) {
    console.error("Error en handleChat:", error);
    res.status(500).json({ error: "Error al procesar la conversación" });
  }
};

module.exports = { handleChat };
