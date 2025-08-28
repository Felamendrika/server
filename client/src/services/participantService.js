import api from "./api";

// Ajouter un ou plusieurs participants à un événement
export const addParticipant = async (userIds, eventId) => {
  try {
    const response = await api.post("/participants/add", {
      user_ids: userIds,
      event_id: eventId,
    });

    console.log("Particiant ajouter :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'ajout des participants :", error);
    throw error.response?.data || error.message;
  }
};

// Récupérer tous les participants d'un événement
export const getParticipants = async (eventId) => {
  try {
    const response = await api.get(`/participants/event/${eventId}`);

    console.log(response.data.event);
    console.log("Participant event :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des participants :", error);
    throw error.response?.data || error.message;
  }
};

// Récupérer tous les événements auxquels l'utilisateur participe
export const getUserParticipatingEvents = async () => {
  try {
    const response = await api.get("/participants/event");

    console.log("Event aupauel user participe :", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des événements utilisateur :",
      error
    );
    throw error.response?.data || error.message;
  }
};

// Supprimer un participant d'un événement
export const removeParticipant = async (eventId, userId) => {
  try {
    const response = await api.delete(
      `/participants/${eventId}/delete/${userId}`
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la suppression du participant :", error);
    throw error.response?.data || error.message;
  }
};
