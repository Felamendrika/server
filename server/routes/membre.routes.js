const express = require("express");
const router = express.Router();
const membreController = require("../controller/membre.controller");

// Routes pour les membres
router.post("/add", membreController.addMembre);
router.post("/create", membreController.createMembre);

// recuperer un membre par son ID
router.get("/:membreId", membreController.getMembreById);

// Router pour recuperer tous les membres
router.get("/", membreController.getMembre);

// Route pour recup tous les membres d'un groupe
router.get("/group/:groupId", membreController.getMembresByGroup);
// Modifier role de membre
router.put("/:membreId/update-role", membreController.updateMembreRole);

// Supprimer un membre
router.delete(
  "/:membreId/group/:groupId",
  membreController.removeMembreFromGroup
);

module.exports = router;
