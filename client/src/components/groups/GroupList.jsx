import {
  AiOutlineLoading3Quarters,
  AiOutlineUsergroupAdd,
} from "react-icons/ai";
import { FiSearch } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";

import { useEffect, useRef, useState } from "react";
import { useGroup } from "../../context/GroupContext";
import { useMessage } from "../../context/MessageContext";
import { useNotification } from "../../context/NotificationContext";
import { useSocket } from "../../context/SocketContext";

import { formatDistanceToNow } from "date-fns";
import GroupModal from "../modal/GroupModal";
import NotificationBadge from "../notifications/NotificationBadge";

const GroupList = () => {
  const {
    groups,
    currentGroup,
    setCurrentGroup, // Utiliser le setter simple
    fetchUserGroups,
    loading,
    updateGroupLastMessage,
  } = useGroup();

  const {
    activeGroupConversation,
    setCurrentConversation,
    fetchConversationMessages,
    clearConversationState,
    conversations,
  } = useMessage();

  const { socket } = useSocket();

  const { hasUnreadForGroup, hasUnreadForGroupEvent, setActiveGroupId } =
    useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const prevGroupLastMessages = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchUserGroups();
      } catch (error) {
        console.error("Erreur lors du chargement des groupes :", error);
      }
    };
    fetchData();
  }, [fetchUserGroups]);

  useEffect(() => {
    if (socket) {
      socket.on("newGroup", (data) => {
        if (data.group && data.conversation) {
          fetchUserGroups(); // Rafraîchir la liste des groupes
        } else {
          console.error("aucune creation par socket");
        }
      });

      socket.on("updateGroup", (data) => {
        if (data.group) {
          fetchUserGroups;
        } else {
          console.error("aucun mise a jour pas socket");
        }
      });

      socket.on("removeGroup", (data) => {
        if (data.group) {
          clearConversationState();
          fetchUserGroups();
        }
      });

      // Nouveaux événements pour la gestion des membres
      socket.on("membreLeftGroup", (data) => {
        console.log("Membre a quitté le groupe:", data);
        fetchUserGroups(); // Rafraîchir la liste des groupes
      });

      socket.on("membreRoleChanged", (data) => {
        console.log("Rôle du membre modifié:", data);
        fetchUserGroups(); // Rafraîchir la liste des groupes
      });

      return () => {
        socket.off("newGroup");
        socket.off("updateGroup");
        socket.off("removeGroup");
        socket.off("membreLeftGroup");
        socket.off("membreRoleChanged");
      };
    }
  }, [socket, clearConversationState, fetchUserGroups]);

  // Synchronisation du dernier message de groupe en temps réel
  useEffect(() => {
    // Pour chaque conversation de groupe, synchroniser le dernier message dans le contexte groupe
    conversations.forEach((conv) => {
      if (conv.type === "group" && conv.group_id && conv.lastMessage) {
        // On évite les updates inutiles
        if (
          prevGroupLastMessages.current[conv.group_id._id] !==
          conv.lastMessage._id
        ) {
          updateGroupLastMessage(conv.group_id._id, conv.lastMessage);
          prevGroupLastMessages.current[conv.group_id._id] =
            conv.lastMessage._id;
        }
      }
    });
  }, [conversations, updateGroupLastMessage]);

  const toggleGroupModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const filteredGroups = groups.filter((group) =>
    group?.group_id?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectedGroup = async (group) => {
    try {
      setCurrentGroup(group.group_id); // Active le groupe
      setCurrentConversation(null); // Reset la conversation courante

      // Informer le contexte de notification de l'active group
      setActiveGroupId(group.group_id._id);

      // Marquer comme lu les notifications de ce groupe
      // TODO: Implémenter la logique pour marquer les notifications comme lues
      // Pour l'instant, on laisse les notifications actives

      const conversation = await activeGroupConversation(group.group_id._id);
      if (conversation && conversation._id) {
        socket?.emit("joinConversation", conversation._id);
        fetchConversationMessages(conversation._id);
      } else {
        console.error("Aucune conversation selectionnée");
      }

      console.log("Groupe selectionné :", group.group_id);
      console.log("Conversation du groupe :", conversation);
    } catch (error) {
      console.error("Erreur lors de la sélection du groupe:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <AiOutlineLoading3Quarters className="animate-spin text-2xl text-blue-500" />
        <div className="text-center">Chargement des conversations...</div>;
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">
          Vous n&apos;avez pas encore de groupes. Créez-en un !
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-w-[230px] flex flex-col bg-gray-50 border-gray-200 border-2 rounded-lg mr-2 shadow-md overflow-hidden">
      <div className="p-4 border-gray-200 ">
        <div className="flex justify-between items-center p-2">
          <h2 className="text-lg font-semibold">Groupes</h2>
          <AiOutlineUsergroupAdd
            size={40}
            onClick={toggleGroupModal}
            className="text-xl p-2 border-gray-300 border-2 rounded-lg  text-gray-600 cursor-pointer hover:text-gray-600 active:text-gray-700 hover:border-gray-500"
          />
        </div>
        <div className="mt-2 relative">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Recherche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-transparent"
          />
        </div>
      </div>

      <div className="flex-1 max-h-[75%] overflow-y-auto pl-1 pr-1 custom-scrollbar">
        {filteredGroups.length > 0 ? (
          <div className="p-2">
            {filteredGroups.map((group) => (
              <div
                key={group._id}
                onClick={() => handleSelectedGroup(group)}
                className={`flex items-center p-2 hover:bg-gray-100 hover:rounded-md cursor-pointer active:border-yellow-100 active:bg-gray-100 ${
                  currentGroup?._id === group.group_id._id
                    ? "bg-gray-100 border-l-8 border-yellow-100 rounded-md "
                    : hasUnreadForGroup(group.group_id._id) ||
                      hasUnreadForGroupEvent(group.group_id._id)
                    ? "bg-yellow-50 border-l-8 border-yellow-400 rounded-md font-bold"
                    : "bg-gray-50"
                }`}
              >
                <div className="rounded-lg border-2 w-10 h-10 justify-center">
                  <HiOutlineUserGroup
                    size={40}
                    className="text-xl p-2 border-gray-300 border-2 rounded-lg text-gray-600"
                  />
                </div>

                {/* User info */}
                <div className="ml-3 flex-1 w-24">
                  <div className="flex justify-between items-center truncate w-full">
                    <span className="font-medium text-sm text-gray-800 truncate overflow-clip relative">
                      {group?.group_id?.nom || "Groupe "}
                      <NotificationBadge
                        show={
                          hasUnreadForGroup(group.group_id._id) ||
                          hasUnreadForGroupEvent(group.group_id._id)
                        }
                      />
                    </span>
                  </div>
                  <p
                    className={`text-xs text-gray-600 overflow-clip truncate ${
                      hasUnreadForGroup(group.group_id._id)
                        ? // || hasUnreadForGroupEvent(group.group_id._id)
                          "font-bold"
                        : ""
                    }`}
                  >
                    {group?.dernierMessage
                      ? group.dernierMessage.contenu
                      : "Pas encore de message"}
                  </p>
                </div>

                <div className="flex flex-col items-center w-1/5">
                  {/* Date dernier message */}
                  {group.dernierMessage && (
                    <span className="text-xs text-gray-500 text-end">
                      {formatDistanceToNow(
                        new Date(group.dernierMessage.date_envoi),
                        {
                          addSuffix: true,
                        }
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-2">
            <p className="text-gray-500">Aucun groupe pour l&apos;instant.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <GroupModal isOpen={isModalOpen} onClose={toggleGroupModal} />
        </div>
      )}
    </div>
  );
};

export default GroupList;
