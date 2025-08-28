import moment from "moment";
import "moment/locale/fr"; // affichage du calendrier en francais
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useEvent } from "../../context/EventContext";
import { useSocket } from "../../context/SocketContext";

import { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { LuCalendarPlus, LuFilter } from "react-icons/lu";
import { toast } from "react-toastify";
import EventForm from "./EventForm";

// config du moment pour le calendrier
moment.locale("fr");
const localizer = momentLocalizer(moment);

const CalendarDisplay = () => {
  const {
    events,
    publicEvents,
    privateEvents,
    groupEvents,
    fetchEvents,
    fetchFilteredEvents,
    loading,
  } = useEvent();

  const { socket } = useSocket();

  const [isEventFormModal, setIsEventFormModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchEvents();
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des evenements : ",
          error
        );
        toast("Impossible de charger les evenements");
      }
    };
    fetchData();
  }, [fetchEvents]);

  useEffect(() => {
    if (socket) {
      // Les événements sont maintenant gérés automatiquement par le contexte
      // Plus besoin de recharger manuellement
      return () => {
        socket.off("newEvent");
        socket.off("eventModified");
        socket.off("eventRemoved");
      };
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <AiOutlineLoading3Quarters className="animate-spin text-2xl text-blue-500" />
        <p className="text-lg text-gray-500">Chargement des evenements...</p>
      </div>
    );
  }

  // Fonction pour obtenir les événements filtrés
  const getFilteredEvents = () => {
    switch (filterType) {
      case "public":
        return publicEvents;
      case "private":
        return privateEvents;
      case "group":
        return groupEvents;
      default:
        return events;
    }
  };

  // Fonction pour gérer le changement de filtre
  const handleFilterChange = async (type) => {
    setFilterType(type);
    setShowFilterMenu(false);

    if (type !== "all") {
      try {
        await fetchFilteredEvents(type);
      } catch (error) {
        console.error(`Erreur lors du filtrage des événements ${type}:`, error);
        toast.error(`Impossible de charger les événements ${type}`);
      }
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsEventFormModal(true);
  };

  const handleSelectEvent = async (event) => {
    console.log("Event clicked:", event);
    try {
      // Utiliser directement l'événement sélectionné au lieu de le recharger
      setSelectedEvent(event);
      setIsEventFormModal(true);
    } catch (error) {
      console.error("Erreur lors de la sélection de l'événement :", error);
      toast.error("Impossible de charger les détails de l'événement");
    }
  };

  const closeEventForm = () => {
    setSelectedEvent(null);
    setIsEventFormModal(false);
  };

  // Fonction pour styliser les événements selon leur type
  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad";
    let borderColor = "#3174ad";

    switch (event.type) {
      case "public":
        backgroundColor = "#10b981"; // vert
        borderColor = "#10b981";
        break;
      case "private":
        backgroundColor = "#f59e0b"; // orange
        borderColor = "#f59e0b";
        break;
      case "group":
        backgroundColor = "#8b5cf6"; // violet
        borderColor = "#8b5cf6";
        break;
      default:
        backgroundColor = "#3174ad"; // bleu par défaut
        borderColor = "#3174ad";
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
      },
    };
  };

  return (
    <div className="w-full h-full p-4 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Calendrier Partagé</h2>

          {/* Légende des types d'événements */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Public</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Privé</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Groupe</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton de filtre */}
          <div className="relative">
            <button
              type="button"
              aria-label="Filtrer les événements"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 border-2 rounded-xl border-gray-300 transition-all"
            >
              <LuFilter size={18} />
              <span className="text-sm">
                {filterType === "all"
                  ? "Tous"
                  : filterType === "public"
                  ? "Public"
                  : filterType === "private"
                  ? "Privé"
                  : "Groupe"}
              </span>
            </button>

            {/* Menu déroulant de filtre */}
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[140px]">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                    filterType === "all" ? "bg-blue-50 text-blue-600" : ""
                  }`}
                >
                  Tous les événements
                </button>
                <button
                  onClick={() => handleFilterChange("public")}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                    filterType === "public" ? "bg-blue-50 text-blue-600" : ""
                  }`}
                >
                  Événements publics
                </button>
                <button
                  onClick={() => handleFilterChange("private")}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                    filterType === "private" ? "bg-blue-50 text-blue-600" : ""
                  }`}
                >
                  Événements privés
                </button>
                <button
                  onClick={() => handleFilterChange("group")}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                    filterType === "group" ? "bg-blue-50 text-blue-600" : ""
                  }`}
                >
                  Événements de groupe
                </button>
              </div>
            )}
          </div>

          {/* Bouton d'ajout d'événement */}
          <button
            type="button"
            aria-label="Ajouter un événement"
            onClick={handleCreateEvent}
            className="text-gray-600 hover:bg-gray-100 active:bg-gray-100 border-2 rounded-xl border-gray-300 transition-all"
          >
            <LuCalendarPlus size={24} className="m-2" />
          </button>
        </div>
      </div>

      {/* Affichage du nombre d'événements filtrés */}
      <div className="mb-3 text-sm text-gray-600">
        {getFilteredEvents().length} événement(s) affiché(s)
        {filterType !== "all" && (
          <span className="ml-2 text-blue-600 font-medium">
            (Filtre:{" "}
            {filterType === "public"
              ? "Public"
              : filterType === "private"
              ? "Privé"
              : "Groupe"}
            )
          </span>
        )}
      </div>

      <div className="h-[85%] w-full border rounded-lg shadow-inner overflow-y-auto custom-scrollbar">
        <Calendar
          localizer={localizer}
          events={getFilteredEvents().map((event) => ({
            ...event,
            start: new Date(event.date_debut),
            end: new Date(event.date_fin),
            title: `${event.titre}${
              event.type === "group"
                ? ` (${event.group_id?.nom || "Groupe"})`
                : ""
            }`,
          }))}
          tooltipAccessor="description"
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          step={15}
          timeslots={4}
          min={new Date(0, 0, 0, 6, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
          style={{
            height: 600,
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
          onSelectEvent={(event) => handleSelectEvent(event)}
          messages={{
            next: "Suivant",
            previous: "Précédent",
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            noEventsInRange: "Aucun événement dans cette période.",
          }}
        />
      </div>

      {/* Modal de formulaire d'événement */}
      {isEventFormModal && (
        <EventForm onClose={closeEventForm} selectedEvent={selectedEvent} />
      )}
    </div>
  );
};

export default CalendarDisplay;
