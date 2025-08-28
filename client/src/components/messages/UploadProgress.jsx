import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiCheck, FiPause, FiPlay, FiX } from "react-icons/fi";

/**
 * Composant d'affichage de la barre de progression d'upload d'un fichier.
 * Simule la progression et permet de mettre en pause, reprendre ou annuler l'upload.
 * Appelle onComplete(file) quand l'upload est terminé pour que le parent retire la barre.
 */
const UploadProgress = ({
  file,
  onCancel,
  onComplete, // Ajout de la prop onComplete
  isUploading = true,
  uploadStatus = "uploading",
}) => {
  // Pourcentage d'avancement de l'upload (0 à 100)
  const [progress, setProgress] = useState(0);
  // Statut local de l'upload (uploading, paused, completed, error, cancelled)
  const [status, setStatus] = useState(uploadStatus);
  // Vitesse d'upload simulée (en KB/s)
  const [speed, setSpeed] = useState(0);
  // Temps restant estimé (en secondes)
  const [timeRemaining, setTimeRemaining] = useState(0);
  // Timestamp du début de l'upload (pour calculer la vitesse)
  const [startTime, setStartTime] = useState(Date.now());

  // Synchronise le statut local avec la prop uploadStatus
  useEffect(() => {
    setStatus(uploadStatus);
    if (uploadStatus === "completed") {
      setProgress(100);
    }
  }, [uploadStatus]);

  // Simulation de l'upload : incrémente le pourcentage toutes les 200ms
  useEffect(() => {
    if (isUploading && status === "uploading") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setStatus("completed");
            clearInterval(interval);
            return 100;
          }
          // Incrément aléatoire pour simuler une progression réaliste
          const increment = Math.random() * 5 + 1;
          const newProgress = Math.min(prev + increment, 100);
          // Calcul de la vitesse et du temps restant
          const elapsed = (Date.now() - startTime) / 1000;
          const currentSpeed =
            ((newProgress / 100) * (file.size / 1024)) / elapsed;
          setSpeed(currentSpeed);
          const remaining = (elapsed * (100 - newProgress)) / newProgress;
          setTimeRemaining(remaining);
          return newProgress;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isUploading, status, startTime, file.size]);

  // Effet pour appeler onComplete(file) quand l'upload est terminé
  useEffect(() => {
    if (status === "completed" && onComplete) {
      onComplete(file);
    }
  }, [status, onComplete, file]);

  // Met en pause l'upload
  const handlePause = useCallback(() => {
    setStatus("paused");
  }, []);

  // Reprend l'upload
  const handleResume = useCallback(() => {
    setStatus("uploading");
    setStartTime(
      Date.now() - (((progress / 100) * (file.size / 1024)) / speed) * 1000
    );
  }, [progress, file.size, speed]);

  // Annule l'upload et prévient le parent
  const handleCancel = useCallback(() => {
    setStatus("cancelled");
    onCancel && onCancel(file);
  }, [onCancel, file]);

  // Formate la taille du fichier pour l'affichage
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Formate le temps restant pour l'affichage
  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Retourne l'icône correspondant au statut
  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case "paused":
        return <FiPause className="w-4 h-4 text-orange-500" />;
      case "completed":
        return <FiCheck className="w-4 h-4 text-green-500" />;
      case "error":
        return <FiAlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Retourne la couleur de la barre selon le statut
  const getStatusColor = () => {
    switch (status) {
      case "uploading":
        return "bg-blue-500";
      case "paused":
        return "bg-orange-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-3">
      {/* En-tête avec icône de statut, nom et taille du fichier */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {file.name}
            </h4>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        {/* Boutons de contrôle (pause, reprendre, annuler) */}
        <div className="flex items-center gap-2">
          {status === "uploading" && (
            <button
              onClick={handlePause}
              className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
              title="Pause"
            >
              <FiPause className="w-4 h-4" />
            </button>
          )}
          {status === "paused" && (
            <button
              onClick={handleResume}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Reprendre"
            >
              <FiPlay className="w-4 h-4" />
            </button>
          )}
          {status !== "completed" && status !== "error" && (
            <button
              onClick={handleCancel}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Annuler"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {/* Barre de progression */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Informations de progression */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{Math.round(progress)}%</span>
        {status === "uploading" && (
          <div className="flex items-center gap-4">
            {speed > 0 && <span>{speed.toFixed(1)} KB/s</span>}
            {timeRemaining > 0 && (
              <span>{formatTime(timeRemaining)} restant</span>
            )}
          </div>
        )}
        {status === "paused" && (
          <span className="text-orange-500">En pause</span>
        )}
        {status === "completed" && (
          <span className="text-green-500">Terminé</span>
        )}
        {status === "error" && <span className="text-red-500">Erreur</span>}
      </div>
    </div>
  );
};

// Validation des props pour sécuriser l'utilisation du composant
UploadProgress.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
  onComplete: PropTypes.func, // Ajout de la prop onComplete
  isUploading: PropTypes.bool,
  uploadStatus: PropTypes.oneOf([
    "uploading",
    "paused",
    "completed",
    "error",
    "cancelled",
  ]),
};

export default UploadProgress;
