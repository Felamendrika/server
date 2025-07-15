const express = require("express");
const router = express.Router();
const fichierController = require("../controller/fichier.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

// Telecharger un fichier
router.post(
  "/upload",
  authMiddleware,
  uploadMiddleware,
  fichierController.uploadAndCreateFile
);

// recuperer un fichier par son nom
router.get("/:fichierId", authMiddleware, fichierController.getFileById);

// Recuperer tout les fichiers
router.get("/", authMiddleware, fichierController.getAllFiles);

// Recuperer fichiers associer a un message
router.get(
  "/message/:messageId",
  authMiddleware,
  fichierController.getFilesByMessage
);

// recuperer les fichiers present dans une conversation
router.get(
  "/conversation/:conversationId",
  authMiddleware,
  fichierController.getFilesByConversation
);

// MAJ les info d'un fichier
router.put("/update/:fichierId", authMiddleware, fichierController.updateFile);

// supprimer un fichier
router.delete(
  "/delete/:fichierId",
  authMiddleware,
  fichierController.deleteFile
);

// router.post("/search", authMiddleware, fichierController.searchFile);

// // Route pour previsualiser un fichier (image uniquement)
// router.get(
//   "/preview/:fichierId",
//   authMiddleware,
//   fichierController.previewFile
// );

module.exports = router;
