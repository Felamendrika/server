const express = require("express");
const router = express.Router();
const conversationController = require("../controller/conversation.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// route pour les conversations
router.post(
  "/create",
  authMiddleware,
  conversationController.createConversation
);

// recuperer toutes les conversations d'un user CONNECTER
router.get(
  "/private/conversation",
  authMiddleware,
  conversationController.getUserPrivateConversations
);

// recuperer les conversations de groupes de l'utilisateur connecter
router.get(
  "/group/conversation",
  authMiddleware,
  conversationController.getUserGroupConversation
);

// Route pour recuperer tout les messages d'une conversation
router.get(
  "/:conversationId/messages",
  authMiddleware,
  conversationController.getMessages
);

//route pour recup tout les conversation
router.get("/", authMiddleware, conversationController.getConversations);

//router.get("/", conversationController.getConversations);
// Route pour rec conversation par ID
router.get(
  "/:conversationId",
  authMiddleware,
  conversationController.getConversationById
);

// Route pour supprimer une conversation
router.delete(
  "/delete/:conversationId",
  authMiddleware,
  conversationController.deleteConversation
);

module.exports = router;
