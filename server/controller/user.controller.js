const User = require("../models/user.model");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const { generateToken } = require("../utils/jwt");
const bcrypt = require("bcrypt");

const path = require("path");
const fs = require("fs");

const { isValidObjectId } = require("mongoose");

// generer un URL complet pour l'avatar
const generateAvatarUrl = (req, filename) => {
  return `${req.protocol}://${req.get("host")}/uploads/avatar/${filename}`;
};

// Inscription d'un USER
exports.signup = async (req, res) => {
  try {
    const { nom, prenom, pseudo, email, mdp } = req.body;

    if (!nom || !prenom || !pseudo || !email || !mdp) {
      return res.status(400).json({
        message: "Tous les champs sont requis",
      });
    }

    // verifier si l'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Utilisateur deja existant",
      });
    }

    // hashage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mdp, salt);

    if (!hashedPassword) {
      console.error("Mot de passe non hacher", hashedPassword);
    }

    // Préparer l'avatar (chemin relatif ou public)
    //const avatarPath = req.file ? `/uploads/avatar/${req.file.filename}` : null;

    const avatarPath = req.file
      ? generateAvatarUrl(req, req.file.filename)
      : "";

    // Creer le nouvel utilisateur
    const newUser = new User({
      nom,
      prenom,
      email,
      pseudo,
      email,
      mdp: hashedPassword,
      avatar: avatarPath,
      date_inscription: new Date(),
    });

    await newUser.save();

    if (!newUser) {
      return res.status(404).json({
        error: "utilisateur non cree",
      });
    }

    // Genere le token
    const token = generateToken(newUser);

    console.log("Avatar recu :", req.file);
    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: { ...newUser.toObject(), token },
    });
  } catch (error) {
    console.error("Erreur de l'inscription :", error);
    res.status(500).json({
      success: false,
      message: " Erreur serveur lors de l'inscription",
      error: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { pseudo, email, mdp } = req.body;

    if (!pseudo || !email) {
      return res.status(400).json({
        success: false,
        message: "Pseudo et email requis.",
      });
    }

    // Rechrecher l'utilisateur par email ou pseudo
    /*const user = await User.findOne({
      $or: [{ pseudo }, { email }],
    }); */

    const user = await User.findOne({ email });
    // rehefa hampias bcrypt de miala le {mdp} de lasa if(!await bcrypt.compare(mdp, user.mdp))

    if (!user) {
      return res.status(404).json({
        message: " Email ou pseudo incorrect. Utilisateur non trouvé",
      });
    }

    // verifie le mot de passe
    const isPasswordValid = await bcrypt.compare(mdp, user.mdp);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    // Genrer un token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Connexion reussie",
      token,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
      error: error.message,
    });
  }
};

// methode pour generer un nouveau token en cas d'approche d'expiration
exports.refreshToken = async (req, res) => {
  try {
    const user = req.user || req.user?.id || req.user?._id;
    if (!req.user || !user) {
      console.error("Erreur: Utilisateur non authentifié.");

      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    // generer le nouveau token
    const newToken = generateToken(user);

    if (!newToken) {
      console.error("Erreur: Impossible de générer un nouveau token");
      return res.status(404).json({
        message: "Erreur lors de la generation du nouveau token ",
      });
    }

    res.status(200).json({
      succes: true,
      message: "Token renouvelé avec succès",
      token: newToken,
    });
  } catch (error) {
    console.error("Erreur lors du renouvellement du token :", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur du serveur lors du renouvellement du token",
      error: error.message,
    });
  }
};

// Reccuperation de tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const currentUserId = req.user || req.user?.id || req.user?._id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    if (!isValidObjectId(currentUserId)) {
      return res.status(400).json({
        message: "ID de l'user invalide",
      });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      isDeleted: { $ne: true },
    });
    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "Aucun utilisateur trouvé",
      });
    }
    res.status(200).json({
      success: true,
      message: "Voici tout les utilisateurs",
      users: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des utilisateurs",
      error: error.message,
    });
  }
};

// Reccuperation d'un utilisateur par ID
exports.getUserById = async (req, res) => {
  const userId = req.user.id || req.user._id;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    const userSecure = {
      nom: user.nom,
      prenom: user.prenom,
      pseudo: user.pseudo,
      avatar: user.avatar,
    };

    res.status(200).json({
      success: true,
      user: userSecure,
      // user: user,
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      message: " Erreur lors de la récupération de l'utilisateur",
      error: error.message,
    });
  }
};

