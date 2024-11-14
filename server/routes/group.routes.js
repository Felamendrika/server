const express = require("express");
const router = express.Router();
const groupController = require("../controller/group.controller");

// route pour les groupes

// creer un groupe
router.post("/create", groupController.createGroup);

//router.post("/create", checkRole("admin"), createGroup);

// Récupération de tous les groupes auxquels un utilisateur est membre
router.get("/user/:userId/group", groupController.getUsersGroups);

// Recup de tous les groupes
router.get("/", groupController.getGroups);

// Recup groupe par son ID
router.get("/:groupId", groupController.getGroupById);

// Recup de tous les membres d'un groupe
router.get("/:groupId/membres", groupController.getGroupMembres);

//Modif d'un groupe
router.put("/:groupId/update", groupController.updateGroup);

// Suppression d'un groupe
router.delete("/:groupId/delete", groupController.deleteGroup);

// Recherche de groupes
router.get("/search", groupController.searchGroup);

module.exports = router;
