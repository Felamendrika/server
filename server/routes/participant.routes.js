const express = require("express");
const router = express.Router();
const participantController = require("../controller/participant.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/add", authMiddleware, participantController.addParticipant);

// route pour recuperer les participants d'un evenement
router.get(
  "/event/:eventId",
  authMiddleware,
  participantController.getEventsParticipant
);

// route pour recuperer les evenement auquel l'user participe
router.get(
  "/event",
  authMiddleware,
  participantController.getParticipantEvents
);
// router.get("/user/event", authMiddleware, participantController.getParticipantEvents)

// route pour recuperer tout les participant
router.get("/", authMiddleware, participantController.getAllParticipants);

// route pour supprimer un participant
router.delete(
  "/:eventId/delete/:userId",
  authMiddleware,
  participantController.removeParticipant
);

module.exports = router;
