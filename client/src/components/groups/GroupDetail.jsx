import { useEffect, useState } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";
import { BsFileText, BsImage } from "react-icons/bs";
import { FiMoreHorizontal, FiSearch, FiTrash } from "react-icons/fi";

import userAvatar from "../../assets/userAvatar.jpg";
import MembreAddModal from "../modal/MembreAddModal";
import MembreActions from "./MembreActions";

import ConfirmActionModal from "../common/ConfirmActionModal";

import { useGroup } from "../../context/GroupContext";
import { useMessage } from "../../context/MessageContext";
import { useSocket } from "../../context/SocketContext";

import { toast } from "react-toastify";

const GroupDetail = () => {
  const {
    // fetchConversationMessages,
    fetchFilesByConversations,
    currentConversation,
    deleteFile,
    fichiers,
    loading,
  } = useMessage();

  const {
    fetchGroupMembres,
    fetchUserGroups,
    currentGroup,
    setCurrentGroup,
    membres,
    addMembre,
    leaveGroup,
  } = useGroup();

  const { socket } = useSocket();

  const [selectedMembreId, setSelectedMembreId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [isOpenMembreModal, setIsMembreModalOpen] = useState(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (currentGroup?._id) {
        fetchGroupMembres(currentGroup?._id);
        socket?.emit("joinGroup", currentGroup._id);

        return () => {
          socket?.emit("leaveGroup", currentGroup._id);
        };
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres: ", error);
    }
  }, [currentGroup?._id, fetchGroupMembres, socket]);

  useEffect(() => {
    if (socket && currentGroup?._id) {
      socket.on("membreAdded", () => {
        fetchGroupMembres(currentGroup._id);
      });

      socket.on("membreRoleChanged", () => {
        fetchGroupMembres(currentGroup._id);
      });

      socket.on("membreDeleted", () => {
        fetchGroupMembres(currentGroup._id);
      });

      socket.on("membreLeftGroup", () => {
        fetchGroupMembres(currentGroup._id);
      });

      return () => {
        socket.off("membreAdded");
        socket.off("membreRoleChanged");
        socket.off("membreDeleted");
        socket.off("membreLeftGroup");
      };
    }
  }, [socket, currentGroup, fetchGroupMembres]);

  useEffect(() => {
    if (currentConversation?._id) {
      fetchFilesByConversations(currentConversation._id).catch((error) =>
        console.error("Erreur lors du chargement des fichiers :", error)
      );
    }
  }, [fetchFilesByConversations, currentConversation?._id]);

  const filteredMembres = membres.filter((membre) => {
    const nom = membre?.user_id?.nom?.toLowerCase() || "";
    const pseudo = membre?.user_id?.pseudo.toLowerCase() || "";
    return nom.includes(searchTerm) || pseudo.includes(searchTerm);
  });

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
  };

  const handleUserSelected = async (user) => {
    if (!user || !user._id) {
      toast.error("Utilisateur sélectionné invalide");
      return;
    }
    try {
      const data = {
        user_id: user._id,
        group_id: currentGroup?._id,
      };

      await addMembre(data);
      console.log("Utilisateur selectionner :", user);
      setIsModalOpen(false);
      await fetchGroupMembres(currentGroup?._id);
    } catch (error) {
      console.error("Erreur lors de l'ajout du membre au groupe :", error);
      // toast.error("Erreur lors de l'ajout du membre au groupe")
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleDeleteFile = async (fichierId) => {
    try {
      await deleteFile(fichierId);
    } catch (error) {
      console.error("Erreur lors de la suppression de fichier :", error);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      if (currentGroup?._id) {
        await leaveGroup(currentGroup._id);
        socket?.emit("membreLeftGroup", {
          groupId: currentGroup._id,
        });
        console.log("Vous avez quitter le groupe :", currentGroup);
        await fetchUserGroups();
      }
      setCurrentGroup(null);
    } catch (error) {
      console.error("Erreur lors de la sortie du groupe :", error);
    }
  };

  const toggleMembreModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const toggleDropdown = (membre) => {
    setSelectedMembreId((prev) => (prev === membre ? null : membre));
    console.log("Membre selectionner :", membre);
    // setSelectedMembreId(membreId)
    // setIsMembreModalOpen(!isOpenMembreModal)
  };

  const closeMembreModal = () => {
    setSelectedMembreId(null); // Réinitialisez l'ID du membre
  };

  const getFileIcon = (type) => {
    return type.startsWith("image") ? (
      <BsImage size={20} className="text-gray-500" />
    ) : (
      <BsFileText size={20} className="text-gray-500" />
    );
  };

  // Sécurisation de fichiers pour éviter les crashs
  const fichiersList = Array.isArray(fichiers) ? fichiers : [];

  if (loading) {
    return (
      <div className="h-full min-w-[175px] flex flex-col border-gray-200 border-2 bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden text-center">
        Chargement des medias...
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="h-full min-w-[175px] flex flex-col bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden text-center text-gray-500 justify-center">
        Sélectionnez un groupe pour afficher les details.
      </div>
    );
  }

  return (
    <div className="h-full min-w-[175px] flex flex-col border-gray-200 border-2 bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden">
      <div className="p-3 border-gray-200">
        <div className="flex justify-between items-center p-2">
          <h2 className="text-base font-semibold">
            Membres ({membres.length})
          </h2>
          <AiOutlineUserAdd
            onClick={toggleMembreModal}
            className="text-xl text-gray-600 cursor-pointer hover:text-gray-800 active:text-gray-800"
          />
        </div>
        <div className="mt-2 relative">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Recherche ..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-3 py-2 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-transparent"
          />
        </div>
      </div>

      <div className="flex-1 max-h-[300px] pb-2 overflow-y-auto custom-scrollbar">
        {filteredMembres?.length > 0 ? (
          <div className="p-2">
            {filteredMembres.map((membre, index) => (
              <div
                key={membre?._id || index}
                className="flex items-center p-2 hover:bg-gray-100 hover:rounded-md cursor-pointer justify-between relative w-full"
              >
                <img
                  src={membre?.user_id?.avatar || userAvatar}
                  className="w-10 h-10 justify-center rounded-full object-cover"
                />
                {/* User Info */}
                <div className="ml-3 flex-1 w-full">
                  <div className="flex justify-between items-center w-2/3">
                    <span className="font-medium text-sm text-gray-600  truncate overflow-clip">
                      {membre?.user_id?.pseudo}
                    </span>
                  </div>
                  <p
                    className={`text-xs truncate ${
                      membre?.role_id?.type === "admin"
                        ? "text-blue-500"
                        : "text-gray-500"
                    }`}
                  >
                    {membre?.role_id?.type}
                  </p>
                </div>

                {/* Menu deroulant */}
                <div className=" flex ">
                  <button
                    onClick={() => toggleDropdown(membre)}
                    className="absolute top-4 text-gray-500 hover:text-gray-700 right-6"
                  >
                    <FiMoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Aucun membre trouvé pour l&apos;instant
          </p>
        )}
      </div>

      {/* Trait de séparation */}
      <div className="border-2 rounded w-[40%] mx-auto border-gray-400 my-2"></div>

      {/* AFFICHAGE DE LA LISTE DES FICHIER */}
      <div className="p-4 border-gray-200">
        <h2 className="text-base font-semibold">
          Fichiers ({fichiersList.length})
        </h2>
      </div>

      <div className="flex-1 max-h-[300px] overflow-y-auto custom-scrollbar pb-3">
        {fichiersList.length > 0 ? (
          <div className="pl-2 pr-2 pb-2">
            {fichiersList.map((fichier) => (
              <div
                key={fichier._id}
                className="flex items-center p-2 hover:bg-gray-100 hover:rounded-md cursor-pointer justify-between"
              >
                <div className="flex items-center justify-between">
                  <a
                    href={fichier.chemin_fichier}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center"
                  >
                    {getFileIcon(fichier.type)}
                    {/* User Info */}
                    <div className="ml-3 flex-1 w-24 truncate">
                      <span className="font-medium text-sm text-gray-600">
                        {fichier.nom}
                      </span>
                      <p className="text-xs text-gray-500 truncate">
                        {fichier.taille}
                      </p>
                    </div>
                  </a>
                  <button
                    onClick={() => handleDeleteFile(fichier._id)}
                    className="ml-2 hover:text-red-500 hover:border-red-500"
                  >
                    <FiTrash size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Aucun fichier pour l&apos;instant
          </p>
        )}
      </div>

      <div className="flex justify-center mb-2">
        <button
          onClick={() => setIsConfirmModalOpen(true)}
          className="px-3 py-1 w-32 bg-transparent border-2 border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white"
        >
          Quitter
        </button>
      </div>

      {/* MODAL */}
      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleLeaveGroup}
        message="Êtes-vous sûr de vouloir quitter le groupe ?"
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <MembreAddModal
            onSelect={handleUserSelected}
            onClose={toggleMembreModal}
          />
        </div>
      )}

      {selectedMembreId && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <MembreActions membre={selectedMembreId} onClose={closeMembreModal} />
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
