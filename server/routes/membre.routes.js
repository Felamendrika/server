const express = require("express");
const router = express.Router();
const membreController = require("../controller/membre.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes pour les membres
router.post("/add", authMiddleware, membreController.addMembre);

// recuperer un membre par son ID
router.get("/:membreId", authMiddleware, membreController.getMembreById);

// Router pour recuperer tous les membres
router.get("/", authMiddleware, membreController.getMembre);

// Route pour recup tous les membres d'un groupe
router.get(
  "/:groupId/group",
  authMiddleware,
  membreController.getMembresByGroup
);

// Modifier role de membre
router.put(
  "/updateRole/:membreId",
  authMiddleware,
  membreController.updateMembreRole
);

// Supprimer un membre
router.delete(
  "/remove/:membreId",
  authMiddleware,
  membreController.removeMembreFromGroup
);

//quiter grupe
router.delete(
  "/leave-group/:groupId",
  authMiddleware,
  membreController.leaveGroup
);
//router.delete("/:membreId/group/:groupId",membreController.removeMembreFromGroup);

module.exports = router;
