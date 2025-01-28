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

const limits = { fileSize: 10 * 1024 * 1024 }; // limite a 10Mo

// Filtrer les fichiers selon leur type
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
    "text/plain",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // aceper le fichier
  } else {
    const error = new Error("Type de fichier non autoriser");
    error.filepath = file.path; // ajoute le chemin pour le supprimer
    cb(error, false);
  }
};

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

    /* 
    //ajouter un chemin complet pour le fichier upload
    if(req.file) {
      const protocol = req.protocol
      const host = req.get("host")
      req.file.publicUrl = `${protocol}://${host}/uploads/${req.file.filename}`
    }
    */

    // si tout est OK, on passe au middleware suivant
    next();
  });
};

module.exports = uploadMiddleware;
