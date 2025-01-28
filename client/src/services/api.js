import axios from "axios";
import { getToken, removeToken, saveToken } from "../utils/tokenUtils";
import { jwtDecode } from "jwt-decode";

const api = axios.create({
  baseURL: `http://localhost:5000/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// variable pour stocker les requetes en attente
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
};

//verifie si un token est valide ou expirer
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch (error) {
    console.log("Erreur lors du decodage du token:", error);
    return true;
  }
};

// intercepteur pour inclure le token JWT dans les requete
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("Token :", token);
    if (token) {
      if (isTokenExpired(token)) {
        console.warn("Token expiré, tentative de rafraîchissement...");
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Verifie si l'erreur est une 401 et si ce n'est pas une requete pour le renouvellement du token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/refresh-token")
    ) {
      originalRequest._retry = true;

      // si un rafraichissemnt est deja en cours
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (error) => reject(error),
          });
        });
      }

      // sinon on redemmare le processus de rafraichissement
      isRefreshing = true;

      try {
        const token = getToken();

        // requete pour obtenir un nouveau token
        const refreshResponse = await api.post(
          "/users/refresh-token",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const newToken = refreshResponse.data.token;
        saveToken(newToken);
        processQueue(null, newToken);
        isRefreshing = false;

        // reessayer la requete initiale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        removeToken();
        console.error("Session expirée, veuillez vous reconnecter.");
        // window.location.href = "/login"
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
