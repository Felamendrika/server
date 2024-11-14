const express = require("express");
const router = express.Router();
const participantController = require("../controller/participant.controller");

router.post("/add", participantController.addParticipant);
router.get("/event/:eventId", participantController.getParticipantsByEvent);

module.exports = router;
