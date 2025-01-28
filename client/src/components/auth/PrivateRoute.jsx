/* eslint-disable react/prop-types */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Rendre le composant enfant si l'utilisateur est authentifié
  return isAuthenticated ? children : <Navigate to='/login' />
};

export default PrivateRoute;



