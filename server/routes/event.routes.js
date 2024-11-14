const express = require("express");
const router = express.Router();
const eventController = require("../controller/event.controller");

router.post("/create", eventController.createEvent);
router.get("/", eventController.getEvents);
router.get("/:id", eventController.getEventById);
router.put("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);

module.exports = router;
