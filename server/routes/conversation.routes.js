const express = require("express");
const router = express.Router();
const conversationController = require("../controller/conversation.controller");

// route pour les conversations
router.post("/create", conversationController.createConversation);

// recuperer toutes les conversations d'un user CONNECTER
router.get("/user", conversationController.getUserConversations);

// Route pour reccuperer tout les messages d'une conversation
router.get("/:conversationId/messages", conversationController.getMessages);

//route pour recup tout les conversation
router.get("/", conversationController.getConversations);

//router.get("/", conversationController.getConversations);
// Route pour rec conversation par ID
router.get("/:id", conversationController.getConversationById);

// MAJ conversation Optionnel
router.put("/:id", conversationController.updateConversation);

// Route pour supprimer une conversation
router.delete("/:id", conversationController.deleteConversation);

module.exports = router;
