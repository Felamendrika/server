/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */

import {  createContext, useCallback, useContext, useEffect, useState } from "react";
import * as eventService from "../services/eventService";
import { addParticipant, removeParticipant, getUserParticipatingEvents, getParticipants } from "../services/participantService";
import { toast } from "react-toastify";

const EventContext = createContext()

// Provider
export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([])
    const [selectedEvent, setSelectedEvent] = useState([])
    const [upcomingEvents, setUpcomingEvents] = useState([])
    const [pastEvents, setPastEvents] = useState([])
    const [eventParticipants, setEventParticipants] = useState([])
    const [participantEvents, setParticipantEvents] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchEvents = useCallback( async () => {
        if (events.length > 0 ) return 
        setLoading(true)
        try {
            const response = await eventService.getEvents()

            console.log(response.data)
            setEvents(response.data || [])
        } catch (error) {
            console.error("Erreur lors de la récupération des événements ", error)
        } finally {
            setLoading(false)
        }
    }, [events])

    const fetchUpcomingEvents = useCallback( async () => {
        setLoading(true)
        try {
            const response = await eventService.getUpComingEvents()
            console.data(response.data)
            setUpcomingEvents(response.data)
        } catch (error) {
            console.error("Erreur lors de la récupération des événements à venir", error)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchPastEvents = async () => {
        try {
            const data = await eventService.getPastEvents()
            console.log(data)
            setPastEvents(data)
        } catch (error) {
            console.error("Erreur lors de la récupération des événements passés", error)
        }
    }

    const fetchEventById = useCallback( async (eventId) => {
        setLoading(true)
        try {
            const response = await eventService.getEventById(eventId)
            console.log(response.data)

            setSelectedEvent(response.data)
        } catch (error) {
            console.log("Erreur recuperation de l'event par ID :", error)
        } finally {
            setLoading(false)
        }
    }, [])

    const createEvent = async (eventData) => {
        try {
            const response = await eventService.createEvent(eventData)
            console.log("Event creer :", response.data)
            setEvents((prev) => [...prev, response.data])
            toast.success("Événement créé avec succès !")
        } catch (error) {
            toast.error(error.message)
            console.error("Erreur lors de la création de l'événement", error)
        }
    }

    const updateEvent = async (eventId, updateData) => {
        try {
            const response = await eventService.updateEvent(eventId, updateData)

            console.log("Event mis a jour :", response.data)
            setEvents((prev) => 
                prev.map((event) => (event._id === eventId ? response.data : event ))
            )
            toast.success("Événement modifié avec succès !")
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'événement", error)
            toast.error(error.message)
        }
    }

    const deleteEvent = async (eventId) => {
        try {
            await eventService.deleteEvent(eventId)

            setEvents((prev) => prev.filter((event) => event._id !== eventId))
            console.log("Événement supprimé avec succès")
            toast.success("Événement supprimé avec succès")
        } catch (error) {
            console.error("Erreur lors de la suppression de l'événement", error)
            toast.error(error.message || "Erreur lors de la suppression de l'événement")
        }
    }

    const addParticipantsToEvent = async (eventId, userIds) => {
        try {
            const response = await addParticipant.apply(eventId, userIds)
            console.log("AJout participant :", response)
            console.log(response.data)
            setEventParticipants((prev) => [...prev, ...response.data])
        } catch (error) {
            console.error("Erreur lors de l'ajout des participants :", error)
            throw error.message || error.reponse?.data
        }
    }

    const removeParticipantFromEvent = async (eventId, userId) => {
        try {
            await removeParticipant(eventId, userId)
            setEventParticipants((prev) => 
                prev.filter((participant) => participant.user_id !== userId)
            )
        } catch (error) {
            console.error("erreur lors de la suppression de l'event:", error)
            throw error.response?.data || error.message
        }
    }

    // recuperer les participant d'un event
    const fetchEventParticipants = useCallback( async (eventId) => {
        setLoading(true)
        try {
            const response = await getParticipants(eventId)
            console.log(response)
            console.log("participant a l'event :", response.data)

            setEventParticipants(response.data)
        } catch (error) {
            console.log("Erreur lors de recuperation des participant a l'event :", error)
            throw error.response?.data || error.message
        } finally {
            setLoading(false)
        }
    }, []) 

    // recuperer les event auquel l'user connecter participe
    const fetchUserParticipatingEvents = useCallback( async () => {
        setLoading(true)
        try {
            const response = await getUserParticipatingEvents()
            console.log(response.data)

            setParticipantEvents(response.data)
        } catch (error) {
            console.log("Erreur recuperation des venemnts pour le participant :". error)
            throw error.response?.data || error.message
        } finally{
            setLoading(false)
        }
    }, [])

    const contextValue = { 
        events, 
        upcomingEvents, 
        pastEvents,
        selectedEvent,
        eventParticipants,
        participantEvents,
        loading,
        fetchEvents, 
        fetchUpcomingEvents, 
        fetchPastEvents, 
        fetchEventById,
        createEvent, 
        updateEvent, 
        deleteEvent,
        addParticipantsToEvent,
        removeParticipantFromEvent,
        fetchEventParticipants,
        fetchUserParticipatingEvents
    }

    return (
        <EventContext.Provider value={ contextValue} >
            { children }
        </EventContext.Provider>
    )
}

// Hook pour acceder au contexte
export const useEvent = () => {
    const context = useContext(EventContext)
    if(!context) {
        throw new Error ('usEvent doit etre utiliser dans un AuthProvider')
    }
    return context
}

/*import { createContext, useContext, useEffect, useReducer } from "react";
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/eventService'

const EventContext = createContext()

// reducer pour gerer l'etat des events
const eventReducer  = (state, action) => {
    switch (action.type) {
        case "SET_EVENTS": 
            return { ...state, events: action.payload }
        case "ADD_EVENT":
            return { ...state, events: [...state.events, action.payload]}
        case "UPDATE_EVENT":
            return {
                ...state,
                events: state.events.map((event) => 
                    event._id === action.payload._id ? action.payload : event
                )
            }
        case    "DELETE_EVENT": 
            return {
                ...state,
                events: state.events.filter((event) => event._id !== action.payload),
            }
        default:
            return state
    }
}

// contexte
export const EventProvider = ({ children }) => {
    const [state, dispatch] = useReducer(eventReducer, { events: [] })

    // charger les evenemnts a l'initialisation
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const events = await getEvents()
                dispatch({ type: "SET_EVENTS", payload: events})
            } catch (error) {
                console.log("Erreur lors du chargement des événements :", error)
            }
        }

        fetchEvents()

    }, [])

    //actions de gestion event 
    const addEvent = async (eventData) => {
        try {
            const newEvent = await createEvent(eventData)
            dispatch({ type: "ADD_EVENT", payload: newEvent})
        } catch (error) {
            console.error("Erreur lors de la création de l'événement :", error);
        }
    }

    const updateExistingEvent = async (eventId, updateData) => {
        try {
            const updatedEvent = await updateEvent(eventId, updateData)
            dispatch({ type: "UPDATE_EVENT", payload: updatedEvent})
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'événement :", error);
          }
    }

    const deleteExistingEvent = async (eventId) => {
        try {
            await deleteEvent(eventId)
            dispatch({ type: "DELETE_EVENT", payload: eventId})
        } catch (error) {
            console.error("Erreur lors de la suppression de l'événement :", error);
        }
    }

    const context = { ...state, addEvent, updateExistingEvent, deleteExistingEvent}

    return (
        <EventContext.Provider value={context} >
            { children }
        </EventContext.Provider>
    )
}

// Hook pour utiliser le contexte
export const useEventContext = () => {
    return useContext(EventContext);
};
*/