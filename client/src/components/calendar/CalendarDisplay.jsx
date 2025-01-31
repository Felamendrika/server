/* eslint-disable no-unused-vars */

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/fr' // affichage du calendrier en francais 

import { useEvent } from "../../context/EventContext"
import { useSocket } from '../../context/SocketContext';

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {LuCalendarPlus} from 'react-icons/lu'
import EventForm from "./EventForm"
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// import TestModal from '../modal/TestModal';

// config du moment pour le calendrier
moment.locale('fr')
const localizer = momentLocalizer(moment)

//const localizer = momentLocalizer(moment);

const CalendarDisplay = () => {
  const {
    events, 
    fetchEvents, 
    fetchEventById,
    loading,

  } = useEvent()

  const { socket } = useSocket();

  const [isEventFormModal, setIsEventFormModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  // const [isTestModalOpen, setIsTestModalOpen] = useState(false)


  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchEvents()

      } catch (error) {
        console.error("Erreur lors de la récupération des evenements : ", error)
        toast("Impossible de charger les evenements")
      }
    }
    fetchData()
  }, [fetchEvents])

  useEffect(() => {
    if(socket) {
      socket.on("eventCreated", (data) => {
        fetchEvents(); // Recharger les événements après création
      });
  
      socket.on("eventModified", (data) => {
        fetchEvents(); // Recharger après modification
      });
  
      socket.on("eventRemoved", (data) => {
        fetchEvents(); // Recharger après suppression
      });
  
      return () => {
        socket.off("eventCreated");
        socket.off("eventModified");
        socket.off("eventRemoved");
      };
    }
  }, [socket, fetchEvents])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <AiOutlineLoading3Quarters className="animate-spin text-2xl text-blue-500" />
        <p className="text-lg text-gray-500">Chargement des evenements...</p>
      </div>
    );
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setIsEventFormModal(true)

  }

  const handleSelectEvent = async (event) => {
    console.log("Event clicked:", event);
    try {
      await fetchEventById(event._id)
      setSelectedEvent(event)
      setIsEventFormModal(true)
    }catch (error) {
      console.error("Erreur lors de la sélection de l'événement :", error);
      toast.error("Impossible de charger les détails de l'événement");
    }
    //updateEvent(event)
  }

  const closeEventForm = () => {
    setSelectedEvent(null)
    setIsEventFormModal(!isEventFormModal)
  }

  return (
    <div className="w-full h-full p-4 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Calendrier Partagé :</h2>
        <button
          type='button'
          aria-label="Ajouter un événement"
          // onClick={openTestModal}
          onClick={handleCreateEvent}
          className="text-gray-600 hover:bg-gray-100 active:bg-gray-100 border-2 rounded-xl border-gray-300 transition-all"
        >
          <LuCalendarPlus size={24} className="m-2"/>
        </button>
      </div>

      <div className="h-[90%] w-full border rounded-lg shadow-inner overflow-y-auto custom-scrollbar">

      <Calendar
        localizer={localizer}
        events={events.map((event) => ({
          ...event,
          start: new Date(event.date_debut),
          end: new Date(event.date_fin),
          title: `${event.titre}`
        }))}
        tooltipAccessor="description"
        startAccessor="start"
        endAccessor="end"
        style={{ 
          height: 500,
          borderRadius: '8px',
          padding: "10px", 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", 
        }}
        onSelectEvent={(event) => handleSelectEvent(event)} // Ouvre EventForm avec l'événement sélectionné
        messages={{
          next: 'Suivant',
          previous: 'Précédent',
          today: "Aujourd'hui",
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
          agenda: 'Agenda',
          noEventsInRange: "Aucun événement dans cette période."
        }}
      />
      </div>
      {/* MOdal */}
      {/* {isTestModalOpen && <TestModal isOpen={isTestModalOpen} onClose={closeTestModal} selectedEvent={selectedEvent} />} */}
      {isEventFormModal && <EventForm isOpen={isEventFormModal} onClose={closeEventForm} selectedEvent={selectedEvent}/>}
    </div>
  );
};

export default CalendarDisplay;