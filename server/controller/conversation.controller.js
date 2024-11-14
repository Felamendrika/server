const Conversation = require("../models/conversation.model");
const User = require("../models/user.model");
const Group = require("../models/group.model");
const Membre = require("../models/membre.model");
const Role = require("../models/role.model");
const Message = require("../models/message.model");
const { json } = require("body-parser");

// Creation de conversation
exports.createConversation = async (req, res) => {
  try {
    const { type, receiver_id, sender_id, group_id } = req.body;

    // Validation des types de conversation
    if (type === "private") {
      // une conversation privee necessite 02 users
      if (!receiver_id || !sender_id || sender_id === receiver_id) {
        return res.status(400).json({
          message:
            "Les deux utilisateurs doivent être différents pour une conversation privée",
        });
      }

      // Vérification si les utilisateurs existent
      const receiver = await User.findById(receiver_id);
      if (!receiver) {
        return res.status(404).json({
          message: "Utilisateur destinataire non trouvé.",
        });
      }

      // Verifie si une conversation privee existe deja entre les deux utilisateur
      const existingConversation = await Conversation.findOne({
        type: "private",
        $or: [
          // retourne le resultat qui est true
          { receiver_id, sender_id },
          { receiver_id: sender_id, sender_id: receiver_id },
        ],
      }).populate("sender_id receiver_id", "nom");

      if (existingConversation) {
        return res.status(200).json({
          message: "Cette conversation existe déjà.",
          conversation: existingConversation,
        });
      }
    } else if (type === "group") {
      if (!group_id) {
        return res.status(400).json({
          success: false,
          message: "Le groupe est requis pour une conversation de groupe.",
        });
      }

      // verifie si la conversation de groupe existe deja
      const existingGroupConversation = await Conversation.findOne({
        type: "group",
        group_id: group_id,
      }).populate("group_id", "nom");

      if (existingGroupConversation) {
        return res.status(200).json({
          message: "Cette conversation de groupe existe déjà.",
          conversation: existingGroupConversation,
        });
      }

      // Vérification si le groupe existe
      const group = await Group.findById(group_id);
      if (!group) {
        return res.status(404).json({ message: "Groupe non trouvé." });
      }

      // Vérification : l'utilisateur doit être membre du groupe avec un createurId = req.user._id;
    } else {
      return res.status(400).json({
        success: false,
        message: "Le type de conversation doit être 'privee' ou 'groupe'.",
      });
    }

    // Creation conversation
    const conversation = await Conversation.create({
      type,
      receiver_id,
      sender_id,
      group_id,
    });
    res.status(201).json({
      success: true,
      conversation: conversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la conversation",
      error: error.message,
    });
  }
};

// recuperer une conversation par son ID
exports.getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("sender_id", "nom")
      .populate("receiver_id", "nom")
      .populate("group_id", "nom");

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation introuvable.",
      });
    }

    res.status(200).json({
      success: true,
      conversation: conversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la conversation.",
      error: error.message,
    });
  }
};

// Recuperer les conversations d'un utilisateur (privee et de groupes)
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user_id;

    const privateConversations = await Conversation.find({
      type: "private",
      $or: [{ receiver_id: userId }, { sender_id: userId }],
    }).populate("receiver_id sender_id", "nom");

    const groupConversations = await Conversation.find({
      type: "group",
      group_id: {
        $in: await Group.find({
          membres: userId,
        }).distinct("_id"),
      },
    }).populate("group_id");

    res.status(200).json({
      success: true,
      privateConversations: privateConversations,
      groupConversations: groupConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des conversations.",
      error: error.message,
    });
  }
};

