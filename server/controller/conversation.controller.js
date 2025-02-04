const Conversation = require("../models/conversation.model");
const User = require("../models/user.model");
const Group = require("../models/group.model");
const Membre = require("../models/membre.model");
const Role = require("../models/role.model");
const Message = require("../models/message.model");

const mongoose = require("mongoose");
const { getIO } = require("../socket/socket");

// Utilitaire communs
const findAdminRoleId = async () => {
  const role = await Role.findOne({ type: "admin" }).select("_id");
  console.log(role);
  return role ? role._id : null;
};

// Creation de conversation
exports.createConversation = async (req, res) => {
  try {
    const { type, receiver_id } = req.body;

    if (!req.user || !req.user._id || !req.user._id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!["private", "group"].includes(type)) {
      return res.status(400).json({
        message: "Le type de conversation invalide",
      });
    }

    let response;
    const io = getIO();
    // Validation des types de conversation
    if (type === "private") {
      response = await createPrivateConversation(req);

      if (response.success && io) {
        const populatedConversation = await Conversation.findById(
          response.conversation._id
        )
          .populate("sender_id", "nom pseudo avatar")
          .populate("receiver_id", "nom pseudo avatar");

        io.to(`user_${response.conversation.receiver_id}`).emit(
          "conversationCreated",
          {
            // type: "private",
            conversation: populatedConversation,
          }
        );
      }
    } else if (type === "group") {
      response = await createGroupConversation(req);

      if (response.success && io) {
        const groupMembres = await Membre.find({
          group_id: response.conversation.group_id,
        });
        groupMembres.forEach((membre) => {
          if (membre.user_id.toString() !== req.user._id.toString()) {
            io.to(`user_${membre.user_id}`).emit("groupConversationCreated", {
              // type: "group",
              conversation: response.conversation,
            });
          }
        });
      }
    }

    if (response.success) {
      return res.status(201).json(response);
    } else {
      return res.status(response.status || 500).json(response);
    }
  } catch (error) {
    console.error("Erreur dans CreateConversation: ", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la conversation",
      error: error.message,
    });
  }
};

// sous methode pour es conversations private
async function createPrivateConversation(req) {
  const { receiver_id } = req.body;
  const sender_id = req.user?._id;

  if (
    !mongoose.Types.ObjectId.isValid(sender_id) ||
    !mongoose.Types.ObjectId.isValid(receiver_id)
  ) {
    return {
      success: false,
      status: 400,
      message: "ID utilisateur emetteur ou destinataire invalide",
    };
  }

  // une conversation privee necessite 02 users
  if (!receiver_id || !sender_id || sender_id === receiver_id) {
    return {
      success: false,
      status: 400,
      message:
        "Les deux utilisateurs doivent être différents pour une conversation privée",
    };
  }

  const [receiver, sender] = await Promise.all([
    User.findById(receiver_id),
    User.findById(sender_id),
  ]);

  if (!receiver || !sender) {
    return {
      success: false,
      status: 404,
      message: "Utilisateur émetteur ou destinataire introuvable",
    };
  }

  // Verifie si une conversation privee existe deja entre les deux utilisateur
  const existingConversation = await Conversation.findOne({
    type: "private",
    $or: [
      // retourne le resultat qui est true
      { receiver_id, sender_id },
      { receiver_id: sender_id, sender_id: receiver_id },
    ],
  }).populate("sender_id receiver_id", "nom pseudo avatar");

  if (existingConversation) {
    return {
      success: true,
      message: "Cette conversation existe déjà.",
      conversation: existingConversation,
    };
  }
  // Creation conversation
  const newConversation = new Conversation({
    type: "private",
    receiver_id,
    sender_id,
  });

  await newConversation.save();

  // populate des donnees necessaire pour la reponse
  const populateConversation = await Conversation.findById(newConversation._id)
    .populate("sender_id", "nom pseudo avatar")
    .populate("receiver_id", "nom pseudo avatar");

  return {
    success: true,
    message: "Conversation creer",
    conversation: populateConversation,
    //data: newConversation,
  };
}

