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
  // Nouvel état pour la conversation active (private ou group)
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState(null);

  // Charger les notifications non lues au chargement
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data || []);
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  // Réception en temps réel
  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif) => {
      console.log("[SOCKET][Notification] Reçue:", notif); // DEBUG
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      // Toast uniquement pour les messages privés, et si la conversation n'est PAS active
      if (
        notif.type === "message" &&
        notif.relatedId !== activeConversationId
      ) {
        toast.info(notif.message);
      }
      // Pas de toast pour les autres types (group_message, group_event, calendar_event)
    };
    socket.on("notificationReceived", handleNotification);
    return () => {
      socket.off("notificationReceived", handleNotification);
    };
  }, [socket, activeConversationId]);

  // Helpers pour highlight et badges
  const hasUnreadForConversation = useCallback(
    (conversationId) =>
      notifications.some(
        (n) => n.type === "message" && n.relatedId === conversationId
      ),
    [notifications]
  );

  const hasUnreadForGroup = useCallback(
    (groupId) =>
      notifications.some(
        (n) => n.type === "group_message" && n.relatedId === groupId
      ),
    [notifications]
  );

  const hasUnreadForCalendar = useCallback(
    () => notifications.some((n) => n.type === "calendar_event"),
    [notifications]
  );

  const hasUnreadForGroupEvent = useCallback(
    (groupId) =>
      notifications.some(
        (n) => n.type === "group_event" && n.relatedId === groupId
      ),
    [notifications]
  );

  // Compteurs spécifiques pour les badges
  const unreadMessageCount = notifications.filter(
    (n) => n.type === "message"
  ).length;
  const unreadGroupMessageCount = notifications.filter(
    (n) => n.type === "group_message"
  ).length;
  const unreadCalendarCount = notifications.filter(
    (n) => n.type === "calendar_event"
  ).length;
  const unreadGroupEventCount = notifications.filter(
    (n) => n.type === "group_event"
  ).length;

  // Marquer comme lu
  const markAsRead = useCallback(async (notifId) => {
    await notificationService.deleteNotification(notifId);
    setNotifications((prev) => prev.filter((n) => n._id !== notifId));
  }, []);

  // Tout marquer comme lu
  const clearNotifications = useCallback(async () => {
    await notificationService.clearNotifications();
    setNotifications([]);
  }, []);

  // Clic sur une notif
  const handleNotificationClick = useCallback(
    async (notif, onNavigate) => {
      if (onNavigate) onNavigate(notif);
      await markAsRead(notif._id);
    },
    [markAsRead]
  );

  const contextValue = {
    notifications,
    unreadCount: notifications.length,
    unreadMessageCount,
    unreadGroupMessageCount,
    unreadCalendarCount,
    unreadGroupEventCount,
    hasUnreadForConversation,
    hasUnreadForGroup,
    hasUnreadForCalendar,
    hasUnreadForGroupEvent,
    markAsRead,
    clearNotifications,
    handleNotificationClick,
    // Pour permettre aux composants de définir la conversation active
    setActiveConversationId,
    setActiveGroupId,
    activeConversationId,
    activeGroupId,
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

export const useNotification = () => useContext(NotificationContext);
