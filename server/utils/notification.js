const Notification = require("../models/notif.model");
const { getIO, getUserSocketId } = require("../socket/socket");

// Types de notifications attendus :
// - "message" : message privé
// - "group_message" : message de groupe
// - "group_event" : gestion de groupe (ajout, suppression, rôle, départ)
// - "calendar_event" : événement calendrier

/**
 * Vérifie s'il existe déjà une notification identique non lue
 * @param {String} userId
 * @param {String} type
 * @param {String} relatedId
 * @returns {Promise<Boolean>}
 */
async function notificationExists(userId, type, relatedId) {
  const exists = await Notification.findOne({
    userId,
    type,
    relatedId,
  });
  return !!exists;
}

/**
 * Crée une notification en base et émet un événement socket au destinataire connecté
 * Empêche la création de doublons (même userId, type, relatedId)
 * @param {Object} param0
 * @param {String} param0.userId - Destinataire
 * @param {String} param0.fromUserId - Émetteur
 * @param {String} param0.type - Type de notification (voir doc)
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
    // Anti-doublon
    if (await notificationExists(userId, type, relatedId)) {
      return null;
    }
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

// Helpers pour chaque type de notification
async function notifyPrivateMessage({
  userId,
  fromUserId,
  message,
  conversationId,
}) {
  return createNotification({
    userId,
    fromUserId,
    type: "message",
    message,
    relatedId: conversationId,
  });
}

async function notifyGroupMessage({ userId, fromUserId, message, groupId }) {
  return createNotification({
    userId,
    fromUserId,
    type: "group_message",
    message,
    relatedId: groupId,
  });
}

async function notifyGroupEvent({ userId, fromUserId, message, groupId }) {
  return createNotification({
    userId,
    fromUserId,
    type: "group_event",
    message,
    relatedId: groupId,
  });
}

async function notifyCalendarEvent({ userId, fromUserId, message, eventId }) {
  return createNotification({
    userId,
    fromUserId,
    type: "calendar_event",
    message,
    relatedId: eventId,
  });
}

module.exports = {
  createNotification,
  notifyPrivateMessage,
  notifyGroupMessage,
  notifyGroupEvent,
  notifyCalendarEvent,
};
