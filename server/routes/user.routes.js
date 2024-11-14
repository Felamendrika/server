const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Routes pour les utilisateurs
router.post("/create", userController.createUser);
router.get("/", authMiddleware, userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

router.get("/search", userController.searchUser);

// Route pour l'inscription
router.post("/signup", userController.signup);

// Route pour la connexion
router.post("/login", userController.login);

module.exports = router;
