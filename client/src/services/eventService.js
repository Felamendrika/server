import api from "./api";

// creer un evenement
export const createEvent = async (eventData) => {
  try {
    const response = await api.post("/events/create", eventData);

    console.log("event creer :", response.data);
    // console.log(response.data.event);
    return response.data;
  } catch (error) {
    console.error("Erreur dans createEvent :", error.message);
    throw error.response?.data || error;
  }
};

export const getEvents = async () => {
  try {
    const response = await api.get("/events");

    console.log("All event fetch :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur recuperation de evenements :", error.message);
    throw error.response?.data || error.message;
  }
};

export const getEventById = async (eventId) => {
  return await api.get(`/events/${eventId}`);
};

export const getUserEvents = async () => {
  try {
    const response = await api.get("/events/event/user");

    console.log("Event de l'user", response.data.evenement);
    console.log("Participant de l'event de l'user", response.data.participants);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur fetch event de l'user :", error.message);
    throw error.response?.data || error.message;
  }
};

export const updateEvent = async (eventId, updatedData) => {
  try {
    const response = await api.put(`/events/update/${eventId}`, updatedData);

    console.log("Event mis a jour :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur mise a jour event :", error.message);
    throw error.response?.data || error.message;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events/delete/${eventId}`);

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur suppression event:", error.message);
    throw error.response?.data || error.message;
  }
};

export const getUpComingEvents = async () => {
  try {
    const response = await api.get("/events/event/upcoming");

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur recuperation UpComing Event :", error.message);
    throw error.response?.data || error.message;
  }
};

export const getPastEvents = async () => {
  try {
    const response = await api.get("/events/event/past");

    console.log("Evenements passee :", response.data);
    return response.data;
  } catch (error) {
    console.log("Erreur recuperation PastEvent :", error.message);
    throw error.response?.data || error.message;
  }
};

// export const searchEvents = async (query) => {
//   try {
//     const response = await api.get(`/events/search?${query}`, {
//       params: { titre: query },
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Erreur recherche event par titre :", error.message);
//     throw error.response?.data || error.message;
//   }
// };
