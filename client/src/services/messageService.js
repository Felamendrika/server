import api from "./api";

const createMessage = async (conversationId, contenu, file) => {
  try {
    // Validation côté Frontend
    if (!conversationId) {
      throw new Error("conversation_id est requis pour créer un message.");
    }

    const formData = new FormData();
    formData.append("conversation_id", conversationId);
    if (contenu) formData.append("contenu", contenu);
    if (file) formData.append("file", file);

    if (file && file.size > 5 * 1024 * 1024) {
      throw new Error("Le fichier est trop volumineux ");
    }

    const response = await api.post("/messages/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.messages;
  } catch (error) {
    console.error("Erreur dans createMessage :", error);
    throw (
      error.response?.data ||
      error.message ||
      "Erreur lors de la creation du message"
    );
  }
};

// recuperer un message par son ID
const getMessageById = async (messageId) => {
  try {
    const response = await api.get(`/messages/${messageId}`);
    return response.data.message;
  } catch (error) {
    console.error("Erreur dans getMessageById :", error);
    throw error.response?.data || "Erreur lors de la récupération du message.";
  }
};

// mettre a jour un message
const updateMessage = async (messageId, contenu) => {
  try {
    const response = await api.put(`/messages/update/${messageId}`, {
      contenu,
    });
    return response.data.message; //response.data
  } catch (error) {
    console.error("Erreur dans updateMessage :", error);
    throw error.response?.data || "Erreur lors de la mise a jour du message";
  }
};

// supprimer un message
const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/messages/delete/${messageId}`);

    return response.data;
  } catch (error) {
    console.error("Erreur das deleteMessage :", error);
    throw error.response?.data || "Erreur lors de la suppression du message";
  }
};

const messageService = {
  createMessage,
  getMessageById,
  updateMessage,
  deleteMessage,
};

export default messageService;
