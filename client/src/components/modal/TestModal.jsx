/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useEvent } from "../../context/EventContext";

import { FaTrash, FaUserPlus } from 'react-icons/fa';
import ParticipantModal from '../modal/ParticipantModal';
import { toast } from "react-toastify";

const TestModal = ({ isOpen, onClose, selectedEvent }) => {

    const { 
        createEvent, 
        updateEvent, 
        deleteEvent,
        addParticipantToEvent, 
        removeParticipantFromEvent,
    
      } = useEvent();
    
      const [eventData, setEventData] = useState({
        titre: "",
        description: "",
        date_debut: new Date(),
        date_fin: new Date(),
        participants: []
      })
    
      const [isParticipantModalOpen, setParticipantModalOpen] = useState(false)
    
      useEffect(() => {
        if(selectedEvent) {
          setEventData({
            titre: selectedEvent.titre,
            description: selectedEvent.description,
            date_debut: new Date(selectedEvent.date_debut),
            date_fin: new Date(selectedEvent.date_fin),
            participants: selectedEvent.participants || []
          })
        } else {
          setEventData({
            titre: '',
            description: '',
            date_debut: new Date(),
            date_fin: new Date(),
            participants: []
          })
        }
      }, [selectedEvent])
    
      const handleChange = (e) => {
        const { name, value } = e.target
        setEventData((prev) => ({ ...prev, [name]: value }))
      };
    
      const handleSubmit = async (e) => {
        e.preventDefault()
        const { titre, description, date_debut, date_fin } = eventData
    
        if (!titre || !date_debut || !date_fin && description) {
          toast.error ("Les champs Titre et dates sont obligatoires ")
          return
        }
    
        try {
            await createEvent(eventData)
            toast.success("Événement créé avec succès !")
          onClose()
        } catch (error) {
          console.log("Erreur dans createEvent :", error)
          toast.error("Une erreur est survenu ! Veuillez reessayer")
        }
      }
    
      const handleDelete = async () => {
        try {
          await deleteEvent(selectedEvent._id)
          toast.success("Événement supprimé avec succès !")
          onClose()
        } catch(error) {
          console.log("Une erreur s'est produite dans deleteEvent :", error)
          toast.error("Une erreur s'est produite")
        }
      }
    
      const handleUpdate = async () => {
        try {
          await updateEvent(selectedEvent._id, eventData)
          toast.success("Événement modifié avec succès !")
        } catch (error) {
          console.log("Erreur dans updateEvent :", error)
          toast.error("Une erreur est survenu")
        }
        onClose()
      }
    
      const handleRemoveParticipant = (participantId) => {
        removeParticipantFromEvent(selectedEvent.id, participantId)
        setEventData((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p.id !== participantId)
        }))
      }
    
      const handleAddParticipants = (selectedUsers) => {
        selectedUsers.forEach((user) => addParticipantToEvent(selectedEvent.id, user.id))
        setEventData((prev) => ({
          ...prev,
          participants: [...prev.participants, ...selectedUsers]
        }))
        setParticipantModalOpen(false)
      }

  if (!isOpen) return null; // Si isOpen est faux, ne rien afficher

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px]">
        <h2 className="text-2xl font-bold mb-4">
          {selectedEvent ? 'Modifier l’événement' : 'Créer un événement'}
        </h2>

        <div className="mb-4">
          <label className="block font-medium">Titre</label>
          <input
            type="text"
            name="titre"
            value={eventData.titre}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block font-medium">Date de début</label>
            <input 
              type="datetime-local"
              name="date_debut"
              value={eventData.date_debut}
              onChange={handleChange} 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block font-medium">Date de fin</label>
            <input 
              type="datetime-local"
              name="date_fin"
              value={eventData.date_fin}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium">Participants</label>
          <div className="flex flex-wrap gap-2">
            {eventData.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-2 bg-gray-200 p-2 rounded"
              >
                <span>{participant.name}</span>
                <button
                  onClick={() => handleRemoveParticipant(participant.id)}
                  className="text-red-500"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              onClick={() => setParticipantModalOpen(true)}
              className="text-blue-500"
            >
              <FaUserPlus size={18} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {selectedEvent && (
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Supprimer
            </button>
          )}
          <button
            onClick={selectedEvent ? handleUpdate : handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {selectedEvent ? 'Modifier' : 'Créer'}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Annuler
          </button>
        </div>

        {/* Modal des participants */}
        {isParticipantModalOpen && (
          <ParticipantModal
            isOpen={isParticipantModalOpen}
            onClose={() => setParticipantModalOpen(false)}
            onSave={handleAddParticipants}
          />
        )}
      </div>
    </div>
  );
};

export default TestModal;
