import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { userId: localStorage.getItem("token") },
  transports: ["websocket"],
  reconnection: true,
}); // Adresse du serveur

// Écouter les notifications
socket.on("eventUpdatedNotification", (data) => {
  console.log("Notification reçue :", data);
  alert(data.message); // Remplacez par un toast ou une autre méthode
});

// Enregistrer l'utilisateur une fois connecté
// const userId = "user123"; // ID de l'utilisateur connecté
// socket.emit("registerUser", userId);

export default socket;
