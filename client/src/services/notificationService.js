import api from "./api";

// Récupérer toutes les notifications de l'utilisateur connecté
const getNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || "Erreur lors de la récupération des notifications"
    );
  }
};

// Supprimer une notification précise
const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || "Erreur lors de la suppression de la notification"
    );
  }
};

// Supprimer toutes les notifications de l'utilisateur connecté
const clearNotifications = async () => {
  try {
    const response = await api.delete("/notifications");
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || "Erreur lors de la suppression des notifications"
    );
  }
};

const notificationService = {
  getNotifications,
  deleteNotification,
  clearNotifications,
};

export default notificationService;
