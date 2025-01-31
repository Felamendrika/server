
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useEvent } from "../../context/EventContext";
import { useSocket } from "../../context/SocketContext";

import {IoIosCloseCircleOutline} from "react-icons/io"
import { toast } from "react-toastify";

import ConfirmDeleteModal from "../common/ConfirmDeleteModal";
import ConfirmActionModal from "../common/ConfirmActionModal";

const EventForm = ({ onClose, selectedEvent }) => {
  const { 
    createEvent, 
    updateEvent, 
    deleteEvent,
    // eventParticipants,
    // fetchEventParticipants,
    //addParticipantToEvent, 
    //removeParticipantFromEvent,
  } = useEvent();

  const { socket } = useSocket();

  const [eventData, setEventData] = useState({
    titre: "",
    description: "",
    date_debut: new Date(),
    date_fin: new Date(),
    createur_id: "",
    participants: []
  })

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // const [isParticipantModalOpen, setParticipantModalOpen] = useState(false)

  useEffect(() => {
    if(selectedEvent) {
      // console.log("Selected Event Loaded:", selectedEvent);
      setEventData({
        titre: selectedEvent.titre || "",
        description: selectedEvent.description || "",
        date_debut: selectedEvent.date_debut
          ? new Date(selectedEvent.date_debut).toISOString().slice(0, 16)
          : "",
        date_fin: selectedEvent.date_fin
          ? new Date(selectedEvent.date_fin).toISOString().slice(0, 16)
          : "",
        createur_id: selectedEvent.createur_id || "",
        participants: selectedEvent.participants || []
      })
    } else {
      setEventData({
        titre: '',
        description: '',
        date_debut: new Date(),
        date_fin: new Date(),
        createur_id: "",
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
        console.log("Creating Event:", eventData);
        const newEvent = await createEvent(eventData)
        socket?.emit("eventCreated", {
          event: newEvent
        });
  
        onClose()
        //toast.success("Événement créé avec succès !")
    } catch (error) {
      console.log("Erreur dans createEvent :", error)
      toast.error("Une erreur est survenu ! Veuillez reessayer")
    }
  }

  const handleDelete = async () => {
    //if (!selectedEvent) return
    try {
        console.log("Deleting Event ID:", selectedEvent._id);
        await deleteEvent(selectedEvent._id)
        socket?.emit("eventDeleted", {
          eventId: selectedEvent._id
        });
        onClose()
      } catch(error) {
        console.log("Une erreur s'est produite dans deleteEvent :", error)
        // toast.error("Une erreur s'est produite")
      }finally{
        onClose()
      }
  }

  const handleUpdate = async () => {
    try {
      console.log("Updating Event:", eventData);
      const updatedEvent = await updateEvent(selectedEvent._id, eventData)
      socket?.emit("eventUpdated", {
        event: updatedEvent,
        eventId: selectedEvent._id
      });
    } catch (error) {
      console.log("Erreur dans updateEvent :", error)
    }finally {
      onClose()
    }
  }

  // Ato ny fonction makasika ny participant en commentaire ambany ary 

  //if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">        
        <div className="bg-gray-50 rounded-lg p-6 w-[495px] flex flex-col">
          <div className='relative p-3'>
                <IoIosCloseCircleOutline 
                onClick={onClose}
                size={25}
                className='absolute top-3 right-4 text-gray-400 cursor-pointer hover:text-gray-600'
              />
          </div>   
          <h2 className="text-2xl font-bold mb-4">
            {selectedEvent ? 'Modifier l’événement' : 'Créer un événement'}
          </h2>

          {selectedEvent && selectedEvent?.createur_id && (
            <div className="flex items-center gap-3 mb-4">
              <p className="block font-medium">Créateur de l’événement: </p>
            <img
              src={selectedEvent.createur_id.avatar}
              alt={`${selectedEvent.createur_id.nom} ${selectedEvent.createur_id.prenom}`}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="text-base font-normal">{`${selectedEvent.createur_id?.nom} ${selectedEvent.createur_id?.prenom}`}</p>
            </div>
          </div>
          )}

          
          <div className="mb-4">
            <label className="block font-medium">Titre</label>
            <input
              type="text"
              name="titre"
              value={eventData.titre}
              onChange={handleChange}
              className="w-full mt-2 p-2 border bg-transparent border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium">Description</label>
            <textarea
              name="description"
              value={eventData.description}
              onChange={handleChange}
              className="w-full mt-2 p-2 border bg-transparent border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                required
                className="w-full mt-2 p-2 border bg-transparent border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block font-medium">Date de fin</label>
              <input 
                type="datetime-local"
                name="date_fin"
                value={eventData.date_fin}
                onChange={handleChange}
                required
                className="w-full mt-2 p-2 border bg-transparent border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Ato misy le list participant en commentaire  */}

          <div className="flex justify-center gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 border-2 rounded-md hover:bg-gray-200 active:bg-gray-300 w-32"
            >
              Annuler
            </button>

            {selectedEvent && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className=" border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white active:bg-red-500 active:text-white px-4 py-2 rounded-md w-32"
              >
                Supprimer
              </button>
            )}
            <button
              type="submit"
              onClick={selectedEvent ? handleUpdate : handleSubmit}
              className={`text-white px-4 py-2 rounded-md w-32 ${
                selectedEvent ? "bg-green-400 hover:bg-green-500 active:bg-green-500" : "bg-blue-500 hover:bg-blue-600 active:bg-blue-600"
              }`}
            >
              {selectedEvent ? 'Modifier' : 'Créer'}
            </button>

          </div>

      </div>

        <ConfirmDeleteModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          message= "Êtes-vous sûr de vouloir supprimer l'événement ?"
        />
        <ConfirmActionModal 
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleUpdate}
          message= "Êtes-vous sûr de vouloir modifier vos informations ?"
        />

    </div>
  )
};



export default EventForm;

/*

import { FaTrash, FaUserPlus } from 'react-icons/fa';
import ParticipantModal from '../modal/ParticipantModal';

  const handleRemoveParticipant = (participantId) => {
    if (!selectedEvent) return;
    console.log("Removing Participant ID:", participantId); 

    removeParticipantFromEvent(selectedEvent.id, participantId)
    setEventData((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== participantId)
    }))
  }

  const handleAddParticipants = (selectedUsers) => {
    if (!selectedEvent) return;
    
    selectedUsers.forEach((user) => addParticipantToEvent(selectedEvent.id, user.id))
    setEventData((prev) => ({
      ...prev,
      participants: [...prev.participants, ...selectedUsers]
    }))
    setParticipantModalOpen(false)
  }

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

        // { Modal des participants }
        {isParticipantModalOpen && (
          <ParticipantModal
            isOpen={isParticipantModalOpen}
            onClose={() => setParticipantModalOpen(false)}
            onSave={handleAddParticipants}
          />
        )}
*/