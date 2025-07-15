const express = require("express");
const mongoose = require("mongoose");
// importation pour le SOCKET.IO
const http = require("http");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser"); // analyser les corps de requetes au format json

// FOnction express pour demarer le serveur
const app = express();

const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 3000;

// creation du serveur HTTP
const server = http.createServer(app);

const { initializeSocket } = require("./socket/socket");
const io = initializeSocket(server);

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); //configuration de CORS pour les appel API

// Importation des routes
const userRoutes = require("./routes/user.routes");
const groupRoutes = require("./routes/group.routes");
const eventRoutes = require("./routes/event.routes");
const conversationRoutes = require("./routes/conversation.routes");
const messageRoutes = require("./routes/message.routes");
const participantRoutes = require("./routes/participant.routes");
const membreRoutes = require("./routes/membre.routes");
const roleRoutes = require("./routes/role.routes");
const fichierRoutes = require("./routes/fichier.routes");

// Importation du middleWare de gestion d'erreur
const errorHandler = require("./middlewares/errorMiddleware");

// COnnection MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log("Erreur lors de la connexion", err));

// const setupSocketHandlers = require("./socket/handlers");
// setupSocketHandlers(io);

// Utilisation des routes
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/membres", membreRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/fichiers", fichierRoutes);

// Middleware pour servir les fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads/avatar",
  express.static(path.join(__dirname, "uploads/avatar"))
);

// Middleware d'erreur
app.use(errorHandler);

// demarre le serveur
server.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

// Nettoyer les fichiers orphelins toutes les 24 heures
const { cleanupOrphanedFiles } = require("./controller/fichier.controller");
setInterval(async () => {
  console.log("Début du nettoyage des fichiers orphelins...");
  await cleanupOrphanedFiles();
}, 24 * 60 * 60 * 1000); // 24 heures

// Export 'io' pour les controller
module.exports = { app, server };

/*
// Middleware pour suivre les connexion user
const activeUsers = new Map();

// Socket.io : Gestion de connexion
io.on("connection", (socket) => {
  console.log(`Utilisateur connecté : ${socket.id}`);

  // ajouter un utilisateur actif
  socket.on("userConnected", (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`utilisateur connecter : ${userId} (Socket: ${socket.id})`);

    // Diffusion de la liste des users en ligne
    io.emit("updatedActiveUsers", Array.from(activeUsers.keys()));
  });

  // rejoindre un room conversation ou conversation_id = conversationId
  socket.on("joinConversation", (conversationId) => {
    if (mongoose.isValidObjectId(conversationId)) {
      const roomName = `conversation_${conversationId}`;
      socket.join(roomName);
      console.log(`Utilisateur ${socket.id} a rejoint la room ${roomName}`);
    } else {
      console.warm(`ID de conversation invalide : ${conversationId}`);
    }
  });

  // Quitter un room specifique
  socket.on(`leaveConversation`, (conversationId) => {
    const roomName = `conversation_${conversationId}`;
    socket.leave(roomName);
    console.log(`Utilisateur ${socket.id} a quitté la room ${roomName}`);
  });

  // Écouter un événement personnalisé
  socket.on("sendMessage", (data) => {
    const { conversationId, contenu, message } = data;

    if (mongoose.isValidObjectId(conversationId)) {
      const roomName = `conversation_${conversationId}`;
      io.to(roomName).emit("receiveMessage", { contenu });
      console.log(`Message envoyé dans ${roomName}: ${message}`);
    } else {
      console.warm(`ID de conversation invalide pour sendMessage`);
    }
    console.log("Message recu: ", data);
  });

  // ecouter les messages envoyes dans un groupe
  socket.on("groupMessage", (data) => {
    const { groupId, senderId, message } = data;

    if (mongoose.isValidObjectId(groupId)) {
      // Broadcast aux autres membres du groupe
      io.to(groupId).emit("groupMessage", {
        senderId,
        message,
        timeStamp: new Date(),
      });
      console.log(`ID de groupe invalide pour groupMessage`);
    }

    console.log(`Message dans le groupe ${groupId} : ${message}`);
  });

  // ecouter la requete pour rejoindre un groupe
  socket.on("joinGroup", (groupId) => {
    if (mongoose.isValidObjectId(groupId)) {
      socket.join(groupId); // rejoindre un room specifique au groupe
      console.log(`Utilisateur ${socket.id} a rejoint le groupe : ${groupId}`);
    } else {
      console.warm(`ID de grope invalide pour joinGroup : ${groupId}`);
    }
  });

  socket.on("leaveGroup", (groupId) => {
    if (mongoose.isValidObjectId(groupId)) {
      socket.leave(groupId);
      io.to(groupId).emit("memberLeft", socket.id);
      console.log(`User left group ${groupId}`);
    } else {
      console.warm(`ID du groupe invalide pour leaveGroupe`);
    }
  });

  socket.on("groupUpdated", (groupData) => {
    io.to(groupData.groupId).emit("groupInfoUpdated", groupData);
    console.log(`Group ${groupData.groupId} updated`);
  });

  socket.on("groupDeleted", (groupId) => {
    io.emit("groupRemoved", groupId);
    console.log(`Group ${groupId} deleted`);
  });

  // Gestion des événements de membre (Membre)
  socket.on("memberAdded", (groupId, memberId) => {
    io.to(groupId).emit("newMemberAdded", memberId);
    console.log(`Member ${memberId} added to group ${groupId}`);
  });

  socket.on("memberRemoved", (groupId, memberId) => {
    io.to(groupId).emit("memberRemovedFromGroup", memberId);
    console.log(`Member ${memberId} removed from group ${groupId}`);
  });

  // Gestion des événements d'événements (Event)
  socket.on("eventCreated", (eventData) => {
    io.emit("eventCreated", eventData);
    console.log(`Event created: ${eventData.title}`);
  });

  socket.on("eventUpdated", (eventData) => {
    io.emit("eventUpdated", eventData);
    console.log(`Event updated: ${eventData.title}`);
  });

  socket.on("eventDeleted", (eventId) => {
    io.emit("eventRemoved", eventId);
    console.log(`Event ${eventId} deleted`);
  });

  // Gestion des événements de participant (Participant)
  socket.on("participantAdded", (eventId, participantId) => {
    io.to(eventId).emit("newParticipantAdded", participantId);
    console.log(`Participant ${participantId} added to event ${eventId}`);
  });

  socket.on("participantRemoved", (eventId, participantId) => {
    io.to(eventId).emit("participantRemovedFromEvent", participantId);
    console.log(`Participant ${participantId} removed from event ${eventId}`);
  });

  // Gerer la deconnexion
  socket.on("disconnect", () => {
    console.log(`Utilisateur déconnecté : ${socket.id}`);
    for (const [userId, id] of activeUsers.entries()) {
      if (id === socket.id) {
        activeUsers.delete(userId);
        console.log(`Utilisateur déconnecté : ${userId} `);
        io.emit("updateActiveUsers", Array.from(activeUsers.keys()));
      }
    }
  });

  socket.on("error", (err) => {
    console.error(`Erreur Socket.IO : ${err.message}`);
  });
});

*/
