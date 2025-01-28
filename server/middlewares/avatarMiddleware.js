const multer = require("multer");
const path = require("path");
const fs = require("fs");

// verification et creation du dossiers
const uploadDir = path.join(__dirname, "../uploads/avatar");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(
      /\s+/g,
      "_"
    )}`;
    cb(null, uniqueName);
  },
});

// filtrer les fichiers en images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // accepter le fichier
  } else {
    const error = new Error("Type d'image non autoriser");
    error.filepath = file.path;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter,
});

const avatarMiddleware = (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "Fichier trop volumineux. La taille maximale est de 2 MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Erreur lors de l'upload du photo de profile",
        error: err.message,
      });
    }

    next();
  });
};

module.exports = avatarMiddleware;
