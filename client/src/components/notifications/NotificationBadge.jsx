/* eslint-disable react/prop-types */

const NotificationBadge = ({ show }) => {
  if (!show) return null;
  return (
    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full z-index-10"></span>
  );
};

export default NotificationBadge;
