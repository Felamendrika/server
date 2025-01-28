import api from "./api";

// Créer un nouveau rôle
export const createRole = async ({ type }) => {
  try {
    const response = await api.post("/roles/create", { type });
    return response.data;
  } catch (err) {
    console.log("Erreur dans createRole:", err.message);
    throw err.response?.data || "Erreur lors de la création du rôle";
  }
};

// Récupérer tous les rôles
export const getAllRoles = async () => {
  try {
    const response = await api.get("/roles");
    return response.data;
  } catch (err) {
    console.log("Erreur dans getAllRoles:", err.message);
    throw err.response?.data || "Erreur lors de la récupération des rôles";
  }
};

// Récupérer un rôle par son ID
export const getRoleById = async (roleId) => {
  try {
    const response = await api.get(`/roles/${roleId}`);
    return response.data;
  } catch (err) {
    console.log("Erreur dans getRoleById:", err.message);
    throw err.response?.data || "Erreur lors de la récupération du rôle";
  }
};

// Supprimer un rôle
export const deleteRole = async (roleId) => {
  try {
    const response = await api.delete(`/roles/${roleId}`);
    return response.data;
  } catch (err) {
    console.log("Erreur dans deleteRole:", err.message);
    throw err.response?.data || "Erreur lors de la suppression du rôle";
  }
};
