import api from "./api";

// Créer un groupe
export const createGroup = async ({ nom, description }) => {
  try {
    const response = await api.post("/groups/create", {
      nom,
      description,
    });
    console.log(response.data);
    return response.data;
  } catch (err) {
    console.log("Erreur dans createGroup:", err.response?.data || err.message);
    throw err.response?.data || "Erreur lors de la création du groupe";
  }
};

// export const createGroup = async (groupData) => {
//   try {
//     const response = api.post("/groups/create", groupData);
//     console.log(response.data);
//     console.log(response.group);
//     return response.data;
//   } catch (error) {
//     console.error("Erreur creation du groupe ");
//     throw new Error(error.response?.data || error.message);
//   }
// };

export const updateGroup = async (groupId, updateData) => {
  try {
    const response = await api.put(`/groups/update/${groupId}`, updateData);

    console.log("Information group maj :", response.data);

    return response.data;
  } catch (error) {
    console.error("Erreur dans updateGroup:", error);
    throw error.response?.data || "Erreur lors de la mise a jour du groupe";
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const response = await api.delete(`/groups/delete/${groupId}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log("Erreur lors de la suppression du groupe :", error);

    throw error.response?.data || error.message;
  }
};

export const getGroupById = async (groupId) => {
  try {
    const response = await api.get(`/groups/${groupId}`);

    console.log(response.data);
    console.log(response.data.membre);

    return response.data;
  } catch (error) {
    console.error("Erreur dans la recuperation par Id du groupe :", error);
    throw error.response?.data || error.message;
  }
};

export const getUsersGroups = async () => {
  try {
    const response = await api.get(`/groups/group/user`);

    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Erreur lors de getUsersGroups :", error);

    throw error.response?.data || error.message;
  }
};

export const getGroupMembres = async (groupId) => {
  try {
    const response = await api.get(`/groups/${groupId}/membre`);
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Erreur recuperation memebre groupe : ", error);
    throw error.response?.data || error.message;
  }
};

// Récupérer tous les groupes
export const getAllGroups = async () => {
  try {
    const response = await api.get("/groups");
    return response.data;
  } catch (err) {
    console.log("Erreur dans getAllGroups:", err.message);
    throw err.response?.data || "Erreur lors de la récupération des groupes";
  }
};
