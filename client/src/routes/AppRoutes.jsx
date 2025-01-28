import { Routes, Route, Navigate } from "react-router-dom"
import Signup from "../pages/auth/Signup"
import Login from "../pages/auth/Login"
import Dashboard from "../pages/Dashboard"
//import Dashboard from "../pages/form/Dashboard"
import PrivateRoute from "../components/auth/PrivateRoute"

const AppRoutes = () => {
  return (
        <Routes>
            {/* Routes publiques */}
            <Route path="/signup" element={<Signup/>}/>
            <Route path="/login" element={<Login/>}/>

            <Route path="/" element={<Login />} />

            {/* Routes privee */}
            <Route
                path="/dashboard/*"
                element= {
                    <PrivateRoute>
                        <Dashboard/>
                    </PrivateRoute>
                }
            />
             {/* Redirection par défaut vers la page de connexion */}
            <Route path="/dashboard/*" element={<Navigate to="/messages" />} />
            
        </Routes>
  )
}

export default AppRoutes
