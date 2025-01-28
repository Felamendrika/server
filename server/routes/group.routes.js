const express = require("express");
const router = express.Router();
const groupController = require("../controller/group.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// route pour les groupes

// creer un groupe
router.post("/create", authMiddleware, groupController.createGroup);

//router.post("/create", checkRole("admin"), createGroup);

// Récupération de tous les groupes auxquels un utilisateur est membre
router.get("/group/user", authMiddleware, groupController.getUsersGroups);

//router.get("/user/:userId/group", groupController.getUsersGroups);

// Recup de tous les groupes
router.get("/", authMiddleware, groupController.getGroups);

// Recup groupe par son ID
router.get("/:groupId", authMiddleware, groupController.getGroupById);

// Recup de tous les membres d'un groupe
router.get("/:groupId/membre", authMiddleware, groupController.getGroupMembres);

//Modif d'un groupe
router.put("/update/:groupId", authMiddleware, groupController.updateGroup);

// Suppression d'un groupe
router.delete("/delete/:groupId", authMiddleware, groupController.deleteGroup);

module.exports = router;
