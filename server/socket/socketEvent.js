const socketEvents = {
  // Événements utilisateurs
  USER_CONNECTED: "userConnected",
  USER_DISCONNECTED: "userDisconnected",
  USER_STATUS_CHANGED: "userStatusChanged",

  // Événements messages
  NEW_MESSAGE: "newMessage",
  MESSAGE_UPDATED: "messageUpdated",
  MESSAGE_DELETED: "messageDeleted",

  // Événements groupes
  GROUP_CREATED: "groupCreated",
  GROUP_UPDATED: "groupUpdated",
  GROUP_DELETED: "groupDeleted",
  MEMBER_ADDED: "memberAdded",
  MEMBER_REMOVED: "memberRemoved",
  MEMBER_LEFT: "memberLeft",

  // Événements événements
  EVENT_CREATED: "eventCreated",
  EVENT_UPDATED: "eventUpdated",
  EVENT_DELETED: "eventDeleted",
};

module.exports = socketEvents;
