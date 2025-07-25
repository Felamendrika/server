/* eslint-disable react/prop-types */
import { format } from "date-fns";

const NotificationList = ({ notifications, onNotificationClick }) => {
  if (!notifications || notifications.length === 0) {
    return (
      <p className="text-gray-600">Aucune notification pour l&apos;instant.</p>
    );
  }

  return (
    <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
      {notifications.map((notif, index) => (
        <li
          key={notif._id || index}
          onClick={() => onNotificationClick(notif)}
          className="p-2 rounded-md hover:rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100"
        >
          <div className="flex items-center gap-2">
            {/* <span className="text-xl">{getNotificationIcon(notif.type)}</span> */}
            <div className="flex-1 pl-2">
              <p className="text-sm">{notif.message}</p>

              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {format(new Date(notif.createdAt), "dd-MM-yyyy")}
                </span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default NotificationList;
