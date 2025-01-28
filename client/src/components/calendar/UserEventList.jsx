/* eslint-disable no-unused-vars */
import {useState, useEffect} from 'react'
import { useEvent} from "../../context/EventContext"
import {FiCalendar} from "react-icons/fi"

const UserEventList = () => {
    const { fetchUserEvents, fetchPastEvents } = useEvent()
    const [userEvents, setUserEvents] = useState([])
    const [pastEventIds, setPastEventIds] = useState([])

    useEffect(() => {
        // charger des events de l'user et exclure des events passee 
        const loadUserEvents = async () => {
            try {
                const [userEventsData, pastEventsData] = await Promise.all([
                    fetchUserEvents(),
                    fetchPastEvents()
                ])

                const pastIds = pastEventsData.map((event) => event.id)
                setPastEventIds(pastIds)

                //exclure les events passee
                const upcomingUserEvents = userEventsData.filter(
                    (event) => !pastIds.includes(event.id)
                )
                setUserEvents(upcomingUserEvents)
            } catch (error) {
                console.error("Erreur lors du chargement des evenements", error)
            }
        }
        loadUserEvents()
    }, [fetchUserEvents, fetchPastEvents])

    return (
        <div className='p-4 border rounded-md shadow-sm bg-white max-h-96 overflow-y-auto'>
            <h3 className='text-lg font-semibold mb-4'>Événements auxquels vous participez</h3>
            {userEvents.length > 0 ? (
                <ul className='space-y-3'>
                    {userEvents.map((event) => (
                        <li
                            key={event.id}
                            className='flex items-center gap-4 p-3 border rounded-md hover: shadow-md'
                        >
                            <FiCalendar className='text-green-500' text-xl/>
                            <div>
                                <h4 className='font-medium'>{event.titre}</h4>
                                <p className='text-sm text-gray-500'>{event.date_debut}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">Aucun événement auquel vous participez.</p>
            )}
        </div>
    )
}

export default UserEventList
