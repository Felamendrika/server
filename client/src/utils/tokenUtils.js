// sauvergarde du token
export const saveToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    console.warn("Token non fourni pour la sauvegarde.");
  }
};

// recuperer le token
export const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("Aucun token trouvé dans le localStorage.");
  }
  return token;
};

// supprimer le token
export const removeToken = () => {
  localStorage.removeItem("token");
};
