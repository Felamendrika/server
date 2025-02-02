const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");

let io = null; // Instance globale

let connectedUsers = [];

const initializeSocket = (server) => {
  // Config de socket.io
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    // transports: ["websocket", "polling"],
  });

  // Ajoutez la gestion des erreurs
  io.engine.on("connection_error", (err) => {
    console.log("Connection error:", err);
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

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
  });

  io.on("connection", (socket) => {
    console.log(`Utilisateur connecté : ${socket.user?.id}`);

    socket.on("userConnected", () => {
      if (!connectedUsers.includes(socket.user?.id)) {
        connectedUsers.push(socket.user?.id);
        // io.emit("userOnline", { userId: socket.user?.id });
        io.emit("updateOnlineUsers", connectedUsers);
        socket.broadcast.emit("userOnline", { userId: socket.user?.id });
      }
    });

    // Répondre à la demande de liste
    socket.on("getOnlineUsers", () => {
      socket.emit("updateOnlineUsers", connectedUsers);
    });

    socket.on("joinConversation", (conversation_id) => {
      socket.conversation_id = conversation_id;
      const room = `conversation_${conversation_id}`;
      socket.join(room);
      console.log(
        `User ${socket.user.id} a rejoint la conversation ${conversation_id}`
      );
    });

    socket.on("leaveConversation", (conversation_id) => {
      if (socket.conversation_id === conversation_id) {
        const room = `conversation_${conversation_id}`;
        socket.leave(room);
        console.log(
          `User ${socket.user.id} a quitter la conversation ${conversation_id}`
        );
      }
    });

    socket.on("newMessage", (data) => {
      const { conversationId, message } = data;
      io.to(`conversation_${conversationId}`).emit("messageReceived", {
        message,
        conversationId,
      });

      // Notification pour les utilisateurs dans la conversation
      // if (
      //   connectedUsers.includes(receiverId) &&
      //   socket.conversation_id === conversationId
      // ) {
      //   io.to(`user_${receiverId}`).emit("newMessageNotification", {
      //     senderId: socket.user.id,
      //     // senderName: socket.user.pseudo,
      //     conversationId: conversationId,
      //     message: `Nouveau message de ${socket.user?.pseudo}`,
      //   });
      // }

      console.log(
        `Message envoyé dans conversation ${conversationId} par ${socket.user?.id}:`,
        message
      );
    });

    socket.on("messageUpdated", (data) => {
      const { conversationId, message } = data;
      io.to(`conversation_${conversationId}`).emit("messageModified", {
        message,
        conversation_id: conversationId,
      });

      console.log(`Message maj dans conversation ${conversationId}:`, message);
    });

    socket.on("messageDeleted", (data) => {
      const { conversationId, messageId } = data;
      io.to(`conversation_${conversationId}`).emit("messageDeleted", {
        messageId,
        conversation_id: conversationId,
      });

      console.log(`Message supprimer dans conversation ${conversationId}`);
    });

    socket.on("newPrivateConversation", (data) => {
      const { conversation, receiverId } = data;
      io.to(`user_${receiverId}`).emit("ConversationCreated", { conversation });
    });

    socket.on("conversationDeleted", (data) => {
      io.to(`conversation_${data.conversationId}`).emit("conversationRemoved", {
        conversationId: data.conversationId,
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

    // gestion de fichiers
    socket.on("fileUploaded", (data) => {
      const { conversationId, messageId, fichier } = data;
      io.to(`conversation_${data.conversationId}`).emit("newFile", {
        fichier,
        messageId,
        conversationId,
      });
      console.log(
        `Nouveau fichier uploadé dans conversation ${conversationId}`
      );
    });

    socket.on("fileDeleted", (data) => {
      io.to(`conversation_${data.conversationId}`).emit("fileRemoved", {
        fichierId: data.fichierId,
        messageId: data.messageId,
        conversationId: data.conversationId,
      });
      console.log(`Fichier supprimé de la conversation ${data.conversationId}`);
    });

    socket.on("conversationFilesUpdated", (data) => {
      io.to(`conversation_${data.conversationId}`).emit(
        "refreshConversationFiles",
        {
          conversationId: data.conversationId,
        }
      );
      console.log(
        `Liste des fichiers mise à jour pour la conversation ${data.conversationId}`
      );
    });

    // GESTION DE FICHIERS
    socket.on("eventCreated", (eventData) => {
      io.emit("newEvent", eventData);
      console.log(`Nouvel événement créé:`, eventData);
    });

    socket.on("eventUpdated", (eventData) => {
      io.to(`event_${eventData.eventId}`).emit("eventModified", eventData);
      console.log(`Événement mis à jour:`, eventData);
    });

    socket.on("eventDeleted", ({ eventId }) => {
      io.emit("eventRemoved", { eventId });
      console.log(`Événement supprimé:`, eventId);
    });

    socket.on("disconnect", () => {
      console.log(`Utilisateur déconnecté : ${socket.user.id}`);
      connectedUsers = connectedUsers.filter((id) => id !== socket.user?.id);
      io.emit("updateOnlineUsers", connectedUsers);
      socket.broadcast.emit("userOffline", { userId: socket.user?.id });
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
