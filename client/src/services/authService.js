import api from "./api";
import { saveToken, removeToken } from "../utils/tokenUtils";

const authService = {
  // inscription d'un utilisateur
  signup: async (userData) => {
    try {
      const response = await api.post("/users/signup", userData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error.message);
      throw error.response?.data || error; // Propager l'erreur pour la gérer dans le composant
    }
  },

  // connexion
  login: async (credentials) => {
    try {
      const response = await api.post("/users/login", credentials);
      //const { token, user } = response.data;
      const token = response.data.token;

      if (response.data.token) {
        console.log("Token apres login :", token);
      }

      if (token) saveToken(token);

      return response.data;
      //return user;
    } catch (error) {
      console.error("Erreur lors de la connexion :", error.message);
      throw error.response?.data || error;
    }
  },

  // renouvellement du token (déjà géré via les intercepteurs, mais peut être explicitement appelé)
  refreshToken: async () => {
    try {
      const response = await api.post("/users/refresh-token");
      const { token } = response.data;

      if (token) saveToken(token);
      return token;
    } catch (error) {
      console.error("Erreur lors du renouvellement du token :", error);
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    removeToken();
  },
};

export default authService;