// Reccuperation d'un utilisateur par ID
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user || req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    const user = await User.findById(userId).select("-mdp");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    // ajouter un prefixe HTTP si l'avatar est enregistrer comme chemin relatif
    /*user.avatar = user.avatar.startsWith("http")
      ? user.avatar
      : `${req.protocol}://${req.get("host")}/${user.avatar}`;
    */

    const avatarUrl = user.avatar
      ? generateAvatarUrl(req, path.basename(user.avatar))
      : null;

    res.status(200).json({
      success: true,
      message: "Voici l'utilisateur recuperer",
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        pseudo: user.pseudo,
        email: user.email,
        avatar: avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      message: " Erreur serveur lors de la récupération de l'utilisateur",
      error: error.message,
    });
  }
};

// Mise a jour de l'utilisateur
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user || req.user?._id || req.user?.id;
    const { oldPassword, newPassword, ...otherData } = req.body;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    let updateData = { ...otherData };

    // Vérification et hachage du mot de passe si demandé
    if (oldPassword && newPassword) {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "Utillisateur introuvable",
        });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.mdp);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Ancien mot de passe incorrect",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.mdp = hashedPassword;
    }

    // gestion de l'avatar
    if (req.file) {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "Utilisateur introuvable",
        });
      }

      // suppression de l'avatar existant
      if (user.avatar) {
        const oldAvatarPath = path.join(
          __dirname,
          "../uploads/avatar",
          path.basename(user.avatar)
          //user.avatar
        );
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      updateData.avatar = generateAvatarUrl(req, req.file.filename); // nouveau fichier
      //updateData.avatar = req.file.filename; // nouveau fichier
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-mdp");

    if (!updatedUser) {
      return res.status(404).json({
        message: "Échec de la mise à jour.Utilisateur introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mise à jour réussie",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de l'utilisateur :",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de l'utilisateur",
      error: error.message,
    });
  }
};

// Suppression d'un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user || req.user?._id || req.user?.id;

    if (!req.user || !req.user._id || !req.user.id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié",
      });
    }

    // marquer l'user comme supprimer au lieux de le supprimer
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        nom: "Utilisateur supprimé",
        prenom: "",
        pseudo: "Utilisateur supprimé",
        avatar: null,
      },
      { new: true }
    );
    // suppression de l'avatar existant
    if (updatedUser.avatar) {
      const avatarPath = path.join(
        __dirname,
        "../uploads/avatar",
        deleteUser.avatar
        //path.basename(deleteUser.avatar)
      );
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    if (!updatedUser) {
      return res.status(404).json({
        message: "Utilisateur non marquer comme supprimer",
      });
    }

    /*const deleteUser = await User.findByIdAndDelete(userId);

    if (!deleteUser) {
      return res.status(400).json({
        message: "Utilisateur introuvable",
      });
    } */

    /*if (deleteUser.avatar) {
      const avatarPath = path.join(
        __dirname,
        "../uploads/avatar",
        deleteUser.avatar
      );
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    } */

    res.status(200).json({
      success: true,
      message: "Compte utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de l'utilisateur :",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'utilisateur",
      error: error.message,
    });
  }
};

//recuperation de l'utilisateur avec le dernier message
exports.getUsersWithLastMessage = async (req, res) => {
  const userId = req.user || req.user.id || req.user._id;
  try {
    const users = await User.find().select("_id pseudo avatar");
    const userWithLastMessage = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          $or: [
            { sender_id: user._id, receiver_id: userId },
            { sender_id: userId, receiver_id: user._id },
          ],
        }).select("_id sender_id receiver_id");
        const lastMessage = await Message.find({
          user_id: user._id,
        })
          .sort({ createdAt: -1 })
          .select("_id contenu createdAt");

        return {
          ...user.toObject(),
          conversation: conversation,
          lastMessage: lastMessage,
        };
      })
    );

    if (!userWithLastMessage || userWithLastMessage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur reuperer avec leur ddernier messsage ",
      });
    }
    res.status(200).json({
      succes: true,
      message: "Voici la liste des Users avec leurs derniers message",
      data: userWithLastMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la recuperation des utilisateurs avec leurs derbier message",
      error: error.message,
    });
  }
};

// rechercher un utilisateur par pseudo et nom
exports.searchUser = async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query; // parametre de recherche
  const skip = (page - 1) * limit; // nombre de resultat a ignorer pour la page actuelle

  try {
    const users = await User.find({
      $text: { $search: query }, // utilise l'index textuel
    })
      .skip(skip) // appique le decalage pour la pagination
      .limit(parseInt(limit)) // limiter le nombre de resultats par pages
      .exec();

    if (users.length === 0) {
      return res.status(404).json({
        message: "Aucun utilisateur trouvé avec ce parametere",
      });
    }
    const totalUsers = await User.countDocuments({
      $text: { $search: query },
    });
    res.json({
      total: totalUsers,
      page,
      totalPages: Math.ceil(totalUsers / limit),
      users: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la recherche d'utilisateurs",
      error: error.message,
    });
  }
};
