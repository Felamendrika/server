const express = require("express");
const router = express.Router();
const roleController = require("../controller/role.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes pour les Role
router.post("/create", authMiddleware, roleController.createRole);

//recuperer tous les roles
router.get("/", authMiddleware, roleController.getRoles);

//recuperrer role par ID
router.get("/:id", authMiddleware, roleController.getRoleById);

//router.put("/:id", roleController.updateRole);

// Supprimer un role
router.delete("/:id", authMiddleware, roleController.deleteRole);

module.exports = router;
