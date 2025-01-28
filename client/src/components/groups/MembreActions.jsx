/* eslint-disable react/prop-types */

import { useEffect, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useGroup } from "../../context/GroupContext";

import ConfirmDeleteModal from "../common/ConfirmDeleteModal";
import ConfirmActionModal from "../common/ConfirmActionModal";

const MembreActions = ({ membre, onClose }) => {
  const {
    currentGroup,
    loading,
    updateMembreRole,
    removeMembre,
    fetchRoles,
    fetchGroupMembres,
    roles
  } = useGroup()

  const [selectedRole, setSelectedRole] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  useEffect(() => {
    if (membre?.role_id?._id) {
      setSelectedRole(membre.role_id._id)
    }
    console.log("Membre recuperer dans le modal", membre)
  }, [membre])

  const handleUpdateRole = async () => {
    if (!selectedRole ) {
      console.error('Aucune role selectionner')
      console.log("selectedRole:", selectedRole);
      return
    }
      
    if(selectedRole === membre?.role_id?._id) {
      console.error("Rôle inchangé ou invalide, aucune action.")
      console.log("currentRole:", membre?.role_id?._id);
      return;
    }

    try {
      await updateMembreRole(membre._id, selectedRole) 
      onClose()
      if(currentGroup?._id) {
        await fetchGroupMembres(currentGroup?._id)
      } else {
        console.error("Aucun groupe actif")
      }

      console.log("ID de rôle sélectionné :", selectedRole);
      console.log("Rôles disponibles :", roles);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle: ", error)
    }
  }

  const handleDelete = async () => {
    try {
      await removeMembre(membre._id)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la suppression du membre: ", error)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 w-[450px] flex flex-col relative">
      <div>
        <IoIosCloseCircleOutline
          onClick={onClose}
          size={24}
          className="absolute top-3 right-4 text-gray-400 cursor-pointer hover:text-gray-600"
        />
      </div>

      <h2 className="text-xl font-semibold mb-4">Informations sur le Membre :</h2>

      <div className="flex items-center gap-4 mb-6">
        <img 
          src={membre?.user_id?.avatar}
          className="w-12 h-12 rounded-full object-cover"
        />

        <div>
          <p className="text-lg font-semibold">{membre?.user_id?.nom } {""} {membre?.user_id?.prenom}</p>
          <p className="text-gray-600">{membre?.role_id?.type || "Role"}</p>
        </div>
      </div>

      {/* Selecteur de role */}
      <div className="mb-6">
          <label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-900 ">
              Rôle : 
          </label>

          <select 
            name="role" 
            id="role"
            onChange={(e) => setSelectedRole(e.target.value)}
            className=" block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option selected disabled>Sélectionnez un rôle</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.type}
              </option>
            ))}
          </select>
      </div>

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
                disabled={loading}
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

      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleUpdateRole}
        message="Êtes-vous sûr de vouloir modifier le rôle du membre ?"
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        message="Êtes-vous sûr de vouloir retirer ce membre du groupe ?"
      />
    </div>
  )
}

export default MembreActions
