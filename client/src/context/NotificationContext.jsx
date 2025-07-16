import PropTypes from "prop-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import notificationService from "../services/notificationService";
import { useSocket } from "./SocketContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les notifications à la connexion
  // Charger les notifications non lues au chargement
  /*useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []); */

  // reception en temps reel
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on("notificationReceived", handleNotification);
    return () => {
      socket.off("notificationReceived, handleNotification");
    };
  }, [socket]);

  // Ajouter une notification (ex: via socket)
  const addNotification = useCallback((notif) => {
    setNotifications((prev) => {
      // Évite les doublons
      if (prev.some((n) => n._id === notif._id)) return prev;
      return [notif, ...prev];
    });
    // Toast pour les messages
    if (notif.type === "message") {
      toast.info(notif.message);
    }
  }, []);

  // Supprimer une notification précise
  /*const deleteNotification = useCallback(async (id) => {
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  }, []); */

  // Supprimer toutes les notifications (marquer comme lues)
  const clearNotifications = useCallback(async () => {
    try {
      await notificationService.clearNotifications();
      setNotifications([]);
    } catch (error) {
      console.error(
        "Erreur lors de la suppression des notifications: ",
        error.message
      );
      throw error;
    }
  }, []);

  // Nombre de notifications non lues
  const unreadCount = notifications.length;

  const markAsRead = useCallback(async (notifId) => {
    try {
      await notificationService.deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
    } catch (error) {
      console.error(
        "Erreur lors de la suppression du notifications: ",
        error.message
      );
      throw error;
    }
  }, []);

  // clic sur une notification ( navigation /contexteul + suppression )
  const handleNotificationClick = useCallback(
    async (notif, onNavigate) => {
      if (onNavigate) onNavigate(notif);
      await markAsRead(notif._id);
    },
    [markAsRead]
  );

  // Écoute socket pour les notifications temps réel
  useEffect(() => {
    if (!socket) return;
    const onNotification = (notif) => {
      addNotification(notif);
    };
    socket.on("notificationReceived", onNotification);
    return () => {
      socket.off("notificationReceived", onNotification);
    };
  }, [socket, addNotification]);

  // Charger à la connexion
  // useEffect(() => {
  //   fetchNotifications();
  // }, [fetchNotifications]);

  const contextValue = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    clearNotifications,
    markAsRead,
    handleNotificationClick,
    //deleteNotification,
    // fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotification doit être utilisé dans un NotificationProvider"
    );
  return context;
};
