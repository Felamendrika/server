
import { useState } from "react";
import { useEvent } from "../../context/EventContext";
//import { formatDate, isFutureDate } from "../../utils/dateUtils";

import UpcomingEventList from "./UpcomingEventList"
import { useEffect } from "react";

const EventDetails = () => {
  const { fetchUpcomingEvents} = useEvent()

  const [upcomingEvents, setUpcomingEvents] = useState([])
  // const [userEvents, setUserEvents] = useState([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  // const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    // event a venir
    const getUpcomingEvents = async () => {
      try {
        const events = await fetchUpcomingEvents()
        setUpcomingEvents(events)
      } catch (error) {
        console.error("Erreur lors de la récupération des événements à venir :", error);
      } finally {
        setLoadingUpcoming(false);
      }
    }

    getUpcomingEvents()
  }, [fetchUpcomingEvents])

  return (
    <div className="h-full min-w-[175px] flex flex-col border-gray-200 border-2 bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden">
      <div className="p-3 border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Événements à venir :</h2>
        {loadingUpcoming ? (
          <p>Chargement des événements...</p>
        ) : (
          <UpcomingEventList events={upcomingEvents} />
        )}
      </div>
    </div>
  );
};

export default EventDetails;
