/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { getToken, removeToken, saveToken } from "../utils/tokenUtils";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
import { fetchUserProfile } from "../services/userService";

import { useSocket } from "./SocketContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token , setToken] = useState(localStorage.getItem("token") || "")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate();
  const { socket } = useSocket();

  // verification si un token est valide
  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token)
      return decoded.exp * 1000 > Date.now() // compare l'expiration avec l'heure actuel

    } catch (error) {
      console.log("Erreur verification si token valide:", error)
      return false
    }
  }

  // rafraichissemnt du token
  const refreshToken = async () => {
    try {
      const newToken = await authService.refreshToken()
      if (newToken) {
        saveToken(newToken)
        setToken(newToken)

        const decoded = jwtDecode(newToken)
        setUser(decoded)
      }
    } catch (error) {
      console.error ("Erreur lors du rafraîchissement du token :", error);
      logout()
    }
  }

  // chargement des info user depuis le token 
  const loadUserFromToken = async () => {
    try {
      const userProfile = await fetchUserProfile()
      setUser(userProfile.user)
      // console.log("Utilisateur Profile :", userProfile.user)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Erreur lors du chargement des informations utilisateur :", error);
    }
  }

  // connexion
  const login = async (credentials) => {
    try {
      // const response = await authService.login(credentials)
      const { user, token } = await authService.login(credentials)
      setUser(user || jwtDecode(token))
      setToken(token)

      saveToken(token)
      console.log("Token sauvergarde apres login:", token)
      setIsAuthenticated(true)

      // Initialiser le socket immédiatement avec le nouveau token
      socket?.emit("userConnected");
      socket?.emit("getOnlineUsers");

      toast.success("Connexion reussie ! Bienvenue sur la plateforme");
      navigate("/dashboard")
    } catch (error) {
      toast.error(error.message)
      console.error("Erreur lors de la connexion :", error);

    }
  }

  // inscription 
  const signup = async (userData) => {
    try {
      const response = await authService.signup(userData)
      //await authService.signup(userData)

      toast.success("Inscription réussie ! Veuillez vous connecter.")
      navigate('/login')
      return response;

    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      toast.error(error.message)
      //const message = error || "Erreur d'inscription"
      throw error
    }
  }

  // deconnexion
  const logout = () => {
    removeToken()
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    toast.info("Déconnexion réussie.", { position: "top-right" })
    navigate("/login")
  }

  // initialisation
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = getToken()
      if (storedToken && isTokenValid(storedToken)) {
        loadUserFromToken(storedToken)
        setToken(storedToken)

        // Initialiser socket si token valide
        if (socket) {
          socket.emit("userConnected");
          socket.emit("getOnlineUsers");
        }

      } else if (storedToken) {
        refreshToken()
      }
    }
    initializeAuth()
  }, [])

  // rafraichissement periodique du token moins de 5min restant avant l'expiration
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && isTokenValid(token)) {
        const decoded = jwtDecode(token)
        const timeLeft = decoded.exp * 1000 - Date.now()

        if(timeLeft < 5 * 60 * 1000) {
          refreshToken()
        }
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [token])

  const contextValue = { user, token, setUser, isAuthenticated, login, signup, logout, refreshToken}

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext)
  if(!context) {
    throw new Error('useAuth doit etre utiliser dans un AuthProvider')
  }
  return context
}
