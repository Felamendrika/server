import api from "./api";
import { removeToken } from "../utils/tokenUtils";

export const fetchUserProfile = async () => {
  try {
    const response = await api.get("/users/profile");
    return response.data;
  } catch (error) {
    console.error("Erreur dans fetchUserProfile:", error.message);
    throw (
      error.response?.data ||
      "Erreur lors de la recuperation des informations de l'utilisateur"
    );
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get("/users/");
    return response.data;
  } catch (error) {
    console.error("Erreur dans getUsers :", error.message);
    throw (
      error.response?.data ||
      "Erreur lors de la recuperation de tous les utilisateurs inscrits"
    );
  }
};

export const updateUser = async (formData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };

    const response = await api.put("/users/update", formData, config);
    return response.data; // retourne les donnees mise a jour
  } catch (error) {
    console.error("Erreur dans updateUser:", error.message);
    throw (
      error.response?.data || "Erreur lors de la mise a jour des informations"
    );
  }
};

// Fonction pour la suppression de l'utilisateur
export const deleteUser = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await api.delete("/users/delete", config);
    if (token) removeToken(); // Supprime le token de l'utilisateur
    // console.log("Token apres suppression compte :", token);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || "Erreur lors de la suppression de l'utilisateur"
    );
  }
};
