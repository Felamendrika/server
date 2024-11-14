const express = require("express");
const router = express.Router();
const fichierController = require("../controller/fichier.controller");

// Routes pour les fichiers
router.post("/create", fichierController.createFile);
router.get("/", fichierController.getFiles);
router.get("/message/:messageId", fichierController.getFilesByMessage);
router.put("/:id", fichierController.updateFile);
router.delete("/:id", fichierController.deleteFile);

router.get("/search", fichierController.searchFile);
router.get("/preview/:id", fichierController.previewFile);

module.exports = router;
