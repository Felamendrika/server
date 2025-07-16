const Notification = require("../models/notif.model");

// Récupérer toutes les notifications non lues de l'utilisateur connecté
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id });
    res.json(notifications);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des notifications." });
  }
};

// Supprimer une notification précise par ID
exports.deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!notif)
      return res.status(404).json({ message: "Notification non trouvée." });
    res.json({ message: "Notification supprimée." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
};

// Supprimer toutes les notifications de l'utilisateur connecté
exports.clearUserNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: "Toutes les notifications supprimées." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
};

/*/ Créer une notification (usage interne, pas exposé en route publique)
exports.createNotification = async ({
  userId,
  fromUserId,
  type,
  message,
  relatedId,
}) => {
  try {
    const notif = new Notification({
      userId,
      fromUserId,
      type,
      message,
      relatedId,
    });
    await notif.save();
    return notif;
  } catch (err) {
    // Log ou gestion d'erreur interne
    return null;
  }
}; */
