/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  createGroup as createGroupService,
  deleteGroup as deleteGroupService,
  getGroupMembres,
  getUsersGroups,
  updateGroup as updateGroupService,
} from "../services/groupService";
import {
  addMembre as addMembreService,
  leaveGroup as leaveGroupService,
  removeMembreFromGroup,
  updateMembreRole as updateMembreRoleService,
} from "../services/membreService";
import * as roleService from "../services/roleService";

import { useMessage } from "./MessageContext";
import { useSocket } from "./SocketContext";

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [membres, setMembres] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { clearConversationState } = useMessage();
  const { socket } = useSocket();

  //nettoyage complet de l'etat de groupe
  const clearGroupState = useCallback(() => {
    setCurrentGroup(null);
    setMembres([]);
    clearConversationState();
  }, [clearConversationState]);

  /*
      useEffect(() => {
        if(socket) {
            socket.on("newGroup", (data) => {
                setGroups(prev => [...prev, data.group])
            })
                */
  useEffect(() => {
    if (socket) {
      // Rejoindre les rooms des groupes de l'utilisateur lors de la connexion
      socket.emit("joinUserGroups");

      socket.on("newGroup", (data) => {
        console.log("Nouveau groupe reçu:", data.group);
        setGroups((prev) => {
          // Éviter les doublons
          const exists = prev.some((group) => group._id === data.group._id);
          if (!exists) {
            return [...prev, data.group];
          }
          return prev;
        });
      });

      socket.on("updateGroup", (data) => {
        const groupId = data.group._id || data.groupId;
        console.log("Groupe mis à jour (socket):", data.group);
        setGroups((prev) =>
          prev.map((group) =>
            String(group._id) === String(groupId) ? data.group : group
          )
        );
        if (currentGroup?._id && String(currentGroup._id) === String(groupId)) {
          setCurrentGroup(data.group);
          if (data.membres) setMembres(data.membres);
        }
      });

      socket.on("removeGroup", ({ groupId }) => {
        console.log("Groupe supprimé (socket):", groupId);
        setGroups((prev) => prev.filter((group) => group._id !== groupId));
        if (currentGroup?._id === groupId) {
          clearGroupState();
          //setMembres([])
          //setCurrentGroup(null)
        }
        // Quitter la room côté client (sécurité)
        socket.emit("leaveGroup", groupId);
        toast.info("Ce groupe a été supprimé.");
      });

      socket.on("membreAdded", ({ membre, group_id }) => {
        console.log("Nouveau membre ajouté:", membre);
        if (currentGroup?._id === group_id) {
          setMembres((prev) => {
            const exists = prev.some((m) => m._id === membre._id);
            return exists ? prev : [...prev, membre];
          });
        }
        toast.success("Nouveau membre ajouté au groupe");
      });

      // Événement pour le nouveau membre qui rejoint le groupe
      socket.on("joinedGroup", ({ group }) => {
        console.log("Vous avez rejoint le groupe:", group);
        setGroups((prev) => {
          const exists = prev.some((g) => g._id === group._id);
          if (!exists) {
            return [...prev, group];
          }
          return prev;
        });
        toast.success(`Vous avez rejoint le groupe "${group.nom}"`);
      });

      // Événement global pour la mise à jour des listes
      socket.on("groupMemberAdded", ({ group, membre, group_id }) => {
        console.log("Membre ajouté au groupe (global):", membre);
        // Mettre à jour la liste des groupes si nécessaire
        setGroups((prev) => {
          const groupIndex = prev.findIndex((g) => g._id === group_id);
          if (groupIndex !== -1) {
            // Mettre à jour le groupe existant
            const updatedGroups = [...prev];
            updatedGroups[groupIndex] = {
              ...updatedGroups[groupIndex],
              ...group,
            };
            return updatedGroups;
          }
          return prev;
        });
      });

      socket.on("membreRoleChanged", ({ membre, group_id }) => {
        console.log("Rôle de membre changé (socket):", membre);
        if (currentGroup?._id === group_id) {
          setMembres((prev) =>
            prev.map((m) => (m._id === membre._id ? membre : m))
          );
        }
      });

      socket.on("membreDeleted", ({ userId, group_id }) => {
        console.log("Membre supprimé:", userId);
        if (currentGroup?._id === group_id) {
          setMembres((prev) => prev.filter((m) => m.user_id._id !== userId));
        }
      });

      socket.on("membreLeftGroup", ({ userId }) => {
        console.log("Membre a quitté le groupe:", userId);
        setMembres((prev) => prev.filter((m) => m.user_id._id !== userId));
      });

      // Événement pour le membre supprimé du groupe
      socket.on("removedFromGroup", ({ group_id }) => {
        console.log("Vous avez été retiré du groupe:", group_id);
        setGroups((prev) => prev.filter((g) => g._id !== group_id));
        if (currentGroup?._id === group_id) {
          clearGroupState();
        }
        // Quitter la room côté client (optionnel, sécurité)
        socket.emit("leaveGroup", group_id);
        toast.info("Vous avez été retiré du groupe"); // tokony asorona ty
      });

      return () => {
        socket.off("newGroup");
        socket.off("updateGroup");
        socket.off("removeGroup");
        socket.off("membreAdded");
        socket.off("joinedGroup");
        socket.off("groupMemberAdded");
        socket.off("membreRoleChanged");
        socket.off("membreDeleted");
        socket.off("membreLeftGroup");
        socket.off("removedFromGroup");
      };
    }
  }, [socket, currentGroup, clearGroupState]);

  // recuperer les groupes auquel l'utilisateur est membre
  const fetchUserGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getUsersGroups();

      if (data.length === 0) {
        setGroups([]); // Aucun groupe trouvé
        clearGroupState();
      } else {
        setGroups(data || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des groupes:", error);
      setGroups([]);
      clearGroupState();
      // toast.error("Impossible de charger vos groupes");
    } finally {
      setLoading(false);
    }
  }, [clearGroupState]);

  // group active
  const setCurrentGroupActive = (group) => {
    setCurrentGroup(group);
    console.log("Groupe actif :", group);
  };

  const createGroup = async (groupData) => {
    try {
      const response = await createGroupService(groupData);

      // Émettre l'événement de création du groupe
      socket?.emit("groupCreated", {
        group: response.data.group,
        conversation: response.data.conversation, // mbola dinihana satria conversation mbo tsy creer avec groupe immeditement
        createur_id: response.data.group.createur_id,
      });

      // Rejoindre la room du nouveau groupe
      socket?.emit("joinGroup", response.data.group._id);

      console.log("Groupe créé:", response.data);
      toast.success("Groupe créé avec succès");
      return response.data;
    } catch (error) {
      console.error("Erreur création groupe:", error);
      toast.error(error.message || "Erreur lors de la création du groupe");
      throw error;
    }
  };

  const updateGroup = async (groupId, updateData) => {
    try {
      const response = await updateGroupService(groupId, updateData);
      socket?.emit("groupUpdated", { groupId, updateData });
      // console.log(response.data)

      const updatedGroup = response.data;

      setGroups((prev) =>
        prev.map((group) => (group._id === groupId ? updatedGroup : group))
      );

      if (currentGroup?._id === groupId) {
        setCurrentGroup(updatedGroup);
      }
      await fetchUserGroups();
      toast.success("Groupe mis à jour avec succès");
      return response.data;
    } catch (error) {
      console.error("Erreur mise à jour groupe:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du groupe");
      throw error;
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await deleteGroupService(groupId);
      socket?.emit("groupDeleted", groupId);
      setGroups((prev) => prev.filter((group) => group._id !== groupId));
      await fetchUserGroups();
      // toast.success("Groupe supprimé avec succès");
    } catch (error) {
      console.error("Erreur suppression groupe:", error);
      toast.error(error.message || "Erreur lors de la suppression du groupe");
      throw error;
    }
  };

  // Gestion des Membres
  const fetchGroupMembres = useCallback(async (groupId) => {
    setLoading(true);
    try {
      const response = await getGroupMembres(groupId);
      setMembres(response.data || []);
    } catch (error) {
      console.error("Erreur chargement membres:", error);
      setMembres([]);
      toast.error("Impossible de charger les membres");
    } finally {
      setLoading(false);
    }
  }, []);

  const addMembre = async (group_id, user_id) => {
    try {
      const response = await addMembreService(group_id, user_id);

      // Émettre l'événement d'ajout de membre
      socket?.emit("membreAdded", {
        group_id,
        memberId: user_id,
        membre: response.data,
      });

      // Mettre à jour la liste des membres si le groupe actuel est concerné
      if (currentGroup?._id === group_id) {
        setMembres((prev) => {
          const exists = prev.some((m) => m._id === response.data._id);
          return exists ? prev : [...prev, response.data];
        });
      }

      console.log("Membre ajouté:", response.data);
      toast.success("Membre ajouté avec succès");
      return response.data;
    } catch (error) {
      console.error("Erreur ajout membre:", error);
      toast.error(error.message || "Erreur lors de l'ajout du membre");
      throw error;
    }
  };

  const updateMembreRole = async (membreId, roleId) => {
    try {
      const response = await updateMembreRoleService(membreId, roleId);
      setMembres((prev) =>
        prev.map((membre) => (membre._id === membreId ? response.data : membre))
      );
      toast.success("Rôle du membre mis à jour");
      return response.data;
    } catch (error) {
      console.error("Erreur mise à jour rôle:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du rôle");
      throw error;
    }
  };

  const removeMembre = async (membreId) => {
    try {
      await removeMembreFromGroup(membreId);
      socket?.emit("membreRemoved", { membreId });
      setMembres((prev) => prev.filter((membre) => membre._id !== membreId));
      toast.success("Membre retiré du groupe");
    } catch (error) {
      console.error("Erreur suppression membre:", error);
      toast.error(error.message || "Erreur lors du retrait du membre");
      throw error;
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await leaveGroupService(groupId);
      socket?.emit("membreLeft", { groupId });
      setGroups((prev) => prev.filter((group) => group._id !== groupId));
      setCurrentGroup(null);
      clearConversationState();
      toast.success("Vous avez quitté le groupe");
    } catch (error) {
      console.error("Erreur pour quitter le groupe:", error);
      toast.error(error.message || "Erreur lors de la sortie du groupe");
      throw error;
    }
  };

  // Gestion des Rôles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await roleService.getAllRoles();
      console.log(response.data);
      setRoles(response.data || []);
    } catch (error) {
      console.error("Erreur chargement rôles:", error);
      toast.error(error.message || "Impossible de charger les rôles");
      throw error;
    }
  }, []);

  // Met à jour le dernier message d'un groupe (pour affichage instantané dans GroupList)
  const updateGroupLastMessage = (groupId, message) => {
    setGroups((prev) =>
      prev.map((group) =>
        group._id === groupId ? { ...group, dernierMessage: message } : group
      )
    );
  };

  const contextValue = {
    groups,
    currentGroup,
    membres,
    roles,
    loading,
    setCurrentGroupActive,
    setCurrentGroup,
    fetchUserGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    fetchGroupMembres,
    addMembre,
    updateMembreRole,
    removeMembre,
    leaveGroup,
    fetchRoles,
    updateGroupLastMessage, // Ajout pour synchro socket
  };

  return (
    <GroupContext.Provider value={contextValue}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup doit être utilisé dans un GroupProvider");
  }
  return context;
};

/*
    const [currentConversation, setCurrentConversation] = useState(null);
    const { activeGroupConversation } = useMessage()

    const setCurrentGroupAndActiveConversation = async (group) => {
        setCurrentGroup(group)

        try {
            const conversation = await activeGroupConversation(group._id)
            setCurrentConversation(conversation)
            return conversation 
        } catch(error) {
            console.error("Erreur lors de l'activation de la conversation:", error)
        }
    }
*/
