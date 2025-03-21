/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createGroup as createGroupService, updateGroup as updateGroupService, deleteGroup as deleteGroupService, getUsersGroups, getGroupMembres } from '../services/groupService';
import { addMembre as addMembreService, removeMembreFromGroup, updateMembreRole as updateMembreRoleService, leaveGroup as leaveGroupService } from '../services/membreService';
import * as roleService from '../services/roleService';
import { toast } from 'react-toastify';

import { useSocket } from './SocketContext';
import { useMessage } from './MessageContext';

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
        setCurrentGroup(null)
        setMembres([])
        clearConversationState()
    }, [clearConversationState]) 


    useEffect(() => {
        if(socket) {
            socket.on("newGroup", (data) => {
                setGroups(prev => [...prev, data.group])
            })

            socket.on("updateGroup", (data) => {
                setGroups(prev => 
                    prev.map(group => 
                        group._id === data.group._id ? { ...group, ...data.group } : group
                    )
                )
                if(currentGroup?._id === data.group._id) {
                    setCurrentGroup(prev => ({ ...prev, ...data.group }))
                    setMembres(data.membres)
                }
            })

            socket.on("removeGroup", ({ groupId }) => {
                setGroups(prev => prev.filter(group => group._id !== groupId))
                if (currentGroup?._id === groupId) {
                    setCurrentGroup(null);
                    setMembres([])
                }
                // toast.info("Le groupe a été supprimé")
            })

            socket.on("membreAdded", ({ membre, group_id }) => {
                if (currentGroup?._id === group_id) {
                    setMembres(prev => [...prev, membre]);
                }
                toast.success("Nouveau membre ajouté au groupe")
            })

            socket.on("membreRoleChanged", ({ membre, group_id }) => {
                if (currentGroup?._id === group_id) {
                    setMembres(prev => prev.map(m => m._id === membre._id ? membre : m))
                }
            })

            socket.on("membreDeleted", ({ userId, group_id }) => {
                if (currentGroup?._id === group_id) {
                    setMembres(prev => prev.filter(m => m.user_id._id !== userId))
                }
            })

            socket.on("membreLeftGroup", ({ userId}) => {
                setMembres(prev => prev.filter(m => m.user_id._id !== userId))
            })

            return () => {
                socket.off("newGroup");
                socket.off("updateGroup");
                socket.off("removeGroup");
                socket.off("membreAdded");
                socket.off("membreRoleChanged");
                socket.off("membreDeleted");
                socket.off("membreLeftGroup");
            };
        }
    })

    // recuperer les groupes auquel l'utilisateur est membre
    const fetchUserGroups = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await getUsersGroups();

            console.log(data)
            if (data.length === 0) {
                setGroups([]); // Aucun groupe trouvé
                clearGroupState()
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
        setCurrentGroup(group)
        console.log("Groupe actif :", group)
    }


    const createGroup = async (groupData) => {
        try {
            const response = await createGroupService(groupData);
            socket?.emit("groupCreated", { group: response.group });
            // await fetchUserGroups();
            console.log(response.data)

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

            const updatedGroup = response.data

            setGroups(prev =>
                prev.map(group => group._id === groupId ? updatedGroup : group)
            );

            if (currentGroup?._id === groupId) {
                setCurrentGroup(updatedGroup);
            }
            await fetchUserGroups()
            toast.success("Groupe mis à jour avec succès");
            return response.data;
        } catch (error) {
            console.error("Erreur mise à jour groupe:", error);
            toast.error( error.message || "Erreur lors de la mise à jour du groupe");
            throw error;
        }
    };

    const deleteGroup = async (groupId) => {
        try {
            await deleteGroupService(groupId);
            socket?.emit("groupDeleted", groupId);
            setGroups((prev) => prev.filter(group => group._id !== groupId));
            await fetchUserGroups()
            // toast.success("Groupe supprimé avec succès");
        } catch (error) {
            console.error("Erreur suppression groupe:", error);
            toast.error( error.message || "Erreur lors de la suppression du groupe");
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
            socket?.emit("membreAdded", { group_id, memberId: user_id });
            setMembres(prev => [...prev, response.data]);
            toast.success("Membre ajouté avec succès");
            return response.data;
        } catch (error) {
            console.error("Erreur ajout membre:", error);
            toast.error( error.message ||"Erreur lors de l'ajout du membre");
            throw error;
        }
    };

    const updateMembreRole = async (membreId, roleId) => {
        try {
            const response = await updateMembreRoleService(membreId, roleId);
            setMembres(prev =>
                prev.map(membre => membre._id === membreId ? response.data : membre)
            );
            toast.success("Rôle du membre mis à jour");
            return response.data;
        } catch (error) {
            console.error("Erreur mise à jour rôle:", error);
            toast.error( error.message ||"Erreur lors de la mise à jour du rôle");
            throw error;
        }
    };

    const removeMembre = async (membreId) => {
        try {
            await removeMembreFromGroup(membreId);
            socket?.emit("membreRemoved", { membreId });
            setMembres(prev => prev.filter(membre => membre._id !== membreId));
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
            setGroups(prev => prev.filter(group => group._id !== groupId));
            setCurrentGroup(null);
            clearConversationState()
            toast.success("Vous avez quitté le groupe");
        } catch (error) {
            console.error("Erreur pour quitter le groupe:", error);
            toast.error( error.message ||"Erreur lors de la sortie du groupe");
            throw error;
        }
    };

    // Gestion des Rôles
    const fetchRoles = useCallback(async () => {
        try {
            const response = await roleService.getAllRoles();
            console.log(response.data)
            setRoles(response.data || []);
        } catch (error) {
            console.error("Erreur chargement rôles:", error);
            toast.error(error.message || "Impossible de charger les rôles");
            throw error
        }
    }, []);

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
        fetchRoles
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
        throw new Error('useGroup doit être utilisé dans un GroupProvider');
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
