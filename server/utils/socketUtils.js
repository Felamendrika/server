const { io } = require("../server");

const sendNotification = (eventType, data, recipientId) => {
  io.to(recipientId).emit("notification", {
    type: eventType,
    message: data.message,
    sate: new Date(),
  });
};

module.exports = { sendNotification };
