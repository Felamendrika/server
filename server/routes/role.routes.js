const express = require("express");
const router = express.Router();
const roleController = require("../controller/role.controller");

// Routes pour les Role
router.post("/create", roleController.createRole);

//recuperer tous les roles
router.get("/", roleController.getRoles);

//recuperrer role par ID
router.get("/:id", roleController.getRoleById);

//router.put("/:id", roleController.updateRole);

// Supprimer un role
router.delete("/:id", roleController.deleteRole);

module.exports = router;
