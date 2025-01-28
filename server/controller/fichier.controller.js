const Fichier = require("../models/fichier.model");
const Message = require("../models/message.model");

const path = require("path");
const fs = require("fs");

const { isValidObjectId } = require("mongoose");

// types de fichiers autorise
const ALLOWED_FILE_TYPES = [
  "pdf",
  "image",
  "word",
  "excel",
  "powerpoint",
  "text",
  "application",
];

// Fonction utilitaire pour obtenir le type de fichier
const getFileType = (mimetype) => {
  const mapping = {
    "application/pdf": "pdf",
    "image/jpeg": "image",
    "image/jpg": "image",
    "image/png": "image",
    "application/msword": "word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "word",
    "application/vnd.ms-excel": "excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "excel",
    "application/vnd.ms-powerpoint": "powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow":
      "powerpoint",
    "text/plain": "text",
  };
  return mapping[mimetype] || "application";
};

// Fonction utilitaire pour supprimer un fichier un fichier physique
const deletePhysicalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  } else {
    console.log("Fichier déjà supprimé :", filePath);
  }
};

// Fonction pour uploads un fichier
exports.uploadAndCreateFile = async (req, res) => {
  try {
    const { message_id } = req.body;

    if (!isValidObjectId(message_id)) {
      return res.status(400).json({
        message: "ID de message invalide",
      });
    }

    // verification si un fichier est present
    if (!req.file) {
      return res.status(400).json({
        message: "Aucun fichier sélectionné",
      });
    }

    const { originalname, mimetype, size, filename } = req.file;

    // verification du type de fichier
    //const fileType = mimetype.split("/")[0];

    const fileType = getFileType(mimetype);
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      deletePhysicalFile(req.file.path);
      return res.status(400).json({
        message:
          "Type de fichier non autorisé. Types autorisés : PDF, images, Word, Excel, PowerPoint",
      });
    }

    // construction de l'URL base sur le chemin serveur
    //const chemin_fichier = path.join("uploads", filename);
    const chemin_fichier = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${filename}`;

    // verifie si le message existe
    const message = await Message.findById(message_id);

    if (!message) {
      return res.status(404).json({
        message: "Le message associé n'existe pas",
      });
    }

    const existingFile = await Fichier.findOne({ message_id });
    if (existingFile) {
      deletePhysicalFile(req.file.path);
      return res.status(400).json({
        message: "Un fichier est déjà associé à ce message",
      });
    }

    // creation d'un nouveau fichier
    const newFile = new Fichier({
      nom: originalname,
      type: fileType, // Extraction 'pdf','image', ...
      taille: `${(size / 1024).toFixed(2)} KB`,
      chemin_fichier,
      //chemin_fichier: `${req.protocol}://${req.get("host")}/${chemin_fichier}`,
      message_id,
    });

    if (!newFile) {
      return res.status(404).json({
        message: "Fichier non creer",
      });
    }

    // mise a jour du champ fichier en BD
    await newFile.save();

    //retourner l'URL du fichier telecharger
    res.status(200).json({
      success: true,
      message: "Fichier telechargé et associé avec succès ",
      fichier: newFile,
      //fileUrl: `${req.protocol}://${req.get("host")}/${chemin_fichier}`, //chemin_fichier
      //fileUrl: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    deletePhysicalFile(req.file.path);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'upload et de la création du fichier",
      error: error.message,
    });
  }
};

// recuperer un fichier
exports.getFileById = async (req, res) => {
  try {
    const { fichierId } = req.params;

    if (!isValidObjectId(fichierId)) {
      return res.status(400).json({
        message: "ID fichier non valide",
      });
    }

    const fichier = await Fichier.findById(fichierId);
    if (!fichier) {
      return res.status(404).json({
        message: "Fichier introuvable",
      });
    }

    //const filePath = path.join(__dirname, "../uploads", req.params.fileName);

    const filePath = path.resolve(fichier.chemin_fichier);
    // verifie si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Fichier physique introuvable sur le serveur",
      });
    }

    res.download(filePath, fichier.nom);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du fichier",
      error: error.message,
    });
  }
};

// recuperation de tous les fichiers en BD
exports.getAllFiles = async (req, res) => {
  try {
    const files = await Fichier.find();

    if (!files || files.length === 0) {
      return res.status(404).json({
        message: "Aucun fichier recuperer",
      });
    }
    res.status(200).json({
      success: true,
      message: "Voici la liste de tous les fichiers",
      fichiers: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des fichiers",
      error: error.message,
    });
  }
};

// recuperation du fichier associer a un messages
exports.getFilesByMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!isValidObjectId(messageId)) {
      return res.status(404).json({
        message: "ID message invalide",
      });
    }

    const files = await Fichier.findOne({
      message_id: messageId,
    });
    if (!files) {
      return res.status(404).json({
        message: "Message associé au fichier introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici le fichier contenu dans ce message",
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des fichier par messages",
      error: error.message,
    });
  }
};

