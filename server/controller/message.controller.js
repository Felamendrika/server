const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const Fichier = require("../models/fichier.model");
const Membre = require("../models/membre.model");
//const { createNotification } = require("../utils/notification");
const {
  notifyPrivateMessage,
  notifyGroupMessage,
} = require("../utils/notification");

const path = require("path");
const fs = require("fs");

const { isValidObjectId } = require("mongoose");

const { getIO } = require("../socket/socket");

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

// types de fichiers autorise
const ALLOWED_FILE_TYPES = [
  "pdf",
  "image",
  "word",
  "excel",
  "powerpoint",
  "text",
  "document",
  "application",
];

// Fonction utilitaire pour supprimer un fichier un fichier physique
const deletePhysicalFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Creation d'un message + automatisation ajout user_id
exports.createMessage = async (req, res) => {
  try {
    const { contenu, conversation_id } = req.body;

    // recuperation de l'user connecter
    const user_id = req.user?._id || req.user?.id; // req.user?.id

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }
    if (!user_id) {
      return res.status(400).json({
        message: "aucun utilisateur recuperer",
      });
    }

    // Verification des IDs (conv et user_id doivent etre valide)
    if (!isValidObjectId(conversation_id)) {
      return res.status(400).json({
        message: "ID de conversation invalide",
      });
    }
    if (!isValidObjectId(user_id)) {
      return res.status(400).json({
        message: "ID d'utilisateur invalide",
      });
    }

    // Verification de l'existance de la conversation et de l'user
    const conversation = await Conversation.findById(conversation_id).populate(
      "group_id",
      "nom"
    );

    if (!conversation) {
      return res.status(404).json({
        message: "La conversation spécifié n'existe pas ",
      });
    }

    if (!req.file && !contenu) {
      return res.status(400).json({
        message: "Un message doit contenir soit du texte, soit un fichier",
      });
    }

    // const receiverId =
    //   conversation.type === "private"
    //     ? conversation.sender_id.toString() === user_id.toString()
    //       ? conversation.receiver_id
    //       : conversation.sender_id
    //     : null;

    // Creation message
    const newMessage = new Message({
      contenu: contenu || null, // Permet un message sans contenu
      status: "envoye",
      date_envoi: Date.now(),
      conversation_id,
      user_id,
    });

    // Gestion du fichier joint (si present)

    let fichier = null;

    // Verifie si un fichier est present
    if (req.file) {
      const { originalname, mimetype, size, filename } = req.file;

      const fileType = getFileType(mimetype);

      if (!ALLOWED_FILE_TYPES.includes(fileType)) {
        // supprimer le fichier si le type n'est pas valide
        //const filePath = path.join("uploads", filename);
        deletePhysicalFile(req.file.path);

        return res.status(400).json({
          success: false,
          message: "Type de fichier non autorisé",
        });
      }

      //const chemin_fichier = path.join("uploads", filename);
      const chemin_fichier = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${filename}`;

      fichier = new Fichier({
        nom: originalname,
        type: fileType, // mimetype.split("/")[0]type MIME principal (application, image)
        taille: `${(size / 1024).toFixed(2)} KB`,
        chemin_fichier: chemin_fichier,
        message_id: newMessage._id,
      });

      newMessage.fichier = fichier;
      // sauvegrader le fichier en BD
      await fichier.save();
    }

    await newMessage.save();
    await newMessage.populate([
      { path: "user_id", select: "_id nom pseudo avatar" },
      { path: "fichier", select: " _id nom type taille chemin_fichier" },
    ]);

    // Création de notification
    if (conversation.type === "private") {
      // Notifier l'autre utilisateur
      const receiverId =
        conversation.sender_id.toString() === user_id.toString()
          ? conversation.receiver_id
          : conversation.sender_id;
      //createNotification de niampy fotsiny type: message , relatedId: newMessage._id
      await notifyPrivateMessage({
        userId: receiverId,
        fromUserId: user_id,
        message: `Nouveau message de "${req.user.pseudo || req.user.nom}"`,
        conversationId: conversation._id || conversation_id,
      });
    } else if (conversation.type === "group") {
      // Notifier tous les membres du groupe sauf l'auteur
      const membres = await Membre.find({ group_id: conversation.group_id });

      if (!membres || membres.length === 0) {
        console.error("Aucun membre trouver dans la conversation a notifier");
      }

      for (const membre of membres) {
        const membreUserId = membre.user_id.toString();
        if (membreUserId !== user_id.toString()) {
          // taloha teto createNotification de niampy fotsiny type: message , relatedId: newMessage._id
          const notif = await notifyGroupMessage({
            userId: membreUserId,
            fromUserId: user_id, // user qui est l'auteur du message
            message: `Nouveau message dans le groupe : ${conversation.group_id?.nom}`,
            groupId: conversation.group_id?._id || conversation.group_id,
            // Pb teto lasa notification_id.group_id no napesaina nefa tokony conversation.group_id
          });

          if (!notif) {
            console.error(
              "Notification non envoyee au membre pour le nouveau message"
            );
          } else {
            console.log(
              "Notification envoyee au membre pour le nouveau message",
              notif
            );
          }
        }
      }
    }

    // modif pour fichiers
    // Population des données nécessaires
    /*const populatedMessage = await Message.findById(newMessage._id)
      .populate("user_id", "nom pseudo avatar")
      .populate("fichier"); */

    const io = getIO();
    // Notifier tous les utilisateurs de la conversation
    if (io) {
      const roomName = `conversation_${conversation_id}`;
      // modif news
      const messagePayload = {
        ...newMessage._doc,
        user_id: {
          _id: user_id,
          nom: req.user.nom,
          pseudo: req.user.pseudo,
          avatar: req.user.avatar,
        },
        timestamp: Date.now(),
      };

      io.to(roomName).emit("messageReceived", {
        //message: populatedMessage,
        message: messagePayload,
        conversation_id: conversation_id,
        fichier,
        // fichier: fichier || null,
      });

      io.emit("conversationUpdated", {
        conversation_id: conversation_id,
        lastMessage: messagePayload,
      });

      // console.log("Message socket:", populatedMessage);
    } else {
      console.warn("Socket.IO non disponible pour la diffusion.");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    res.status(201).json({
      success: true,
      message: "Nouveau message creer",
      messages: newMessage,
      data: {
        id: newMessage._id,
        contenu: newMessage.contenu,
        date_envoi: newMessage.date_envoi,
        conversation_id: newMessage.conversation_id,
        fichier: fichier || null,
      },
    });
  } catch (error) {
    console.log(error);

    //supprimer le fichier en cas d'erreur
    if (req.file) {
      deletePhysicalFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la création du message",
      error: error.message,
    });
  }
};

// recuperer tout les messages avec paginations et filtres
exports.getAllMessages = async (req, res) => {
  try {
    const { conversation_id, page = 1, limit = 10 } = req.query;

    // Verification de la validite de l'ID de conversation
    if (conversation_id && !isValidObjectId(conversation_id)) {
      return res.status(400).json({
        message: "ID de conversation invalide",
      });
    }

    const messages = await Message.find(
      conversation_id ? { conversation_id } : {}
    )
      .populate({
        path: "conversation_id",
        populate: { path: "group_id", select: "nom" },
      })
      .populate("user_id", "nom")
      .populate("fichier", "nom chemin_fichier")
      .sort({ date_envoi: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!messages || messages.length === 0) {
      return res.status(404).json({
        message: "Aucun message recuperer",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici la liste des messages recuperer avec success",
      data: messages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: " Erreur du serveur lors de la reccuperation des messages",
      error: error.message,
    });
  }
};

// Recuperer un message par son ID
exports.getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        message: "ID de message invalide",
      });
    }

    const message = await Message.findById(messageId)
      .populate("user_id", "nom")
      .populate("fichier", "nom URL")
      .populate({
        path: "conversation_id",
        populate: { path: "group_id", select: "nom" },
      });

    if (!message) {
      return res.status(404).json({
        message: "Message introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici le message recuperer",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la recuperation du message ",
      error: error.message,
    });
  }
};

// Mise a jour d'un message
exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { contenu } = req.body;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        message: "ID de message invalide",
      });
    }

    if (!contenu) {
      return res.status(404).json({
        message: "Aucun contenu a changer",
      });
    }
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "Aucune donnée fournie pour la mise à jour",
      });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { contenu },
      { new: true }
    ).populate([
      { path: "user_id", select: "_id nom pseudo avatar" },
      { path: "fichier", select: "nom type taille chemin_fichier" },
    ]);

    if (!updatedMessage) {
      return res.status(404).json({
        message: "message non trouvé",
      });
    }

    const io = getIO();

    // Notifier du changement
    if (io) {
      // modif news
      const messagePayload = {
        ...updatedMessage._doc,
        timestamp: Date.now(),
      };

      io.to(`conversation_${updatedMessage.conversation_id}`).emit(
        "messageModified",
        {
          // message: updatedMessage,
          message: messagePayload,
          conversation_id: updatedMessage.conversation_id,
          // sender_id: updatedMessage.user_id,
        }
      );

      io.emit("conversationUpdated", {
        conversation_id: updatedMessage.conversation_id,
        lastMessage: messagePayload,
      });
    } else {
      console.warn("Socket.IO non disponible pour la diffusion.");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message mis a jour",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Erreur dans updateMessage: ", error);

    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la mise a jour du message",
      error: error.message,
    });
  }
};

// Suppression d'un message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user || req.user?.id || req.user?._id;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        message: "ID du message invalide",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message non trouvé",
      });
    }

    const conversation_id = message.conversation_id;

    // Suppression du fichier associer, s'il existe
    if (message.fichier) {
      const fichier = await Fichier.findById(message.fichier);
      if (fichier) {
        const filePath = path.resolve(fichier.chemin_fichier);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await fichier.deleteOne();
      }
    }

    //marquer le message comme supprimer
    message.isDeleted = true;
    message.contenu = null;
    message.fichier = null; // dissocier le fichier

    await message.save();

    // Notification de la suppression

    const io = getIO();
    // notifier de la suppression du message
    if (io) {
      io.to(`conversation_${conversation_id}`).emit("messageDeleted", {
        messageId: message._id,
        conversation_id: conversation_id,
        timestamp: Date.now(),
        // message: "Un message a ete supprimé",
      });

      io.emit("conversationUpdated", {
        conversation_id: conversation_id,
        lastMessage: {
          _id: message._id,
          contenu: "Message supprimé",
          date_envoi: message.date_envoi,
          user_id: message.user_id,
        },
      });
    } else {
      console.warn("Socket.IO non disponible pour la diffusion.");
      return res.status(500).json({
        message:
          "Erreur serveur interne. Socket.IO non disponible pour la diffusion",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur dans deleteMessage: ", error);

    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la suppression du message",
      error: error.message,
    });
  }
};

// modifer le status d'un message (lu/distribue)
exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        message: "ID du message invalide",
      });
    }

    if (!["envoye", "distribue", "lu"].includes(status)) {
      return res.status(400).json({
        message: "Status invalide",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: "message introuvable",
      });
    }

    message.status = status;
    await message.save();

    res.status(200).json({
      success: true,
      message: "Statut mis à jour avec succès",
      Status: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors de la mise à jour du statut du message",
      error: error.message,
    });
  }
};
