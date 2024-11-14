const express = require("express");
const mongoose = require("mongoose");

const cors = require("cors");
const path = require("path");
const multer = require("multer");
//const bodyParser = require("body-parser"); // analyser les corps de requetes au format json

const port = process.env.PORT || 5000;
const dotenv = require("dotenv");

// FOnction express pour demarer le serveur
const app = express();

// Middleware
app.use(express.json());
//app.use(bodyParser.json());
dotenv.config();
app.use(cors()); //configuration de CORS pour les appel API

// Configuration du stockage des fichiers avec Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/"); // Dossier où les fichiers seront enregistrés
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // horodatage
  },
});

// Initialisation du Multer avec la configuration de stockage
const upload = multer({ storage: storage });

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

// Middleware pour gerer l'upload de fichiers
app.post("/upload", upload.single("fichier"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Aucun fichier sélectionné",
    });
  }

  // retourner l'URL du fichier telecharger
  res.status(200).jsonp({
    message: "Fichier chargé avec succés",
    fileUrl: `/uploads/${req.file.filename}`,
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

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

// Middleware d'erreur
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Serveur demarre sur le port ${port} `);
});
/*
// Renvoyer du contenu , reception les requetes et envoyer du DATA => GET
app.get("/menu", (req, res) => {
  res.status(200).json({
    message: "Bienvenu sur la Plateforme",
  });
});
*/
//Demarrer le serveur
