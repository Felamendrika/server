const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");

let io = null; // Instance globale

let connectedUsers = [];

const initializeSocket = (server) => {
  // Config de socket.io
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173" || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    // transports: ["websocket", "polling"],
  });

  // Ajoutez la gestion des erreurs
  io.engine.on("connection_error", (err) => {
    console.log("Connection error:", err);
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // console.log("Token reçu:", token);

    if (!token) {
      console.log("Erreur: Token manquant");
      return next(new Error("Token manquant"));
    }

    try {
      const user = verifyToken(token);
      if (!user) {
        return next(new Error("Token invalide"));
      }
      socket.user = user; // attacher les infos de l'user au socket
      console.log("Socket pour user :", user);
      next();
    } catch (error) {
      return next(new Error("Authentification échouée"));
    }

    // const decoded = require("../utils/jwt").verifyToken(token);
    // // console.log("Token décodé:", decoded);
    // if (!decoded) {
    //   return next(new Error("Token invalide"));
    // }

    // socket.user = decoded.id;
    // console.log("Socket authentifié pour userId:", decoded.id);
    // next();
  });

  io.on("connection", (socket) => {
    console.log(`Utilisateur connecté : ${socket.user?.id}`);

    socket.on("userConnected", () => {
      if (!connectedUsers.includes(socket.user?.id)) {
        connectedUsers.push(socket.user?.id);
        io.emit("userOnline", { userId: socket.user?.id });
      }
      io.emit("updateOnlineUsers", connectedUsers);
    });

    // // Ajouter l'utilisateur au tableau
    // if (!connectedUsers.includes(socket.user?.id)) {
    //   connectedUsers.push(socket.user?.id);
    //   console.log(
    //     "Liste mise à jour des utilisateurs connectés:",
    //     connectedUsers
    //   );

    //   // Émettre l'événement userOnline
    //   io.emit("userOnline", { userId: socket.user?.id });
    // }
    // Émission explicite au nouveau client connecté
    // socket.emit("updateOnlineUsers", connectedUsers);

    // Répondre à la demande de liste
    socket.on("getOnlineUsers", () => {
      socket.emit("updateOnlineUsers", connectedUsers);
    });

    socket.on("joinConversation", (conversation_id) => {
      const room = `conversation_${conversation_id}`;
      socket.join(room);
      console.log(
        `User ${socket.user.id} a rejoint la conversation ${conversation_id}`
      );
    });

    socket.on("newMessage", (data) => {
      const { conversationId, message } = data;
      io.to(`conversation_${conversationId}`).emit("messageReceived", {
        message: data.message,
        conversationId: data.conversation_id,
      });
      console.log(
        `Message envoyé dans conversation ${conversationId} par ${socket.user.id}:`,
        message
      );
    });

    socket.on("messageUpdated", (data) => {
      const { conversation_id, message } = data;
      io.to(`conversation_${conversation_id}`).emit("messageModified", {
        message,
        conversation_id: conversation_id,
      });
    });

    socket.on("messageDeleted", (data) => {
      const { conversationId, messageId } = data;
      io.to(`conversation_${conversationId}`).emit("messageDeleted", {
        messageId,
        conversation_id: conversationId,
      });
    });

    socket.on("newPrivateConversation", (data) => {
      const { conversation, receiverId } = data;
      io.to(`user_${receiverId}`).emit("ConversationCreated", conversation);
    });

    socket.on("conversationDeleted", ({ conversationId }) => {
      io.to(`conversation_${conversationId}`).emit("conversationRemoved", {
        conversationId,
      });
    });

    socket.on("newGroupConversation", (data) => {
      const { conversation, groupId } = data;
      io.to(`group_${groupId}`).emit("groupConversationCreated", conversation);
    });

    socket.on("groupConversationDeleted", ({ conversationId, groupId }) => {
      io.to(`group_${groupId}`).emit("groupConversationRemoved", {
        conversationId,
        groupId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Utilisateur déconnecté : ${socket.user.id}`);
      connectedUsers = connectedUsers.filter((id) => id !== socket.user?.id);
      io.emit("updateOnlineUsers", connectedUsers);
    });
  });

  return io;
};

// fonction pour obtenir l'instance de socket.io
const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO n'as pas encore ete initialisé !");
  }

  return io;
};

module.exports = { initializeSocket, getIO };
/*
socket.on("joinConversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(
        `Utilisateur ${socket.userId} a rejoint la conversation ${conversationId}`
      );
    });

    //quitter la conversation
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(
        `Utilisateur ${socket.userId} a quitté la conversation ${conversationId}`
      );
    });

    // nouveau message
    socket.on("newMessage", (messageData) => {
      const room = `conversation_${messageData.conversationId}`;
      socket.to(room).emit("messageReceived", messageData);
    });

    // Message modifié
    socket.on("messageUpdated", (messageData) => {
      const room = `conversation_${messageData.conversation_id}`;
      socket.to(room).emit("messageModified", messageData);
    });

    // Message supprimé
    socket.on("messageDeleted", (messageData) => {
      const room = `conversation_${messageData.conversation_id}`;
      socket.to(room).emit("messageRemoved", messageData);
    });

    // Nouvelle conversation
    socket.on("newConversation", (conversationData) => {
      const { participants } = conversationData;
      participants.forEach((participantId) => {
        if (participantId !== socket.userId) {
          io.to(`user_${participantId}`).emit(
            "conversationCreated",
            conversationData
          );
        }
      });
    });

    // Conversation supprimée
    socket.on("conversationDeleted", (conversationData) => {
      const room = `conversation_${conversationData.conversationId}`;
      io.to(room).emit("conversationRemoved", conversationData);
    });

    // Gestion des notifications
    socket.on("messageNotification", (notificationData) => {
      const { receiverId, messageData } = notificationData;
      io.to(`user_${receiverId}`).emit("newMessageNotification", messageData);
    });

    // evenement groupe
    socket.on("joinGroup", (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User ${socket.userId} a rejoint le groupe ${groupId}`);
    });

    socket.on("leaveGroup", (groupId) => {
      console.log(`User ${socket.userId} left group ${groupId}`);
    });

    // notification de groupe
    socket.on("groupCreated", (groupData) => {
      io.emit("newGroup", groupData);
    });

    socket.on("groupUpdated", (groupData) => {
      io.to(`group_${groupData.groupId}`).emit("groupModified", groupData);
    });

    socket.on("groupDeleted", (groupId) => {
      io.emit("groupRemoved", { groupId });
    });

    socket.on("newMembre", ({ groupId, membreId, role }) => {
      io.to(`group_${groupId}`).emit("membreAdded", {
        groupId,
        membreId,
        role,
      });
    });

    socket.on("membreRemoved", ({ groupId, membreId }) => {
      io.to(`group_${groupId}`).emit("membreDeleted", { groupId, membreId });
    });

    socket.on("membreRoleUpdated", ({ groupId, membreId, newRole }) => {
      io.to(`group_${groupId}`).emit("membreRoleChanged", {
        groupId,
        membreId,
        newRole,
      });
    });

    socket.on("membreLeft", ({ groupId, membreId }) => {
      io.to(`group_${groupId}`).emit("membreLeftGroup", { groupId, membreId });
    });

*/
