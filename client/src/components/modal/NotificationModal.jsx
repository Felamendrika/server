/* eslint-disable react/prop-types */

import { useNotification } from "../../context/NotifContext"

import Modal from "./Modal";

const NotificationModal = ({onClose}) => {
  const { notifications, markAllAsRead } = useNotification();

  return (
  <Modal>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-modal">
        <div className="bg-white rounded-lg shadow-lg p-6 w-80 ">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <button
              onClick={markAllAsRead}
              className="text-sm text-blue-500 underline mb-2"
            >
              Marquer tout comme lu
            </button>
            {notifications.length > 0 ? (
              <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar"> 
                {notifications.map((notif, index) => (
                  <li
                    key={index}
                    className={`p-3 rounded-lg ${
                      notif.isRead ? "bg-gray-200" : "bg-blue-100"
                    }`}
                  >
                    <p className="text-sm">{notif.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(notif.date).toLocaleString()}
                    </span>
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