// Mettre a jour une conversation
exports.updateConversation = async (req, res) => {
  try {
    const { type, receiver_id, group_id } = req.body;
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        message: "Conversation non trouvée.",
      });
    }

    if (conversation.type === "private") {
      if (receiver_id && receiver_id !== conversation.receiver_id) {
        // changement de destinataire
        const receiver = await User.findById(receiver_id);
        if (!receiver) {
          return res
            .status(404)
            .json({ message: "Utilisateur destinataire non trouvé." });
        }

        conversation.receiver_id = receiver_id;
      }
    } else if (conversation.type === "group" && group_id) {
      // Modification d'une conversation de groupe : vérifier que l'utilisateur est admin du groupe
      const group = await Group.findById(group_id);
      if (!group) {
        return res.status(404).json({
          message: "Groupe non trouvé.",
        });
      }

      const isAdmin = await Membre.findOne({
        user_id: req.user._id,
        group_id: group_id,
        role_id: await Role.findOne({ type: "admin" }).select("_id"),
      });

      if (!isAdmin) {
        return res.status(403).json({
          message:
            "Seuls les administrateurs peuvent modifier une conversation de groupe.",
        });
      }

      conversation.group_id = group_id;
    }

    /*const updatedConversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedConversation) {
      return res.status(404).json({
        message: "Conversation non trouve",
      });
    } */

    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation mis a jour avec succes",
      updatedConversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise a jour de la conversation",
      error: error.message,
    });
  }
};

// Supprimer une conversation
exports.deleteConversation = async (req, res) => {
  try {
    /*const deletedConversation = await Conversation.findByIdAndDelete(
      req.params.id
    );

    if (!deletedConversation) {
      return res.status(404).json({
        message: "Conversation non trouve",
      });
    } */

    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        message: "Conversation non trouvée.",
      });
    }

    // verifie si une conversation est group, seul admin peuvent la supprimer
    if (conversation.type === "group") {
      const isAdmin = await Membre.findOne({
        user_id: req.user._id,
        group_id: conversation.group_id,
        role_id: await Role.findOne({ type: "admin" }).select("_id"),
      });

      if (!isAdmin) {
        return res.status(403).json({
          message:
            "Seuls les administrateurs peuvent supprimer une conversation de groupe.",
        });
      }
    }

    // Supprimer tout les messages
    await Message.deleteMany({ conversation_id: id });
    // suppression de la conversation
    const deletedConversation = await Conversation.findByIdAndDelete(id);

    if (!deletedConversation) {
      return res.status(404).json({
        message: "Conversation introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Conversation supprime avec succes",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la conversation",
      error: error.message,
    });
  }
};

// reccuperation de toutes les conversations
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate("sender_id", "nom")
      .populate("receiver_id", "nom")
      .populate("group_id", "nom");

    res.status(200).json({
      success: true,
      conversations: conversations,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Erreur lors de la récupération des conversations",
      error: error.message,
    });
  }
};

// Recuperation des messages d'une conversation (avec pagination)
exports.getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const messages = await Message.find({ conversation_id: conversation_id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender_id", "nom");

    if (!messages) {
      return res.status(404).json({
        message: "Messages introuvable",
      });
    }

    const totalMessages = await Message.countDocuments({
      conversation_id: conversation_id,
      //$text: { $search: query}
    });
    res.status(200).json({
      success: true,
      messages: messages,
      currentPage: page,
      totalMessages: totalMessages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des messages de la conversation",
      error: error.message,
    });
  }
};

/* 

// Creation d'une conversation
exports.createConversation = async (req, res) => {
  try {
    const { type, sender_id, receiver_id, group_id } = req.body;

    // verification des utilisateurs et du groupes
    if (type === "group" && !group_id) {
      return res.status(400).json({
        message:
          "Le groupe doit être spécifié pour une conversation de type group",
      });
    }

    const newConversation = new Conversation({
      type,
      sender_id,
      receiver_id,
      group_id,
    });

    await newConversation.save();
    res.status(201).json(newConversation);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la création de la conversation",
      error,
    });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate("sender_id")
      .populate("receiver_id")
      .populate("group_id");

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation introuvable",
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération de la conversation",
      error,
    });
  }
};


// Mise à jour d'une conversation
exports.updateConversation = async (req, res) => {
  try {
    const updatedConversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedConversation) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }
    res.status(200).json(updatedConversation);
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Erreur lors de la mise à jour de la conversation",
        error,
      });
  }
};

// Suppression d'une conversation
exports.deleteConversation = async (req, res) => {
  try {
    const deletedConversation = await Conversation.findByIdAndDelete(
      req.params.id
    );
    if (!deletedConversation) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }
    res.status(200).json({ message: "Conversation supprimée" });
  } catch (error) {
    res
      .status(400)
      .json({
        message: "Erreur lors de la suppression de la conversation",
        error,
      });
  }
};

*/
