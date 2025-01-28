import api from "./api";

// recuprer toutes les conversations privee d'un utilisateur
export const getUserPrivateConversation = async () => {
  try {
    const response = await api.get("conversations/private/conversation");
    return response.data;
  } catch (err) {
    console.log(
      "Erreur lors de la recuperation des conversation privee de l'user",
      err.message
    );
    throw err.response?.data || err.message;
  }
};

// recuprer toutes les conversations de groupe d'un utilisateur
export const getUserGroupConversation = async () => {
  try {
    const response = await api.get("conversations/group/conversation");
    return response.data;
  } catch (err) {
    console.log(
      "Erreur lors de la recuperation des conversations de groupe de l'user",
      err.message
    );
    throw err.response?.data || err.message;
  }
};

// creer une conversation
export const createConversation = async ({ type, receiver_id, group_id }) => {
  try {
    const response = await api.post("/conversations/create", {
      type,
      receiver_id,
      group_id,
    });
    // console.log(response.data);

    if (response.data) {
      // console.log("Conversation créée :", response.data.conversation);
      return response.data;
    } else {
      throw new Error(
        response.data?.message ||
          "Erreur lors de la création de la conversation"
      );
    }
  } catch (err) {
    console.log(
      "Erreur dans createConversation :",
      err.response?.data || err.message
    );
    throw (
      err.response?.data ||
      err.message ||
      "Erreur lors de la creation de la conversation"
    );
  }
};

// supprimer une conversation
export const deleteConversation = async (conversationId) => {
  try {
    const response = await api.delete(
      `/conversations/delete/${conversationId}`
    );
    return response.data;
  } catch (err) {
    console.log("Erreur dans deleteConversation:", err.message);
    throw (
      err.response?.data || "Erreur lors de la suppression de la conversation"
    );
  }
};

// recuperer tout es messages d'un conversation
export const getMessages = async (conversationId) => {
  try {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  } catch (err) {
    console.log("Erreur dans getMessages: ", err.message);
    throw (
      err.response?.data ||
      "Erreur lors de la recuperation des messages dans cette conversation "
    );
  }
};

export const getConversationById = async (conversationId) => {
  try {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  } catch (err) {
    console.log("Erreur dans getConversationById: ", err.message);
    throw (
      err.response?.data ||
      "Erreur lors de la recuperation de la conversation par son Id"
    );
  }
};
