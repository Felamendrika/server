import api from "./api";

// Ajouter un membre à un groupe
export const addMembre = async ({ user_id, group_id }) => {
  try {
    const response = await api.post("/membres/add", {
      user_id,
      group_id,
    });
    console.log(response.membre);
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.log("Erreur dans addMembre:", err.message);
    throw err.response?.data || "Erreur lors de l'ajout du membre";
  }
};

// Récupérer un membre par son ID
export const getMembreById = async (membreId) => {
  try {
    const response = await api.get(`/membres/${membreId}`);
    console.log(response.data);
    console.log(response.membre);
    return response.data;
  } catch (err) {
    console.log("Erreur dans getMembreById:", err.message);
    throw err.response?.data || "Erreur lors de la récupération du membre";
  }
};

// Récupérer tous les membres
export const getAllMembres = async () => {
  try {
    const response = await api.get("/membres");
    console.log(response.data.membres);
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.log("Erreur dans getAllMembres:", err.message);
    throw err.response?.data || "Erreur lors de la récupération des membres";
  }
};

// Récupérer les membres d'un groupe spécifique
export const getMembresByGroup = async (groupId) => {
  try {
    const response = await api.get(`/membres/${groupId}/group`);
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.log("Erreur dans getMembresByGroup:", err.message);
    throw (
      err.response?.data ||
      "Erreur lors de la récupération des membres du groupe"
    );
  }
};

// Mettre à jour le rôle d'un membre
export const updateMembreRole = async (membreId, role_id) => {
  try {
    const response = await api.put(`/membres/updateRole/${membreId}`, {
      role_id,
    });
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.log("Erreur dans updateMembreRole:", err.message);
    throw err.response?.data || "Erreur lors de la mise à jour du rôle";
  }
};

// Supprimer un membre d'un groupe
export const removeMembreFromGroup = async (membreId) => {
  try {
    const response = await api.delete(`/membres/remove/${membreId}`);
    console.log(response.data);
    console.log(response.membres);
    return response.data;
  } catch (err) {
    console.log("Erreur dans removeMembreFromGroup:", err.message);
    throw err.response?.data || "Erreur lors de la suppression du membre";
  }
};

// Quitter un groupe
export const leaveGroup = async (groupId) => {
  try {
    const response = await api.delete(`/membres/leave-group/${groupId}`);

    console.log(response.data.membre);
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.log("Erreur dans leaveGroup:", err.message);
    throw err.response?.data || "Erreur lors de la sortie du groupe";
  }
};
