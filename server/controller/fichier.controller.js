const Fichier = require("../models/fichier.model");
const Message = require("../models/message.model");

const path = require("path");
const fs = require("fs");

// Fonction pour uploads un fichier
exports.uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier sélectionné." });
  }

  //retourner l'URL du fichier telecharger
  res.status(200).json({
    message: "Fichier telechargé",
    fileUrl: `/uploads/${req.file.filename}`,
  });
};

// recuperer un fichier
exports.getFile = async (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.fileName);

  // verifie si le fichier existe
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      message: "Fichier non trouvé",
    });
  }
};

// Creation d'un fichier (lorsqu'il est assocuer a un message)
exports.createFile = async (req, res) => {
  try {
    const { nom, type, taille, URL, message_id } = req.body;

    //Verification que le message existe
    const message = await Message.findById(message_id);

    if (!message) {
      return res.status(400).json({
        message: " Le message associé n'existe pas",
      });
    }

    const newFile = new Fichier({
      nom,
      type,
      taille,
      URL,
      message_id,
    });
    await newFile.save();
    res.status(201).json({ newFile });
  } catch {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la creation du fichier",
      error: error.message,
    });
  }
};

// recuperation de tous les fichiers
exports.getFiles = async (req, res) => {
  try {
    const files = await Fichier.find().populate("message_id");
    res.status(200).json({
      success: true,
      fichier: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des fichiers",
      error: error.message,
    });
  }
};

// recuperation des fichiers associer a un messages
exports.getFilesByMessage = async (req, res) => {
  try {
    const files = await Fichier.find({
      message_id: req.params.messageId,
    });

    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des fichier par messages",
      error: error.message,
    });
  }
};

// Mise a jour d'un fichier
exports.updateFile = async (req, res) => {
  try {
    const updatedFile = await Fichier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({
        success: false,
        message: "Fichier non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedFile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du fichier",
      error: error.message,
    });
  }
};

// Suppression d'un fichier
exports.deleteFile = async (req, res) => {
  try {
    const deletedFile = await Fichier.findByIdAndDelete(req.params.id);

    if (!deletedFile) {
      return res.status(404).json({
        message: "Fichier non trouvé",
      });
    }
    res.status(200).json({
      success: true,
      message: "Fichier supprimé",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du fichier",
      error: error.message,
    });
  }
};

// Recherche de fichiers par nom et type
exports.searchFile = async (req, res) => {
  try {
    const { query, type } = req.query;
    const searchQuery = { $text: { $search: query } };

    if (type) searchQuery.type = type;

    const fichiers = await Fichier.find(searchQuery);

    res.json({
      success: true,
      data: fichiers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche des fichiers",
      error: error.message,
    });
  }
};

// Previsualisation des images
exports.previewFile = async (req, res) => {
  try {
    const { id } = req.params;
    const fichier = await Fichier.findById(id);

    if (fichier && (fichier.type === "image" || fichier.type === "pdf")) {
      res.sendFile(fichier.url, { root: "./uploads" });
    } else {
      res.status(400).json({
        success: false,
        message: "Prévisualisation non disponible",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la prévisualisation",
      error: error.message,
    });
  }
};
