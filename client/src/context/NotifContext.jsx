/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
// /context/NotificationContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") }, // Utiliser le JWT
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
    });

    // Gérer les différents types de notifications
    socket.on("notification", (data) => {
      setNotifications((prev) => [data, ...prev]); // Ajouter la nouvelle notification
      setUnreadCount((prev) => prev + 1);
      toast.info(data.message); // Afficher un toast
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};
