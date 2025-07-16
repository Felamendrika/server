/* eslint-disable react/prop-types */
// import { FiMessageCircle, FiCalendar, FiUsers, FiBell } from "react-icons/fi";

import { useMessage } from "../../context/MessageContext";
import { useNotification } from "../../context/NotificationContext";
import NotificationList from "../notifications/NotificationList";
import Modal from "./Modal";

const NotificationModal = ({ onClose }) => {
  const {
    notifications,
    clearNotifications,
    handleNotificationClick,
    // markAsRead
  } = useNotification();
  const { setCurrentConversation, fetchConversationMessages } = useMessage();

  //navigation contextuelle selon le type de notification
  const onNotifClick = async (notif) => {
    if (notif.conversationId) {
      await fetchConversationMessages(notif.conversationId);
      setCurrentConversation(notif.conversationId);
    }

    onClose();
    await handleNotificationClick(notif);
  };

  return (
    <Modal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-modal">
        <div className="bg-white rounded-lg shadow-lg p-6 w-80 ">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={clearNotifications}
              className="text-sm text-blue-500 underline mb-2"
            >
              Marquer tout comme lu
            </button>
          </div>
          <NotificationList
            notifications={notifications}
            onNotificationClick={onNotifClick}
          />
          <button
            onClick={onClose}
            className=" mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationModal;
