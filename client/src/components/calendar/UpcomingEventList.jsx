import { useState, useEffect } from "react"
import { useEvent } from "../../context/EventContext"
import {FiCalendar } from "react-icons/fi"


const UpcomingEventList = () => {
    const { fetchUpComingEvents } = useEvent()
    const [events, setEvents] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredEvents, setFilteredEvents] = useState([])

    useEffect(() => {
        // recuperer les evenements a venir au chargement du composant
        const loadEvents= async () => {
            try {
                const upcomingEvents = await fetchUpComingEvents()
                setEvents(upcomingEvents)
                console.log("Evenement a venir: ", upcomingEvents)
            } catch (error) {
                console.error("Erreur lors du chargement des evenements :", error)
            }
        }
        loadEvents()
    }, [fetchUpComingEvents])

    // token apina searchEvent.eventService pour rechercher dans tout les evenements
    useEffect(() => {
        // filtrer les evenements selon la recherche
        const filtered = events.filter((event) => 
            event.titre.toLOwerCase().includes(searchQuery.toLowerCase())
        )
        setFilteredEvents(filtered)
        console.log(filtered)
    }, [searchQuery, events])

    return (
        <div className="p-4 border rounded-md shadow-sm bg-white  max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Événements à venir</h3>
            <input 
                type="text"
                placeholder="Rechercher"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {filteredEvents.length > 0 ? (
                <ul className="space-y-3">
                    {filteredEvents.map((event) => (
                        <li
                            key={event.id}
                            className="flex items-center gap-4 p-3 border rounded-md hover: shadow-md"
                        >
                            <FiCalendar className="text-gray=700 text-xl"/>
                            <div>
                                <h4 className="font-medium">{event.titre}</h4>
                                <p className="text-sm text-gray-500">{event.date_debut} - {event.date_fin}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">Aucun événement à venir pour l&apos;instant</p>
            )}
        </div>
    )
}

export default UpcomingEventList
