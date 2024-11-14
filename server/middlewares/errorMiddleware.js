const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Définit le code de statut HTTP, par défaut à 500 (erreur serveur interne)
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorHandler;