// sous methode creation de groupe
async function createGroupConversation(req) {
  const { group_id } = req.body;
  const user_id = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(group_id)) {
    return {
      success: false,
      status: 400,
      message: "ID du groupe invalide",
    };
  }
  if (!group_id) {
    return {
      success: false,
      status: 400,
      message: "Le groupe est requis pour une conversation de groupe.",
    };
  }
  const groupExists = await Group.findById(group_id);
  //const groupExists = await Group.exists({ _id: group_id });
  if (!groupExists) {
    return { success: false, status: 404, message: "Groupe introuvable" };
  }

  // Verifie si l'utilisateur est membre du groupe
  const isMembre = await Membre.findOne({
    user_id: req.user._id || req.user.id || req.user,
    group_id,
  });
  if (!isMembre) {
    return {
      success: false,
      status: 403,
      message: "Vous devez être membre du groupe pour créer une conversation ",
    };
  }
  // verifie si la conversation de groupe existe deja
  const existingGroupConversation = await Conversation.findOne({
    type: "group",
    group_id: group_id,
  }).populate("group_id", "nom description");

  if (existingGroupConversation) {
    return {
      success: true,
      //status: 200,
      message: "Cette conversation de groupe existe déjà.",
      conversation: existingGroupConversation,
    };
  }

  const newConversation = new Conversation({
    type: "group",
    group_id,
    sender_id: user_id,
  });

  await newConversation.save();

  const populatedConversation = await Conversation.findById(
    newConversation._id
  ).populate("group_id", "nom description");

  return {
    success: true,
    message: "Conversation de groupe creer",
    conversation: populatedConversation,
  };
}

// recuperer une conversation par son ID
exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversation) {
      return res.status(404).json({
        message: "ID de conversation non recuperer",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "ID conversation invalide",
      });
    }

    const conversation = await Conversation.findById(conversationId) // recupere l'ID fourni dans l'URL
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
      message: "Voici la conversation ",
      conversation: conversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de la conversation.",
      error: error.message,
    });
  }
};

// Recuperer les conversations d'un utilisateur (privee )
exports.getUserPrivateConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "ID user invalide",
      });
    }

    const privateConversations = await Conversation.find({
      type: "private",
      $or: [{ receiver_id: userId }, { sender_id: userId }],
    })
      .populate("receiver_id", "nom prenom avatar pseudo isDeleted")
      .populate("sender_id", "nom prenom avatar pseudo isDeleted");

    if (!privateConversations || privateConversations.length === 0) {
      return res.status(404).json({
        message: "Aucune conversation privee pour cet utilisateur",
      });
    }

    const conversationWithLastMessage = await Promise.all(
      privateConversations.map(async (conversation) => {
        // Vérification de l'existence des participants
        if (!conversation.sender_id || !conversation.receiver_id) {
          return null;
        }

        //Identifier le participant oppose
        const otherParticipant =
          String(conversation.sender_id._id) === String(userId)
            ? conversation.receiver_id
            : conversation.sender_id;

        // recuperation du dernier message
        const lastMessage = await Message.findOne({
          conversation_id: conversation._id,
        })
          .sort({ date_envoi: -1 })
          .select("contenu user_id date_envoi")
          .populate("user_id", "nom pseudo avatar isDeleted")
          .populate("fichier", "nom type chemin_chemin");

        return {
          _id: conversation._id,
          type: conversation.type,
          otherParticipant: otherParticipant
            ? {
                _id: otherParticipant._id,
                nom: otherParticipant.nom,
                prenom: otherParticipant.prenom,
                avatar: otherParticipant.avatar,
                pseudo: otherParticipant.pseudo,
                isDeleted: otherParticipant.isDeleted,
              }
            : null,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          lastMessage: lastMessage || null,
        };
      })
    );

    const validConversations = conversationWithLastMessage.filter(
      (conversation) => conversation !== null
    );

    res.status(200).json({
      success: true,
      message: "Voici les conversations de l'utilisateur",
      conversation: validConversations,
      // groupConversations: groupConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des conversations privée de l'utilisateur",
      error: error.message,
    });
  }
};

