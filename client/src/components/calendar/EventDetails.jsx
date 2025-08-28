import moment from "moment";
import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaEye,
  FaLock,
  FaUserFriends,
  FaUsers,
} from "react-icons/fa";
import { useEvent } from "../../context/EventContext";

const EventDetails = () => {
  const {
    fetchUpcomingEvents,
    fetchUserParticipatingEvents,
    upcomingEvents,
    participantEvents,
    loading,
  } = useEvent();

  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchUpcomingEvents();
        await fetchUserParticipatingEvents();
      } catch (error) {
        console.error("Erreur lors de la récupération des événements :", error);
      }
    };

    loadData();
  }, [fetchUpcomingEvents, fetchUserParticipatingEvents]);

  // Fonction pour obtenir l'icône selon le type d'événement
  const getEventTypeIcon = (type) => {
    switch (type) {
      case "public":
        return <FaEye className="text-green-500" size={14} />;
      case "private":
        return <FaLock className="text-orange-500" size={14} />;
      case "group":
        return <FaUserFriends className="text-purple-500" size={14} />;
      default:
        return <FaCalendarAlt className="text-blue-500" size={14} />;
    }
  };

  // Fonction pour formater la date
  const formatEventDate = (date) => {
    return moment(date).format("DD/MM/YYYY à HH:mm");
  };

  // Fonction pour obtenir le texte du type
  const getEventTypeText = (type) => {
    switch (type) {
      case "public":
        return "Public";
      case "private":
        return "Privé";
      case "group":
        return "Groupe";
      default:
        return "Événement";
    }
  };

  const renderEventCard = (event) => (
    <div
      key={event._id}
      className="bg-white rounded-lg p-3 mb-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2 flex-1">
          {event.titre}
        </h4>
        <div className="flex items-center gap-1 ml-2">
          {getEventTypeIcon(event.type)}
          <span className="text-xs text-gray-600">
            {getEventTypeText(event.type)}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
        {event.description}
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <FaClock size={10} />
        <span>{formatEventDate(event.date_debut)}</span>
      </div>

      {event.type === "group" && event.group_id && (
        <div className="flex items-center gap-1 text-xs text-purple-600">
          <FaUsers size={10} />
          <span>{event.group_id.nom}</span>
        </div>
      )}

      {event.createur_id && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <img
            src={event.createur_id.avatar}
            alt={event.createur_id.pseudo}
            className="w-4 h-4 rounded-full object-cover"
          />
          <span className="text-xs text-gray-600">
            {event.createur_id.pseudo ||
              `${event.createur_id.nom} ${event.createur_id.prenom}`}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full min-w-[300px] flex flex-col border-gray-200 border-2 bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden">
      {/* Onglets */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "upcoming"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          À venir ({upcomingEvents?.data?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("participating")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "participating"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Mes participations ({participantEvents?.length || 0})
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Chargement...</span>
          </div>
        ) : (
          <>
            {activeTab === "upcoming" && (
              <div>
                {upcomingEvents?.data?.length > 0 ? (
                  upcomingEvents.data.map(renderEventCard)
                ) : (
                  <div className="text-center py-8">
                    <FaCalendarAlt
                      className="mx-auto text-gray-400 mb-2"
                      size={24}
                    />
                    <p className="text-sm text-gray-500">
                      Aucun événement à venir
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "participating" && (
              <div>
                {participantEvents?.length > 0 ? (
                  participantEvents.map(renderEventCard)
                ) : (
                  <div className="text-center py-8">
                    <FaUsers className="mx-auto text-gray-400 mb-2" size={24} />
                    <p className="text-sm text-gray-500">
                      Vous ne participez à aucun événement
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
