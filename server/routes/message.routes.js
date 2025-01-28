const express = require("express");
const router = express.Router();
const messageController = require("../controller/message.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

// route pour recuperer tout les messages
router.get("/", authMiddleware, messageController.getMessages);

// route pour recuperer un message par son ID
router.get("/:messageId", authMiddleware, messageController.getMessageById);

// route pour avoir les messages par conversation
// router.get(
//   "/conversation/:conversationId",
//   authMiddleware,
//   messageController.getMessagesByConversation
// );

// MAJ d'un message
router.put(
  "/update/:messageId",
  authMiddleware,
  messageController.updateMessage
);

// Suppression d'un message
router.delete(
  "/delete/:messageId",
  authMiddleware,
  messageController.deleteMessage
);

// route pour mettre a jour le status d'un message
router.put(
  "/update-status/:messageId",
  authMiddleware,
  messageController.updateMessageStatus
);

router.get("/search", authMiddleware, messageController.searchMessage);

// Route pour upload fichier et creation fichier
router.post(
  "/create",
  authMiddleware,
  uploadMiddleware,
  messageController.createMessage
);

module.exports = router;
