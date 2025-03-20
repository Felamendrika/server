const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");

let io = null; // Instance globale

// let connectedUsers = [];
let connectedUsers = new Map();

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

    if (socket.user?.id) {
      connectedUsers.set(socket.user.id, {
        socketId: socket.id,
        activeConversation: null,
        lastSeen: Date.now(),
      });
    }

    socket.on("userConnected", () => {
      if (socket.user?.id) {
        socket.broadcast.emit("userOnline", { userId: socket.user.id });
        io.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
      }
    });

    socket.on("getOnlineUsers", () => {
      socket.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
    });

    socket.on("joinConversation", (conversation_id) => {
      if (socket.user?.id) {
        const userInfo = connectedUsers.get(socket.user.id);
        if (userInfo) {
          userInfo.activeConversation = conversation_id;
          connectedUsers.set(socket.user.id, userInfo);
        }
        socket.join(`conversation_${conversation_id}`);
        console.log(
          `User ${socket.user.id} a rejoint la conversation ${conversation_id}`
        );
      }
    });

    socket.on("leaveConversation", (conversation_id) => {
      if (socket.user?.id) {
        const userInfo = connectedUsers.get(socket.user.id);
        if (userInfo) {
          userInfo.activeConversation = null;
          connectedUsers.set(socket.user.id, userInfo);
        }
        socket.leave(`conversation_${conversation_id}`);
      }
    });

    //gestion de message
    socket.on("newMessage", (data) => {
      const { conversation_id, message, receiverId } = data;
      const roomName = `conversation_${conversation_id}`;

      //Emission aux utilisateurs dans la conversation
      io.to(roomName).emit("messageReceived", {
        message,
        conversation_id: conversation_id,
        senderId: socket.user.id,
        timestamp: Date.now(),
      });

      // mise a jour de la conversation pour le destinataire
      const receiverSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.user?.id === receiverId
      );

      if (receiverSocket) {
        receiverSocket.emit("conversationUpdated", {
          conversation_id,
          lastMessage: message,
        });
      }
      console.log(
        `Message envoyé dans la conversation ${conversation_id}:`,
        message
      );
    });

    socket.on("messageUpdated", (data) => {
      const { conversationId, message } = data;
      io.to(`conversation_${conversationId}`).emit("messageModified", {
        message,
        conversationId,
        timestamp: Date.now(),
      });

      io.emit("conversationUpdated", {
        conversationId,
        lastMessage: message,
      });

      console.log(`Message maj dans conversation ${conversationId}:`, message);
    });

    socket.on("messageDeleted", (data) => {
      const { conversationId, messageId } = data;
      io.to(`conversation_${conversationId}`).emit("messageDeleted", {
        messageId,
        conversationId,
        timestamp: Date.now(),
      });

      io.emit("conversationUpdated", {
        conversationId,
        lastMessage: { contenu: "Message supprimé", isDeleted: true },
      });

      console.log(`Message supprimer dans conversation ${conversationId}`);
    });

    socket.on("newPrivateConversation", (data) => {
      const { conversation, receiverId } = data;
      io.to(`user_${receiverId}`).emit("ConversationCreated", { conversation });
      console.log(
        `Nouvelle conversation créée pour l'utilisateur ${receiverId}`
      );
    });

    socket.on("conversationDeleted", (data) => {
      const { conversationId } = data;
      io.to(`conversation_${conversationId}`).emit("conversationRemoved", {
        conversationId,
      });
    });

    //GESTION DE GROUPE
    socket.on("groupCreated", (data) => {
      const { group, conversation, createur_id } = data;

      io.emit("newGroup", {
        group: group,
        conversation,
        createur_id: createur_id,
      });

      console.log("Groupe creer en direct :", group);
    });

    socket.on("groupModified", (data) => {
      const { group, membres } = data;
      io.to(`group_${group_id}`).emit("updateGroup", {
        group,
        membres,
      });
      console.log("Groupe modifier en direct :", group);
    });

    socket.on("groupDeleted", (data) => {
      const { groupId, conversationId } = data;
      io.emit("removeGroup", {
        groupId,
        conversationId,
      });
      console.log("Groupe supprimer en direct :", groupId);
    });

    /*socket.on("newGroupConversation", (data) => {
      const { conversation, groupId } = data;
      io.to(`group_${groupId}`).emit("groupConversationCreated", conversation);
    }); */

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
      const { conversationId, messageId, fichierId } = data;
      io.to(`conversation_${conversationId}`).emit("fileRemoved", {
        fichierId,
        messageId,
        conversationId,
      });
      console.log(
        `Fichier supprimé de la conversation ${data.conversation_id}`
      );
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
    socket.on("eventCreated", (data) => {
      if (data && data.event) {
        io.emit("newEvent", { event: data.event });
        console.log("Nouvel événement émis:", data.event);
      }
    });

    socket.on("eventUpdated", (data) => {
      if (data && data.event) {
        io.emit("eventModified", { event: data.event });
        console.log("Événement mis à jour:", data.event);
      }
      // io.emit("eventModified", {
      //   event: eventData.event,
      //   eventId: eventData.eventId,
      // });
      // console.log(`Événement mis à jour:`, eventData.event);
    });

    socket.on("eventDeleted", (data) => {
      if (data && data.eventId) {
        io.emit("eventRemoved", { eventId: data.eventId });
        console.log("Événement supprimé:", data.eventId);
      }
      // io.emit("eventRemoved", {
      //   eventId,
      // });
      // console.log(`Événement supprimé:`, eventId);
    });

    // GESTION DE DECONNEXION
    socket.on("disconnect", () => {
      if (socket.user?.id) {
        connectedUsers.delete(socket.user.id);
        socket.broadcast.emit("userOffline", { userId: socket.user?.id });
        io.emit("updateOnlineUsers", Array.from(connectedUsers.keys()));
      }
    });

    /*socket.on("userConnected", () => {
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

      socket.on("disconnect", () => {
      console.log(`Utilisateur déconnecté : ${socket.user.id}`);
      connectedUsers = connectedUsers.filter((id) => id !== socket.user?.id);
      io.emit("updateOnlineUsers", connectedUsers);
      socket.broadcast.emit("userOffline", { userId: socket.user?.id });
    });
    
    */
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
