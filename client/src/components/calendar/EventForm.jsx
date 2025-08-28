/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useEvent } from "../../context/EventContext";
import { useGroup } from "../../context/GroupContext";
import { useSocket } from "../../context/SocketContext";

import { FaUserPlus } from "react-icons/fa";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { toast } from "react-toastify";

import ConfirmActionModal from "../common/ConfirmActionModal";
import ConfirmDeleteModal from "../common/ConfirmDeleteModal";
import PartcipantList from "./PartcipantList";
import ParticipantModal from "./ParticipantModal";

const EventForm = ({ onClose, selectedEvent }) => {
  const { 
    createEvent, 
    createEventWithParticipants,
    updateEvent, 
    deleteEvent,
    eventParticipants,
    fetchEventParticipants,
    removeParticipantFromEvent,
    setEventParticipants: setEventParticipantsMemo,
  } = useEvent();

  const { socket } = useSocket();
  const { user } = useAuth();
  const { fetchUserGroups, groups } = useGroup();

  const [eventData, setEventData] = useState({
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    type: "public",
    group_id: "",
    user_ids: [],
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsersPreview, setSelectedUsersPreview] = useState([]);

  // Charger les groupes de l'utilisateur
  useEffect(() => {
    const loadUserGroups = async () => {
      try {
        await fetchUserGroups();
      } catch (error) {
        console.error("Erreur lors du chargement des groupes:", error);
      }
    };
    loadUserGroups();
  }, [fetchUserGroups]);

  useEffect(() => {
    if (Array.isArray(groups)) {
      setUserGroups(groups);
    }
  }, [groups]);

  // Lorsque l'utilisateur choisit le type "group", s'assurer que les groupes sont chargés
  useEffect(() => {
    const ensureGroups = async () => {
      if (
        eventData.type === "group" &&
        (!userGroups || userGroups.length === 0)
      ) {
        try {
          await fetchUserGroups();
        } catch (error) {
          console.error("Erreur lors du chargement des groupes:", error);
        }
      }
    };
    ensureGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventData.type]);

  // Charger les participants si c'est un événement existant
  useEffect(() => {
    if (selectedEvent && selectedEvent._id) {
      fetchEventParticipants(selectedEvent._id);
    }
  }, [selectedEvent?._id, fetchEventParticipants]);

  useEffect(() => {
    if (selectedEvent) {
      setEventData({
        titre: selectedEvent.titre || "",
        description: selectedEvent.description || "",
        date_debut: selectedEvent.date_debut
          ? new Date(selectedEvent.date_debut).toISOString().slice(0, 16)
          : "",
        date_fin: selectedEvent.date_fin
          ? new Date(selectedEvent.date_fin).toISOString().slice(0, 16)
          : "",
        type: selectedEvent.type || "public",
        group_id: selectedEvent.group_id?._id || selectedEvent.group_id || "",
        user_ids: [],
      });
    } else {
      setEventData({
        titre: "",
        description: "",
        date_debut: new Date().toISOString().slice(0, 16),
        date_fin: new Date().toISOString().slice(0, 16),
        type: "public",
        group_id: "",
        user_ids: [],
      });
    }
  }, [selectedEvent]);

  // Fonction pour nettoyer les participants selon le type
  const cleanupParticipantsByType = (newType) => {
    if (newType === "public") {
      // Public : pas de participants ni de groupe
      setEventData((prev) => ({
        ...prev,
        user_ids: [],
        group_id: "",
      }));
      setSelectedUsersPreview([]);
    } else if (newType === "group") {
      // Groupe : pas de participants individuels
      setEventData((prev) => ({
        ...prev,
        user_ids: [],
      }));
      setSelectedUsersPreview([]);
    }
    // Private : garder les participants existants
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));

    // Réinitialiser les champs liés si le type change
    if (name === "type") {
      const newType = value;
      const oldType = eventData.type;

      // Nettoyer les participants selon le nouveau type
      cleanupParticipantsByType(newType);

      // Afficher des messages d'information
      if (oldType === "private" && newType === "public") {
        toast.info("Les participants seront supprimés");
      } else if (
        oldType === "group" &&
        (newType === "public" || newType === "private")
      ) {
        toast.info(
          "La référence au groupe et les participants seront supprimés"
        );
      } else if (oldType === "private" && newType === "group") {
        toast.info(
          "Les participants individuels seront remplacés par les membres du groupe"
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      titre,
      description,
      date_debut,
      date_fin,
      type,
      user_ids,
      group_id,
    } = eventData;

    if (!titre || !date_debut || !date_fin || !description) {
      toast.error("Les champs Titre, Description et dates sont obligatoires");
      return;
    }

    if (new Date(date_debut) >= new Date(date_fin)) {
      toast.error("La date de début doit être avant la date de fin");
      return;
    }

    // Validation des transitions de type interdites
    if (selectedEvent && selectedEvent.type !== type) {
      // public -> group : interdit par règle métier
      if (selectedEvent.type === "public" && type === "group") {
        toast.error(
          "Impossible de passer d'un événement public à un événement de groupe"
        );
        return;
      }

      // private -> group : validation du groupe
      if (selectedEvent.type === "private" && type === "group") {
        if (!group_id) {
          toast.error(
            "Sélection d'un groupe obligatoire pour passer en événement de groupe"
          );
          return;
        }
      }

      // group -> public/private : confirmation de suppression des participants
      if (
        selectedEvent.type === "group" &&
        (type === "public" || type === "private")
      ) {
        if (
          !window.confirm(
            "Passer en événement public/privé supprimera tous les participants et la référence au groupe. Continuer ?"
          )
        ) {
          return;
        }
      }

      // private -> public : confirmation de suppression des participants
      if (selectedEvent.type === "private" && type === "public") {
        if (
          !window.confirm(
            "Passer en événement public supprimera tous les participants. Continuer ?"
          )
        ) {
          return;
        }
      }
    }

    // Validation des champs requis selon le type
    if (type === "group" && !group_id) {
      toast.error(
        "Sélection d'un groupe obligatoire pour un événement de groupe"
      );
      return;
    }

    if (type === "private" && (!user_ids || user_ids.length === 0)) {
      toast.error(
        "Sélection d'au moins un participant obligatoire pour un événement privé"
      );
      return;
    }

    setLoading(true);
    try {
      if (selectedEvent) {
        // Modification d'événement existant
        await updateEvent(selectedEvent._id, eventData);
        socket?.emit("eventUpdated", { event: eventData });
      } else {
        // Création d'un nouvel événement
        let response;
        if (type === "private" && user_ids.length > 0) {
          // Créer avec participants
          response = await createEventWithParticipants(eventData);
        } else {
          // Créer sans participants
          response = await createEvent(eventData);
        }

        // Normaliser le payload pour le socket
        const payload =
          response?.data?.event ?? // cas createEventWithParticipants
          response?.data ?? // cas createEvent (data = event)
          response?.event ??
          response ??
          null;

        if (payload) {
          socket?.emit("eventCreated", { event: payload });
        }
      }

      onClose();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error(error.message || "Une erreur est survenue !");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(selectedEvent._id);
      socket?.emit("eventDeleted", { eventId: selectedEvent._id });
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l&apos;événement");
    }
  };

  const handleUpdate = async () => {
    try {
      await updateEvent(selectedEvent._id, eventData);
      socket?.emit("eventUpdated", { event: eventData });
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour de l&apos;événement");
    }
  };

  // Gestion des participants
  const handleAddParticipants = (selectedUsers) => {
    const userIds = selectedUsers.map((user) => user._id);
    setSelectedUsersPreview((prev) => {
      const map = new Map();
      [...prev, ...selectedUsers].forEach((u) => map.set(u._id, u));
      return Array.from(map.values());
    });
    setEventData((prev) => ({
      ...prev,
      user_ids: Array.from(new Set([...prev.user_ids, ...userIds])),
    }));
    setIsParticipantModalOpen(false);
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!selectedEvent) return;

    try {
      await removeParticipantFromEvent(selectedEvent._id, participantId);
      // Mettre à jour immédiatement l'état local
      setEventData((prev) => ({
        ...prev,
        user_ids: prev.user_ids.filter((id) => id !== participantId),
      }));
      // Mettre à jour aussi la liste des participants affichée
      setEventParticipantsMemo((prev) =>
        prev.filter((p) => {
          const userId = p.user_id?._id || p.user_id;
          return userId !== participantId;
        })
      );
    } catch (error) {
      console.error("Erreur lors du retrait du participant:", error);
    }
  };

  const handleRemoveSelectedParticipant = (userId) => {
    setSelectedUsersPreview((prev) => prev.filter((u) => u._id !== userId));
    setEventData((prev) => ({
      ...prev,
      user_ids: prev.user_ids.filter((id) => id !== userId),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">        
      <div className="bg-gray-50 rounded-lg p-4 w-[600px] max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="relative p-2">
                <IoIosCloseCircleOutline 
                onClick={onClose}
                size={25}
            className="absolute top-3 right-4 text-gray-400 cursor-pointer hover:text-gray-600"
              />
          </div>   

          <h2 className="text-2xl font-bold mb-4">
          {selectedEvent ? "Modifier l'événement" : "Créer un événement"}
          </h2>

          {selectedEvent && selectedEvent.createur_id && (
          <div className="flex items-center gap-3 mb-3 p-2 bg-blue-50 rounded-lg">
            <p className="block font-medium">Créateur de l&apos;événement: </p>
            <img
              src={selectedEvent.createur_id?.avatar}
              alt={`${selectedEvent.createur_id.nom}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="text-base font-normal">
                {`${selectedEvent.createur_id?.nom} ${selectedEvent.createur_id?.prenom}`}
              </p>
            </div>
          </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block font-medium mb-2">Titre *</label>
            <input
              type="text"
              name="titre"
              value={eventData.titre}
              onChange={handleChange}
              className="w-full p-3 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-2">Description *</label>
            <textarea
              name="description"
              value={eventData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          {/* Type d'événement */}
          <div>
            <label className="block font-medium mb-2">
              Type d&apos;événement *
            </label>
            <select
              name="type"
              value={eventData.type}
              onChange={handleChange}
              className="w-full p-3 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="">Veuillez choisir un type</option>
              <option value="public">Public - Visible par tous</option>
              <option value="private">Privé - Participants sélectionnés</option>
              <option value="group">Groupe - Membres du groupe</option>
            </select>
          </div>

          {/* Sélection de groupe (si type = group) */}
          {eventData.type === "group" && (
            <div>
              <label className="block font-medium mb-2">Groupe *</label>
              <select
                name="group_id"
                value={eventData.group_id}
                onChange={handleChange}
                className="w-full p-3 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              >
                <option value="">Sélectionnez un groupe</option>
                {userGroups.map((g) => {
                  // Selon GroupList.jsx, la structure est probablement { group_id: { _id, nom }, ... }
                  const id = g?.group_id?._id || g?._id;
                  const name = g?.group_id?.nom || g?.nom || "Groupe";
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
              {userGroups.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  Vous n&apos;êtes membre d&apos;aucun groupe. Créez ou
                  rejoignez un groupe pour créer un événement de groupe.
                </p>
              )}
            </div>
          )}

          {/* Sélection de participants (si type = private) */}
          {eventData.type === "private" && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-medium">Participants</label>
                <button
                  type="button"
                  onClick={() => setIsParticipantModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <FaUserPlus size={14} />
                  Ajouter
                </button>
              </div>

              {/* Liste des participants sélectionnés */}
              {selectedUsersPreview.length > 0 && (
                <PartcipantList
                  participants={selectedUsersPreview}
                  currentUserId={user?._id}
                  maxHeight={160}
                  onRemove={handleRemoveSelectedParticipant}
                />
              )}

              {/* Liste des participants existants (pour modification) */}
              {selectedEvent && eventParticipants.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium mb-2">Participants actuels :</h4>
                  <PartcipantList
                    participants={eventParticipants}
                    currentUserId={user?._id}
                    maxHeight={100}
                    onRemove={handleRemoveParticipant}
                  />
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">Date de début *</label>
              <input 
                type="datetime-local"
                name="date_debut"
                value={eventData.date_debut}
                onChange={handleChange} 
                required
                className="w-full p-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">Date de fin *</label>
              <input 
                type="datetime-local"
                name="date_fin"
                value={eventData.date_fin}
                onChange={handleChange}
                required
                className="w-full p-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-center gap-3 pt-4 border-t">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-2 border-2 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>

            {selectedEvent && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white active:bg-red-500 active:text-white px-6 py-2 rounded-md transition-colors"
                disabled={loading}
              >
                Supprimer
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`text-white px-6 py-2 rounded-md transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : selectedEvent
                  ? "bg-green-500 hover:bg-green-600 active:bg-green-600"
                  : "bg-blue-500 hover:bg-blue-600 active:bg-blue-600"
              }`}
            >
              {loading ? "Chargement..." : selectedEvent ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>

        {/* Modals */}
        <ConfirmDeleteModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          message="Êtes-vous sûr de vouloir supprimer l'événement ?"
        />

        <ConfirmActionModal 
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleUpdate}
          message="Êtes-vous sûr de vouloir modifier vos informations ?"
        />

        <ParticipantModal
          isOpen={isParticipantModalOpen}
          onClose={() => setIsParticipantModalOpen(false)}
          onSave={handleAddParticipants}
          currentUserId={user?._id}
          existingParticipants={eventParticipants}
        />
      </div>
    </div>
  );
};

export default EventForm;

