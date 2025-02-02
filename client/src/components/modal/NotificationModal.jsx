/* eslint-disable react/prop-types */
// import { FiMessageCircle, FiCalendar, FiUsers, FiBell } from "react-icons/fi";

import { useSocket } from "../../context/SocketContext";
import { useMessage } from "../../context/MessageContext";
import Modal from "./Modal";
import { format } from "date-fns";

const NotificationModal = ({onClose}) => {
  const { notifications, clearNotifications } = useSocket();
  const { setCurrentConversation, fetchConversationMessages } = useMessage();

  const handleNotificationClick = async (notification) => {
    if (notification.conversationId) {
      await fetchConversationMessages(notification.conversationId);
      setCurrentConversation(notification.conversationId);
    }
    onClose();
  };

  // const getNotificationIcon = (type) => {
  //   switch(type) {
  //     case 'message': return <FiMessageCircle className="text-blue-500" />;
  //     case 'event': return <FiCalendar className="text-green-500 text-xl" />;
  //     case 'conversation': return <FiUsers className="text-purple-500 text-xl" />;
  //     default: return <FiBell className="text-gray-500 text-xl" />;
  //   }
  // };

  return (
  <Modal>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-modal">
        <div className="bg-white rounded-lg shadow-lg p-6 w-80 ">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="flex justify-between items-center mb-4">

            {notifications.length > 0 && (
            <button
                onClick={clearNotifications}
                className="text-sm text-blue-500 underline mb-2"
              >
                Marquer tout comme lu
              </button>
            )}
          </div>

              {notifications.length > 0 ? (
                <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar"> 
                  {notifications.map((notif, index) => (
                    <li
                      key={index}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 rounded-lg cursor-pointer bg-blue-200 hover:bg-blue-300"`}
                    >
                      <div className="flex items-center gap-2">
                        {/* <span className="text-xl">{getNotificationIcon(notif.type)}</span> */}
                        <div className="flex-1">
                          <p className="text-sm">{notif.message}</p>

                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {format(new Date(), "dd/MM/yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm">{notif.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">Aucune notification pour l&apos;instant.</p>
              )}
            <button
              onClick={onClose}
              className=" mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Fermer
            </button>
        </div>
    </div>
  </Modal>
  )
}

export default NotificationModal
/*
<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-white w-96 p-6 rounded-md shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Notifications</h3>
      <ul className="space-y-2">
        <li className="p-2 bg-gray-100 rounded-md">Notification 1</li>
        <li className="p-2 bg-gray-100 rounded-md">Notification 2</li>
        <li className="p-2 bg-gray-100 rounded-md">Notification 3</li>
      </ul>
      <button
        onClick={onClose}
        className="mt-4 w-full bg-yellow-400 text-white py-2 rounded-md hover:bg-yellow-500 transition"
      >
        Fermer
      </button>
    </div>
  </div>
*/