// Recuperation et affichage de tous les fichiers echanger dans une conversation
exports.getFilesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!isValidObjectId(conversationId)) {
      return res.status(404).json({
        message: "ID conversation invalide",
      });
    }

    const fichiers = await Fichier.find()
      .populate({
        path: "message_id",
        match: { conversation_id: conversationId },
        select: "conversation_id",
        populate: { path: "conversation_id", select: "sender_id receiver_id" },
      })
      .select("nom type taille chemin_fichier message_id");

    if (!fichiers) {
      return res.status(404).json({
        error: " Fichier introuvable ou conversation introuvable",
      });
    }

    // Filtrage des fichiers: inclure ceux associé a la conversation
    const filteredFichiers = fichiers.filter((fichier) => fichier.message_id);

    res.status(200).json({
      success: true,
      //data: fichiers,
      fichiers: filteredFichiers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des fichiers de la conversation",
      error: error.message,
    });
  }
};

// Mise a jour d'un fichier
exports.updateFile = async (req, res) => {
  try {
    const { nom } = req.body;
    const { fichierId } = req.params;

    if (!isValidObjectId(fichierId)) {
      return res.status(404).json({
        message: "ID fichier invalide",
      });
    }

    if (!nom) {
      return res.status(404).json({
        message: "Aucun nom a changer",
      });
    }
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "Aucune donnée fournie pour la mise à jour",
      });
    }

    const updatedFile = await Fichier.findByIdAndUpdate(
      fichierId,
      { nom },
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
      message: "Fichier mis a jour",
      data: updatedFile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du fichier",
      error: error.message,
    });
  }
};

// Suppression d'un fichier
exports.deleteFile = async (req, res) => {
  try {
    const { fichierId } = req.params;

    if (!isValidObjectId(fichierId)) {
      return res.status(404).json({
        message: "ID fichier invalide",
      });
    }

    const fichier = await Fichier.findById(fichierId);
    if (!fichier) {
      return res.status(404).json({
        message: "Fichier introuvable",
      });
    } else {
      console.log("ID du fichier :", fichierId);
    }

    // suppression du fichier du serveur
    const filePath = path.resolve(fichier.chemin_fichier);
    deletePhysicalFile(filePath);
    console.log("Chemin du fichier à supprimer :", filePath);

    /*if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } */

    // Supprimer de l'entree en BD
    const deletedFichier = await Fichier.findByIdAndDelete(fichierId);

    if (!deletedFichier) {
      return res.status(404).json({
        message: "Fichier non supprimer",
      });
    }

    // Suppression de la reference dans le message
    const message = await Message.findById(fichier.message_id);
    if (message) {
      message.fichier = null;
      message.isDeleted = true;
      await message.save();
    } else {
      res.status(404).json({
        message: "Message non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fichier supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression du fichier",
      error: error.message,
    });
  }
};

// Recherche de fichiers par nom et type
exports.searchFile = async (req, res) => {
  try {
    //const { query, type } = req.query;
    const { nom, type } = req.query;
    const searchQuery = { $text: { $search: query } };

    const filtreCritere = {};

    if (nom) filtreCritere.nom = { $regex: nom, $options: "i" };
    if (type) filtreCritere.type = type;
    //if (type) searchQuery.type = type;

    const fichiers = await Fichier.find(filtreCritere);
    //const fichiers = await Fichier.find(searchQuery);

    res.json({
      success: true,
      message: "Fichiers rechercher",
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
    const { fichierId } = req.params;

    if (!isValidObjectId(fichierId)) {
      return res.status(404).json({
        message: "ID fichier invalide",
      });
    }

    // verifie si le fichier existe dans la BD
    const fichier = await Fichier.findById(fichierId);

    if (!fichier) {
      return res.status(404).json({
        message: "Fichier introuvable",
      });
    }

    // verifie si le fichier est une image
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image"];
    if (!allowedImageTypes.includes(fichier.type)) {
      return res.status(415).json({
        message: "Seuls les fichiers images peuvent etre prévisualisés",
      });
    }

    // verifie si le fichier existe dans le dossier 'uploads'
    const filePath = path.resolve(fichier.chemin_fichier);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Fichier introuvable sur le serveur",
      });
    }

    // Envoi du fichier pour la previsualisation
    res.sendFile(filePath, fichier.nom);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la prévisualisation",
      error: error.message,
    });
  }
};

/*

// Récupérer tous les fichiers associés à une conversation
exports.getFilesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "ID de conversation invalide." });
    }

    const files = await Fichier.aggregate([
      {
        $lookup: {
          from: "messages", // Nom de la collection "messages"
          localField: "message_id",
          foreignField: "_id",
          as: "message",
        },
      },
      { $unwind: "$message" },
      {
        $match: { "message.conversation_id": conversationId },
      },
      {
        $project: {
          nom: 1,
          type: 1,
          taille: 1,
          chemin_fichier: 1,
          message_id: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Fichiers récupérés avec succès.",
      data: files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des fichiers.",
      error: error.message,
    });
  }
};
*/
