const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");

// Inscription d'un USER
exports.signup = async (req, res) => {
  const { nom, prenom, pseudo, email, mdp, avatar } = req.body;

  try {
    // verifier sil'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Utilisateur deja existant",
      });
    }

    // hashage du mot de passe
    const hashedPassword = await bcrypt.hash(mdp, 10);

    // Creer le nouvel utilisateur
    const newUser = new User({
      nom,
      email,
      pseudo,
      email,
      mdp: hashedPassword,
      avatar,
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

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: newUser,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: " Erreur lors de l'inscription",
      error: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { pseudo, email, mdp } = req.body;

    // Rechrecher l'utilisateur par email ou pseudo
    const user = await User.findOne({ pseudo, email });

    if (!user) {
      return res.status(400).json({
        error: " Email ou pseudo incorrect",
      });
    }

    // verifie le mot de passe
    const isPasswordValid = await bcrypt.compare(mdp, user.mdp);

    if (!isPasswordValid) {
      return res.status(400).json({
        error: " Email ou mot de passe incorrect",
      });
    }

    // Genrer un token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Connexion reussie",
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message,
    });
  }
};

// Creation d'un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, pseudo, email, mdp, avatar } = req.body;
    const newUser = new User({
      nom,
      prenom,
      pseudo,
      email,
      mdp,
      avatar,
      date_inscription: new Date(),
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la creation de l'utilisateur",
      error,
    });
  }
};

// Reccuperation de tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la récupération de l'utilisateur",
      error,
    });
  }
};

// Reccuperation d'un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({
      message: " Erreur lors de la récupération de l'utilisateur",
      error,
    });
  }
};

// Mise a jour de l'utilisateur
exports.updateUser = async (req, res) => {
  try {
    const updateUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updateUser) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json(updateUser);
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la mise à jour de l'utilisateur",
      error,
    });
  }
};

// Suppression d'un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const deleteUser = await User.findByIdAndDelete(req.params.id);

    if (!deleteUser) {
      return res.status(400).json({
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la suppression de l'utilisateur",
      error,
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

    const totalUsers = await User.countDocuments({
      $text: { $search: query },
    });
    res.json({
      total: totalUsers,
      page,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur lors de la recherche d'utilisateurs",
      error,
    });
  }
};
