const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification.controller");
const auth = require("../middlewares/authMiddleware");

// Récupérer toutes les notifications de l'utilisateur connecté
router.get("/", auth, notificationController.getUserNotifications);

// Supprimer une notification précise
router.delete("/:id", auth, notificationController.deleteNotification);

// Supprimer toutes les notifications de l'utilisateur connecté
router.delete("/", auth, notificationController.clearUserNotifications);

module.exports = router;
