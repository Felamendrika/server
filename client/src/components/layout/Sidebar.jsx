import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEvent } from "../../context/EventContext";
import { useGroup } from "../../context/GroupContext";
import { useMessage } from "../../context/MessageContext";
import { useNotification } from "../../context/NotificationContext";

import NotificationBadge from "../notifications/NotificationBadge";

import { BsCalendar2Event } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { PiUsers } from "react-icons/pi";
import { TfiCommentAlt } from "react-icons/tfi";

import ConfirmActionModal from "../common/ConfirmActionModal";

import Logo from "../../assets/Region.png";

const Sidebar = () => {
  const { logout } = useAuth();
  const { clearConversationState, fetchPrivateConversations } = useMessage();
  const { fetchEvents } = useEvent();
  const { fetchUserGroups, setCurrentGroup } = useGroup();
  const {
    unreadMessageCount,
    unreadGroupMessageCount,
    unreadGroupEventCount,
    unreadCalendarCount,
  } = useNotification();
  const [activePage, setActivePage] = useState("messages");
  // const navigate = useNavigate();
  const location = useLocation();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleNavigation = (pageName) => {
    setActivePage(pageName);
    clearConversationState();

    if (pageName !== "groups") {
      setCurrentGroup(null); // Réinitialiser le groupe actif
    }

    switch (pageName) {
      case "messages":
        fetchPrivateConversations();
        break;
      case "groups":
        fetchUserGroups();
        break;
      case "calendar":
        fetchEvents();
        break;
    }

    /*if (pageName !== "messages") {
            clearConversationState()
        } */
  };

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === "/dashboard" || currentPath === "/dashboard/messages") {
      setActivePage("messages");
      fetchPrivateConversations();
    } else if (currentPath === "/dashboard/groups") {
      setActivePage("groups");
      fetchUserGroups();
    } else if (currentPath === "/dashboard/calendrier") {
      setActivePage("calendar");
      fetchEvents();
    }
  }, [location, fetchPrivateConversations, fetchEvents, fetchUserGroups]);
  const handleLogout = () => {
    logout();
  };

  // Nouvelle logique pour les badges (point rouge)
  const menuItems = [
    {
      name: "Messages",
      icon: <TfiCommentAlt />,
      path: "/dashboard/messages",
      id: "messages",
      badge: unreadMessageCount > 0,
    },
    {
      name: "Groupes",
      icon: <PiUsers />,
      path: "/dashboard/groups",
      id: "groups",
      badge: unreadGroupMessageCount > 0 || unreadGroupEventCount > 0,
    },
    {
      name: "Calendrier Partagé",
      icon: <BsCalendar2Event />,
      path: "/dashboard/calendrier",
      id: "calendar",
      badge: unreadCalendarCount > 0,
    },
  ];
  return (
    <div className=" h-full min-h-screen flex flex-col flex-shrink-0 sticky bg-yellow-400 w-20 shadow-md transition-all duration-300 border-r rounded-r-lg">
      {/* Logo */}
      <div className="flex flex-col items-center py-4 w-full border-yellow-500 mb-8">
        <img src={Logo} alt="Logo" className="w-14 h-14" />
        <div className="text-black text-lg font-semibold">RHM</div>
        <div className="w-8 h-[3px] rounded bg-black mt-2"></div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col items-center justify-center p-4 space-y-8">
        <div className="flex flex-col space-y-8 flex-grow">
          {menuItems.map((item) => (
            <NavLink
              to={item.path}
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              // onClick={item.onClick}
              aria-label={item.name}
              className={({ isActive }) =>
                `flex flex-col items-center w-full text-black p-2 rounded-lg transition ${
                  isActive || item.id === activePage
                    ? "bg-white shadow-md font-bold"
                    : "hover:bg-white shadow-md"
                }`
              }
            >
              <div className="relative text-xl m-1">
                {item.icon}
                <NotificationBadge show={item.badge} />
                {/* {item.badge > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-xs text-white px-1 rounded-full">
                                {item.badge}
                                </span>
                            )} */}
              </div>
              <span className="mt-1 text-xs lg:block font-normal">
                {item.name}
              </span>
            </NavLink>
          ))}
        </div>
      </div>
      {/* Logout button */}
      <div className=" mt-auto flex mb-4">
        <button
          onClick={() => setIsConfirmModalOpen(true)}
          aria-label="Se déconnecter"
          className="flex flex-col items-center justify-center w-full text-black text-2xl p-2 m-2 rounded-lg hover:bg-red-500 transition"
        >
          <HiOutlineLogout />
        </button>
      </div>

      {/* Confirmation Modal */}
      <div className="z-50">
        <ConfirmActionModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleLogout}
          message="Êtes-vous sûr de vouloir vous deconnecter ?"
        />
      </div>
    </div>
  );
};

export default Sidebar;
