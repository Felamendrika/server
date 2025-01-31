import api from "./api";

// uploader et creer un fichier
/*export const uploadFile = async (file, messageId) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("messageId", messageId);

    const response = await api.post("/fichiers/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erreur dans Upload fichier: ", error);
    throw (
      error.response?.data ||
      error.message ||
      "Erreur lors de l'upload et la creation du fichier"
    );
  }
};
*/

export const uploadFile = async (formData, messageId) => {
  try {
    const response = await api.post(`/fichiers/upload`, formData, {
      params: { message_id: messageId },
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Erreur dans uploadFile :", error);
    throw (
      error.response?.data ||
      error.message ||
      "Erreur lors de l'upload du fichier"
    );
  }
};

// recuperation d'un fichier par son ID
export const downloadFile = async (fichierId) => {
  try {
    const response = await api.get(`/fichiers/${fichierId}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.log("Erreur dans getFileById :", error);
    throw (
      error.response?.data ||
      error.message ||
      "Erreur lors de la recuperation du fichier par son ID"
    );
  }
};

//recuperer fichier associes a un message
export const getFilesByMessage = async (messageId) => {
  try {
    const response = await api.get(`/fichiers/message/${messageId}`);
    return response.data;
  } catch (error) {
    console.log("Erreur dans getFilesByMessage de fileService: ", error);
    throw error.response?.data || error.message;
  }
};

// recuperer tout les fichiers d'un conversation
export const getFilesByConversation = async (conversationId) => {
  try {
    const response = await api.get(`/fichiers/conversation/${conversationId}`);
    console.log(response.data.fichiers);
    // console.log(response.data);
    // console.log("Fichier dans conversation :", response.data.fichiers);
    return response.data;
  } catch (error) {
    console.log("Erreur dans getFilesByConversation: ", error);
    throw (
      error.response?.data ||
      error.message ||
      "Erreur lors de la recuperation des fichiers de la conversation"
    );
  }
};

// supprimer un fichier
export const deleteFile = async (fichierId) => {
  try {
    const response = await api.delete(`/fichiers/delete/${fichierId}`);
    console.log(
      "URL appelée pour suppression :",
      `/fichiers/delete/${fichierId}`
    );
    return response.data;
  } catch (error) {
    console.log("Erreur dans deleteFile de fileService: ", error);
    throw (
      error.response?.data ||
      error.message ||
      "Erreur lors de la suppression de fichier"
    );
  }
};

// previsualisation d'un fichier
export const previewFile = async (fichierId) => {
  try {
    const response = await api.get(`/fichiers/preview/${fichierId}`, {
      responseType: "blob", // recuperer le fichier en tant que blob
    });

    const url = URL.createObjectURL(response.data);
    return url;
  } catch (error) {
    error.log("Erreur dans previewFile de fileService: ", error);
    throw (
      error.response?.data ||
      error.message ||
      "Erreur lors de la previsualisation du fichier"
    );
  }
};

export const getAllFiles = async () => {
  try {
    const response = await api.get("/fichiers");
    return response.data;
  } catch (error) {
    console.error("Erreur dans getAllFiles :", error.message);
    throw (
      error.response?.data ||
      "Erreur ors de la recuperation de tous les fichiers"
    );
  }
};
