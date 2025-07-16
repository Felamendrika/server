const Notification = require("../models/notif.model");
const { getIO, getUserSocketId } = require("../socket/socket");

/**
 * Crée une notification en base et émet un événement socket au destinataire connecté
 * @param {Object} param0
 * @param {String} param0.userId - Destinataire
 * @param {String} param0.fromUserId - Émetteur
 * @param {String} param0.type - Type de notification (message, event, group...)
 * @param {String} param0.message - Message de notification
 * @param {String} [param0.relatedId] - ID de l'élément concerné
 * @returns {Promise<Notification|null>}
 */
async function createNotification({
  userId,
  fromUserId,
  type,
  message,
  relatedId,
}) {
  try {
    const notif = new Notification({
      userId,
      fromUserId,
      type,
      message,
      relatedId,
    });
    await notif.save();

    // Émission socket temps réel
    const io = getIO();
    const socketId = getUserSocketId(userId.toString());
    if (io && socketId) {
      io.to(socketId).emit("notificationReceived", notif);
    }

    return notif;
  } catch (err) {
    // Log ou gestion d'erreur interne
    return null;
  }
}

module.exports = {
  createNotification,
};
