import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineUser, AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { useAuth } from "../../context/AuthContext";


import { getToken } from "../../utils/tokenUtils";
import { toast } from 'react-toastify'

import Logo from '../../assets/Region.png'
import Chat1 from '../../assets/chat1.png'

const Login = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false);
    //const [formData, setFormData] = useState({ pseudo: "", email: "", mdp: ""})
    const navigate = useNavigate()
    const { login, user } = useAuth()
    const { register, handleSubmit, formState: { errors }} = useForm();

    useEffect(() => {
        if (user) {
          const token = getToken()
            if (token) navigate("/dashboard");
        }
    }, [navigate, user]);

    const handleLogin = async (credentials) => {
      setIsLoading(true)
      try {
        //await login(data);
        const data = await login(credentials)
        console.log("Connexion reussi", data)

      } catch (error) {
        if(error.status === 404) {
          // si le backend return 404 user non trouvé
          toast.error("Compte non existant! Veuillez creer un compte", {position: "top-right"})
          setTimeout(() => {
            navigate("/signup")
          }, 3000)
        }else if (error.status === 500) {
            toast.error("Erreur serveur. Veuillez réessayer plus tard.");
        } else {
            console.error('Erreur lors de la connexion :', error);
        }
      } finally {
        setIsLoading(false)
      }
    }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white shadow-lg rounded-2xl flex flex-col md:flex-row max-w-4xl w-full p-6 overflow-hidden border-2 border-black">
          {/* logo et formulaire */}
          <div className=" flex flex-col w-auto md:flex p-8 ml-5">
            {/* Logo */}
            <div className="flex items-center justify-start"> 
                  <img src={Logo} alt="Logo" className="mr-3 h-14 w-14"/>
                  <h2 className="text-lg font-light">Région Haute Matsiatra</h2>
            </div>

            {/* Titre */}
            <h2 className="text-xl font-semibold text-center mb-4">SE CONNECTER</h2>

            {/* Form */}
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
              {/* Pseudo */}
              <div>
                <label htmlFor="pseudo" className="block text-sm font-medium text-gray-600 mb-1">
                    Pseudo
                </label>
                <div className="relative">
                    <AiOutlineUser className="absolute top-5 left-3 transform -translate-y-1/2 text-gray-600"/>
                    <input 
                      type="text" 
                      id="pseudo"
                      placeholder="Entrez votre pseudo"
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register("pseudo", { required: "Le pseudo est requis"})}
                    />
                    {errors.pseudo && <p className="text-red-500 text-sm">{errors.pseudo.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                </label>
                <div className="relative">
                    <AiOutlineMail className="absolute top-5 left-3 transform -translate-y-1/2 text-gray-600"/>
                    <input 
                      type="email"
                      id="email"
                      {...register("email", { required: "Email requis",
                        pattern: { value: /\S+@\S+\.\S+/, message: "Email non valide" }
                      })}
                      placeholder="Entrez votre email"
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="mdp" className="block text-sm font-medium text-gray600 mb-1">
                    Mot de passe
                </label>
                <div className="relative">
                    <AiOutlineLock className="absolute top-5 left-3 transform -translate-y-1/2 text-gray-600"/>
                    <input 
                      type={showPassword ? "text" : "password"}
                      id="mdp"
                      {...register("mdp", { required: "Mot de passe requis",
                        minLength: { value: 3, message: "Le mot de passe doit contenir au moins 6 caractères" }
                      })}
                      placeholder="Entrez votre mot de passe"
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-3 right-3 text-gray-400">
                          {showPassword ? <AiOutlineEyeInvisible/> : <AiOutlineEye/>}
                      </button>
                      {errors.mdp && <p className="text-red-500 text-sm">{errors.mdp.message}</p>}
                </div>
              </div>

               {/* Bouton et lien */}
               <div className="text-center">
                    <p className="text-base">
                    Vous n&apos;avez pas de compte ?{" "} 
                      <Link to="/signup" className="text-orange-600 font-semibold hover:underline">
                        S&apos;enregister
                      </Link>
                    </p>
                    <button 
                      type="submit"
                      className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                    >
                        { isLoading ? "Connexion..." : "Se connecter" }
                    </button>
                  </div>
            </form>
          </div>

           {/* Illustration*/}
          <div className=" hidden md:flex w-1/2 justify-center items-center p-8 ">
            <img src={Chat1} alt="Illustration" className="mt-6 w-full" />  
          </div>

        </div>
    </div>
  )
}

export default Login
