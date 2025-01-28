const express = require("express");
const router = express.Router();
const eventController = require("../controller/event.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// route pour creer un evenement
router.post("/create", authMiddleware, eventController.createEvent);

// route pour recuperer tout les evenements
router.get("/", authMiddleware, eventController.getEvents);

// route pour recuperer un event par son ID
router.get("/:eventId", authMiddleware, eventController.getEventById);

// route pour recuperer les evenement a venir
router.get(
  "/event/upcoming",
  authMiddleware,
  eventController.getUpcomingEvents
);

// route pour recuperer les evenements passe
router.get("/event/past", authMiddleware, eventController.getPastEvents);

// route pour recuperer les evenement creer par un utilisateur connecter
router.get("/event/user", authMiddleware, eventController.getUserEvents);

// route pour MAJ event
router.put("/update/:eventId", authMiddleware, eventController.updateEvent);

// route pour supprimer un event
router.delete("/delete/:eventId", authMiddleware, eventController.deleteEvent);

// route pour la recherche d'evenement
router.get("/searchEvent", authMiddleware, eventController.searchEvents);

module.exports = router;
