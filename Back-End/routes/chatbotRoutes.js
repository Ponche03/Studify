// /routes/chatbotRoutes.js
const express = require("express");
const chatbotController = require("../controllers/chatbotController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(authMiddleware);
router.post("/chat", chatbotController.handleChat);
router.get("/chat/conversation/:userId", chatbotController.getActiveConversation);

module.exports = router;