// recuperation conversations de groupes
exports.getUserGroupConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "ID user invalide",
      });
    }

    // Vérifier d'abord si l'utilisateur existe toujours
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
      });
    }

    const groupIds = await Membre.find({
      user_id: userId,
    })
      .distinct("group_id")
      .then((ids) => ids.filter((id) => mongoose.Types.ObjectId.isValid(id)));
    //.populate("sender_id", "nom pseudo avatar");
    if (!groupIds)
      return res
        .status(404)
        .json({ message: "utilisateur non membre du groupe" });

    // Vérifier que les groupes existent toujours
    const existingGroups = await Group.find({
      _id: { $in: groupIds },
    }).select("_id");

    const validGroupIdsSet = new Set(
      existingGroups.map((g) => g._id.toString())
    );

    const groupConversations = await Conversation.find({
      type: "group",
      group_id: { $in: Array.from(validGroupIdsSet) },
    })
      .populate("group_id", "nom description createur_id")
      .lean();

    const validConversations = await Promise.all(
      groupConversations
        .filter((conv) => conv && conv.group_id) // Filtrer les conversations invalides
        .map(async (conversation) => {
          try {
            const groupMembres = await Membre.find({
              group_id: conversation.group_id._id,
              user_id: { $ne: userId },
            }).populate("user_id", "nom pseudo avatar isDeleted");

            const lastMessage = await Message.findOne({
              conversation_id: conversation._id,
            })
              .sort({ createdAt: -1 })
              .select("contenu date_envoi user_id")
              .populate("user_id", "nom pseudo avatar isDeleted");

            return {
              ...conversation,
              otherParticipants: groupMembres
                .filter((membre) => membre.user_id) // Filtrer les membres invalides
                .map((membre) => ({
                  _id: membre.user_id._id,
                  nom: membre.user_id.nom,
                  pseudo: membre.user_id.pseudo,
                  avatar: membre.user_id.avatar,
                  isDeleted: membre.user_id.isDeleted,
                })),
              lastMessage: lastMessage || null,
            };
          } catch (error) {
            console.error(
              `Erreur pour la conversation ${conversation._id}:`,
              error
            );
            return null;
          }
        })
    );

    const filteredConversations = validConversations.filter(
      (conversation) => conversation !== null
    );

    if (!filteredConversations || filteredConversations.length === 0) {
      return res.status(404).json({
        message: "Aucun conversation de groupe concernant cet utilisateur",
      });
    }
    res.status(200).json({
      success: true,
      message: "Voici les conversations de groupes de l'utilisateur",
      data: filteredConversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des conversations de l'utilisateur",
      error: error.message,
    });
  }
};

// Supprimer une conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({
        message: "ID utilisateur connecter non recuperer",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "ID conversation invalide",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation non trouvée.",
      });
    }

    // Supprimer tout les messages
    await Message.deleteMany({ conversation_id: conversation._id });

    // suppression de la conversation
    const deletedConversation = await Conversation.findByIdAndDelete(
      conversationId
    );

    if (!deletedConversation) {
      return res.status(404).json({
        message: "Conversation introuvable",
      });
    }

    const io = getIO();
    if (io) {
      if (conversation.type === "private") {
        io.to(`conversation_${conversationId}`).emit("conversationRemoved", {
          conversationId,
        });
        // const otherUserId =
        //   conversation.sender_id.toString() === userId.toString()
        //     ? conversation.receiver_id
        //     : conversation.sender_id;

        // io.to(`user_${otherUserId}`).emit("conversationRemoved", {
        //   conversationId,
        //   // type: "private",
        // });
      } else if (conversation.type === "group") {
        const groupMembres = await Membre.find({
          group_id: conversation.group_id,
        });

        groupMembres.forEach((membre) => {
          io.to(`user_${membre.user_id}`).emit("groupConversationRemoved", {
            conversationId,
            groupId: conversation.group_id,
          });
        });
        /*io.to(`group_${conversation.group_id}`).emit(
          "groupConversationRemoved",
          {
            conversationId,
            groupId: conversation.group_id,
          }
        );*/
        // const groupMembres = await Membre.find({
        //   group_id: conversation.group_id,
        // });
        // groupMembres.forEach((membre) => {
        //   if (membre.user_id.toString() !== userId.toString()) {
        //     // io.to(`user_${membre.user_id}`).emit("groupConversationRemoved", {
        //     //   conversationId,
        //     //   // type: "group",
        //     // });
        //   }
        // });
      }
    }

    res.status(200).json({
      success: true,
      message: "Conversation supprime avec succes",
    });
  } catch (error) {
    console.error("Erreur dans deleteConversation: ", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de la conversation",
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

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({
        message: "Aucune conversation recuperer",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voici la liste de tous les conversations",
      conversations: conversations,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Erreur serveur lors de la récupération des conversations",
      error: error.message,
    });
  }
};

// Recuperation des messages d'une conversation (avec pagination)
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        message: "ID conversation invalide",
      });
    }

    const messages = await Message.find({
      conversation_id: conversationId,
    })
      .populate({
        path: "conversation_id",
        select: "sender_id receiver_id type",
        populate: [
          { path: "sender_id", select: "nom prenom pseudo avatar isDeleted" },
          { path: "receiver_id", select: "nom prenom pseudo avatar isDeleted" },
        ],
      })
      .populate({
        path: "user_id",
        select: " _id pseudo nom prenom avatar isDeleted",
      })
      .populate("fichier", "nom type taille chemin_fichier")
      .sort({ date_envoi: 1 });

    if (!messages) {
      return res.status(404).json({
        message: "Messages introuvable",
      });
    }

    const totalMessages = await Message.countDocuments({
      conversation_id: conversationId,
    });
    res.status(200).json({
      success: true,
      message: "Voici les messages present dans la conversation",
      data: messages,
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
