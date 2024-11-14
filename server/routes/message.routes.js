const express = require("express");
const router = express.Router();
const messageController = require("../controller/message.controller");
//const { searchMessage } = require("../controller/message.controller");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Routes pour les messages
//router.post("/create", messageController.createMessage);
router.get("/", messageController.getMessages);
// route pour avoir les messages par conversation
router.get(
  "/conversations/:conversationId",
  messageController.getMessagesByConversation
);
router.put("/:id", messageController.updateMessage);
router.delete("/:id", messageController.deleteMessage);

router.get("/search", messageController.searchMessage);

// Route pour upload fichier
router.post("/", upload.single("fichier"), messageController.createMessage);

module.exports = router;
