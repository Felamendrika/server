/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext"
import { updateUser, deleteUser } from "../../services/userService";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {IoIosCloseCircleOutline} from "react-icons/io"
import {HiOutlinePencilSquare} from "react-icons/hi2"

import Modal from "./Modal";

import userAvatar from "../../assets/userAvatar.jpg"

import ConfirmDeleteModal from "../common/ConfirmDeleteModal";
import ConfirmActionModal from "../common/ConfirmActionModal";

import {toast} from "react-toastify"
import { useNavigate } from "react-router-dom";

const UserModal = ({ onClose }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const { user, token, setUser } = useAuth(); // Récupération des informations utilisateur

    const [formData, setFormData] = useState({
      nom: user?.nom || "",
      prenom: user?.prenom || "",
      pseudo: user?.pseudo || "",
      email: user?.email || "",
      oldPassword: "",
      newPassword: "",
    });

    
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({ old: false, new: false });
    const navigate = useNavigate()

  //const defaultAvatar = "https://via.placeholder.com/150"

  
  useEffect(() => {
        console.log("User:", user);
        if(!user) {
          console.error("Chargement des informations utilisateur ...")
        }
      }, [user])
    
      if (!user) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-600 text-xl">Chargement des informations...</p>
          </div>
        );
      }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const avatar = e.target.files[0];
    if (avatar) {
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(avatar.type)) {
        toast.error("Format d'image invalide !");
        return;
      }
      if (avatar.size > 2 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max : 2 Mo).");
        return;
      }
      setAvatar(avatar);
      setAvatarPreview(URL.createObjectURL(avatar));
    }
  };

  const handleUpdate = async () => {
    setLoading(true);

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => form.append(key, formData[key]));
      if (avatar) form.append("avatar", avatar);

      const updatedUser = await updateUser(form, token);
      setUser(updatedUser.user);
      toast.success("Mise à jour réussie !")
      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise a jour des informations :", error)
      toast.error(`Erreur: ${error.message} || Une erreur est survenu`, { position: "top-left"})
      //toast.error(error.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      try {
        await deleteUser(token);
        setUser(null)
        // setToken(null)
        toast.success("Compte supprimé avec succès !");
        onClose(); 
        navigate('/signup', { replace: true });
      } catch (error) {
        toast.error(error.message || "Erreur lors de la suppression.");
      }
  };

  //if (!isOpen) return null;

  return (
    <Modal>
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-25 z-modal ">
        <div className="bg-gray-50 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-600">
              <IoIosCloseCircleOutline size={20} />
            </button>
            <div className="flex items-center gap-6 mb-6">

              <div className="relative w-24 h-24">
                <img
                  src={avatarPreview || userAvatar}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border"
                />
                <label
                  htmlFor="avatar"
                  className="absolute bottom-0 right-0 bg-gray-100 rounded-full p-2 cursor-pointer"
                >
                  <HiOutlinePencilSquare size={20} />
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute bottom-0 right-0 cursor-pointer opacity-0 w-24 h-24 border"
                /> 
                </label>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.nom}  {user?.prenom}</h2>
                <p className="text-base text-gray-500">{user?.pseudo}</p>
                <p className="text-base">{user?.email}</p>
              </div>

            </div>

            <h2 className="text-xl font-semibold mb-4 -mt-2">Modifier les informations :</h2>

          <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
            <div className="flex flex-col">
              <label htmlFor="nom" className="text-sm mb-1 text-gray-500">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="p-2 border bg-transparent border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="prenom" className="text-sm mb-1 text-gray-500">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                className="p-2  bg-transparent border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="pseudo" className="text-sm mb-1 text-gray-500">Pseudo</label>
              <input
                type="text"
                id="pseudo"
                name="pseudo"
                value={formData.pseudo}
                onChange={handleInputChange}
                className="p-2 border bg-transparent border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" 
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="email" className="text-sm mb-1 text-gray-500">Email</label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="p-2 bg-transparent border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" 
              />
            </div>
            <div className="flex flex-col relative">
              <label htmlFor="oldPassword" className="text-sm mb-1 text-gray-500">Ancien Mot de Passe</label>
              <input
                type={showPassword.old ? "text" : "password"}
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleInputChange}
                className="p-2 bg-transparent border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" 
              />
              <button
                type="button"
                className="absolute top-9 right-3 text-gray-500"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, old: !prev.old }))
                }
              >
                {showPassword.old ?  <AiOutlineEye /> : <AiOutlineEyeInvisible /> }
              </button>
            </div>
            <div className="flex flex-col relative">
              <label htmlFor="newPassword" className="text-sm mb-1 text-gray-500">Nouveau Mot de Passe</label>
              <input
                type={ showPassword.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="p-2 bg-transparent border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" 
              />
              <button
                type="button"
                className="absolute top-9 right-3 text-gray-500"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                }
              >
                {showPassword.new ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
              </button>
            </div>


          </form>
            <div className="flex justify-center gap-5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 rounded-md hover:bg-gray-200 active:bg-gray-300 w-32"
              >
                Annuler
              </button>
              <button
                type="submit"
                onClick={() => setIsConfirmModalOpen(true)}
                className={`px-4 py-2 w-32 bg-green-500 text-white rounded-md hover:bg-green-600 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Mise à jour..." : "Modifier"}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 w-32 bg-transparent border-2 border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white"
              >
                Supprimer
              </button>
            </div>
            {/* Modal de confirmation */}
            <ConfirmDeleteModal 
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={() => {
                handleDelete()
                setIsDeleteModalOpen(false)
              }}
              message = "Êtes-vous sûr de vouloir supprimer votre compte ?"
            />

            <ConfirmActionModal
              isOpen={isConfirmModalOpen}
              onClose={() => setIsConfirmModalOpen(false)}
              onConfirm={() => {
                handleUpdate()
                setIsConfirmModalOpen(false)
              }}
              message = "Êtes-vous sûr de vouloir modifier vos informations ?"
            />
          </div>
      </div>
    </Modal>
    )
  };

export default UserModal

