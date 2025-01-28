
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineUser, AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BsImage } from "react-icons/bs";

import { useAuth } from "../../context/AuthContext";


import Logo from '../../assets/Region.png'
import Chat2 from '../../assets/chat2.png'

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [fileName, setFileName] = useState("");
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const { signup } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('nom', data.nom);
      formData.append('prenom', data.prenom);
      formData.append('pseudo', data.pseudo);
      formData.append('email', data.email);
      formData.append('mdp', data.mdp);
      if(data.avatar && data.avatar[0]) {
        formData.append('avatar', data.avatar[0]);
      }


      await signup(formData)

      console.log('Inscription reussie :', formData);

      navigate('/login')
    } catch (error) {
      console.log('Erreur lors de l\'inscription :', error);
      // toast.error(`Erreur: ${error.message}`, { position: "top-left"})
      //toast.error(`Erreur: ${error.message}`, {position: "top-left"})
    }
      
  }
  const handleImageChange = (e) => {
    const avatar = e.target.files[0]
    if(avatar) {
      setSelectedImage(URL.createObjectURL(avatar))
      setFileName(avatar.name)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl w-full max-w-4xl p-8 flex flex-col md:flex-row items-center gap-6 border-2 border-black">
            {/* logo et formulaire */}
            <div className="flex flex-col w-auto md:flex pl-4">
                <div className="flex items-center mb-4"> 
                  <img src={Logo} alt="Logo" className="mr-3 h-14 w-14"/>
                  <h2 className="text-lg font-light">Région Haute Matsiatra</h2>
                </div>
    
                <h2 className="text-xl font-bold mb-4 text-start ml-11">S&apos;ENREGISTRER</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* nom et prenom */}
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Nom
                      </label>
                      <div className="flex-1 relative">
                        <AiOutlineUser className="absolute top-3 left-3 text-gray-600"/>
                        <input 
                          type="text" 
                          {...register("nom", { required: "Nom requis"})}
                          placeholder="Entrez votre nom"
                          className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.nom && <p className="text-red-500 text-sm">{errors.nom.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Prenom
                      </label>
                      <div className="flex-1 relative">
                        <AiOutlineUser className="absolute top-3 left-4 text-gray-600"/>
                        <input 
                          type="text" 
                          {...register("prenom", { required: "Prenom requis" })}
                          placeholder="Entrez votre prenom"
                          className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.prenom && <p className="text-red-500 text-sm">{errors.prenom.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Pseudo et email */}
                  <div className="flex gap-4">

                    <div>
                      <label  className="block text-sm font-medium text-gray-500 mb-1">
                        Pseudo
                      </label>
                      <div className="flex-1 relative"> 
                        <AiOutlineUser className="absolute top-3 left-3 text-gray-600"/>
                        <input 
                          type="text" 
                          {...register("pseudo", { required: "Pseudo requis" })}
                          placeholder="Entrez votre pseudo"
                          className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.pseudo && <p className="text-red-500 text-sm">{errors.pseudo.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label  className="block text-sm font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <div className="flex-1 relative">
                        < AiOutlineMail className="absolute top-3 left-3 text-gray-600"/>
                        <input 
                          type="email" 
                          {...register("email", { required: "Email requis",
                            pattern: { value: /\S+@\S+\.\S+/, message: "Email non valide" }
                          })}
                          placeholder="Entrez votre email"
                          className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Mot de Passe */}
                  <div className="flex gap-4">
                    <div>
                      <label  className="block text-sm font-medium text-gray-500 mb-1">
                        Mot de Passe
                      </label>

                      <div className="flex-1 relative">
                        <AiOutlineLock className="absolute top-3 left-3 text-gray-600"/>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          {...register("mdp", { required: "Mot de passe requis",
                            minLength: { value: 6, message: "Le mot de passe doit contenir au moins 6 caractères" }
                          })}
                          className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-3 right-3 text-gray-400">
                          {showPassword ? <AiOutlineEyeInvisible/> : <AiOutlineEye/>}
                        </button>
                        {errors.mdp && <p className="text-red-500 text-sm">{errors.mdp.message}</p>}
                      </div>
                    </div>

                    <div>
                      <label  className="block text-sm font-medium text-gray-500 mb-1">
                        Mot de Passe
                      </label>

                      <div className="flex-1 relative">
                        <AiOutlineLock className="absolute top-3 left-3 text-gray-600"/>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          {...register("confirmMdp", { required: "Confirmation du mot de passe requis",
                            validate: (value) => value === watch("mdp") || "Les mots de passe ne correspondent pas",
                          })}
                          className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.confirmMdp && <p className="text-red-500 text-sm">{errors.confirmMdp.message}</p>}
                      </div>
                    </div>
                  </div>

                {/* Avatar */}
                <div className="relative">
                  <label className="block text-sm mb-1  text-gray-500">Photo de Profil :</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      {...register("avatar")}
                      id="avatar"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="avatar"
                      className="flex items-center gap-2 cursor-pointer py-2 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                    >
                      <BsImage className="text-gray-400"/>
                      Selectionner
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      readOnly
                      placeholder="Aucun fichier sélectionné"
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md bg-gray-50"
                    />
                    {selectedImage && (
                      <img src={selectedImage} alt="Preview" className="h-14 w-14 rounded-full object-cover"/>
                    )}
                  </div>
                </div>

                  {/* Bouton et lien */}
                  <div className="text-center">
                    <p className="text-base">
                      Vous avez déjà un compte ?{" "} 
                      <Link to="/login" className="text-purple-600 font-semibold hover:underline">
                        Se connecter
                      </Link>
                    </p>
                    <button 
                      type="submit"
                      className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                    >
                        S&apos;enregistrer
                    </button>
                  </div>

                </form>
            </div>

            {/* Illustration*/}
            <div className="hidden md:flex w-1/2 ">
                <img src={Chat2} alt="Illustration" className="mt-6 w-full" />  
            </div>
        </div>
    </div>
  )
}

export default Signup
