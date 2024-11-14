const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const Fichier = require("../models/fichier.model");

// Creation d'un message
exports.createMessage = async (req, res) => {
  try {
    const { content, status, date_envoi, conversation_id, user_id } = req.body;

    let fichier = null;

    // Verifie si un fichier est present
    if (req.file) {
      fichier = await Fichier.create({
        nom: req.file.originalname,
        type: req.file.mimetype.includes("image")
          ? "image"
          : req.file.mimetype.includes("pdf")
          ? "pdf"
          : "document",
        taille: req.file.size,
        URL: `/uploads/${req.file.filename}`,
      });
    }

    // Verification de l'existance de la conversation et de l'user
    const conversation = await Conversation.findById(conversation_id);

    if (!conversation) {
      return res.status(404).json({
        message: "La conversation spécifiée n'existe pas ",
      });
    }

    const newMessage = new Message({
      content: content || null, // Permet un message sans contenu
      status,
      date_envoi,
      conversation_id,
      user_id,
      fichier: fichier ? fichier._id : null,
    });

    await newMessage.save();
    res.status(201).json({
      success: true,
      newMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du message",
      error,
    });
  }
};

// recuperer tout les messages avec paginations et filtres
exports.getMessages = async (req, res) => {
  try {
    const { conversation_id, page = 1, limit = 10 } = req.query;
    const messages = await Message.find()
      .populate("conversation_id")
      .populate("user_id", "nom")
      .populate("fichier", "nom")
      .sort({ date_envoi: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: " Erreur lors de la reccuperation des messages",
      error,
    });
  }
};

// recuperer les messages par conversation
exports.getMessagesByConversation = async (req, res) => {
  try {
    //const { conversation_id } = req.params;
    const messages = await Message.find({
      conversation_id: req.params.conversationId,
    })
      .populate("user_id", "nom")
      .populate("conversation_id")
      .sort({ date_envoi: 1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des messages par conversation",
      error,
    });
  }
};

// Mise a jour d'un message
exports.updateMessage = async (req, res) => {
  try {
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        message: "message non trouvé",
      });
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la mise a jour du message",
      error,
    });
  }
};

// Suppression d'un message
exports.deleteMessage = async (req, res) => {
  try {
    const deleteMessage = await Message.findByIdAndDelete(req.params.id);

    if (!deleteMessage) {
      return res.status(404).json({
        message: "Message introuvable",
      });
    }

    res.status(200).json({
      message: "Message supprimé",
    });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la suppression du message",
      error,
    });
  }
};

// recherche de message par contenu
exports.searchMessage = async (req, res) => {
  const { query, page = 1, limit = 10, userId, groupId } = req.body;
  const skip = (page - 1) * limit;

  const filters = {};
  if (userId) filters.user_id = userId;
  if (groupId) filters.group_id = groupId;

  try {
    const messages = await Message.find({
      $text: { $search: query }, // recherche full-text sur le contenu
      ...filters, // application du filtre
    })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const totalMessages = await Message.countDocuments({
      $text: { $search: query },
      ...filters,
    });

    res.json({
      total: totalMessages,
      page,
      totalPages: Math.ceil(totalMessages / limit),
      messages,
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      message: "Erreur serveur lors de la recherche de messages",
      error,
    });
  }
};

/*exports.searchMessage = async (req, res) => {
  const { query } = req.query; // Paramètre de recherche (contenu du message)

  try {
    const messages = await Message.find({
      $text: { $search: query }, // Recherche full-text sur le contenu des messages
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur lors de la recherche de messages",
      error,
    });
  }
};
*/
