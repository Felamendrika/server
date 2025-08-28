const multer = require("multer");
const path = require("path");
const fs = require("fs");

// verifie et creer le dossier 'uploads' si necessaire
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const uniqueName = `${file.originalname.replace(
      /\s+/g,
      "_"
    )}-${Date.now()}`;
    cb(null, uniqueName + extension);
  },
});

const limits = { fileSize: 2 * 1024 * 1024 * 1024 }; // limite à 2GB

// Filtrer les fichiers selon leur type
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Documents PDF
    "application/pdf",

    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",

    // Documents Microsoft Office
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow",

    // Documents OpenDocument
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
    "application/vnd.oasis.opendocument.graphics",

    // Fichiers texte et code
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "text/xml",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/typescript",

    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-bzip2",

    // Fichiers de design et graphiques
    "application/postscript",
    "application/illustrator",
    "application/photoshop",
    "image/vnd.adobe.photoshop",
    "application/x-photoshop",

    // Fichiers de base de données
    "application/x-sql",
    "application/x-database",
    "application/vnd.ms-access",

    // Fichiers de développement
    "application/x-python",
    "application/x-java",
    "application/x-c++",
    "application/x-csharp",
    "text/x-python",
    "text/x-java-source",
    "text/x-c++src",
    "text/x-csharp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // accepter le fichier
  } else {
    const error = new Error(
      `Type de fichier non autorisé: ${file.mimetype}. Types acceptés: PDF, images, documents Office, archives, code, etc.`
    );
    error.filepath = file.path; // ajoute le chemin pour le supprimer
    cb(error, false);
  }
};

// Création d'un middleware personnalisé pour suivre la progression
const uploadWithProgress = (req, res, next) => {
  const upload = multer({ storage, limits, fileFilter }).single("file");

  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "Le fichier est trop volumineux (limite: 2GB)",
            error: err.message,
          });
        }
      }
      return res.status(400).json({
        message: err.message || "Erreur lors du téléchargement",
        error: err,
      });
    }

    // Émettre un événement pour indiquer que le téléchargement est terminé
    if (req.file) {
      const io = require("../socket/socket").getIO();
      io.to(`conversation_${req.body.conversation_id}`).emit("uploadProgress", {
        filename: req.file.originalname,
        progress: 100,
        status: "completed",
      });
    }

    next();
  });
};

module.exports = uploadWithProgress;

/*
// a mettre avant le next()

const upload = multer({
  storage,
  limits,
  fileFilter: fileFilter,
});

// Middleware pour capturer et gerer les erreur multer
const uploadMiddleware = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // erreur liees a multer
      if (err.filepath && fs.existsSync(err.filepath)) {
        fs.unlinkSync(err.filepath);
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "Fichier trop volumineux. La taille maximale est de 5 MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Erreur lors de l'upload du fichier",
        error: err.message,
      });
    } else if (err) {
      // Erreur personalize
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
*/
