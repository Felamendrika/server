/* eslint-disable react/prop-types */
import { useState } from "react"

import { useGroup } from "../../context/GroupContext"
import { useSocket } from '../../context/SocketContext'
import { IoIosCloseCircleOutline } from "react-icons/io";
import { HiOutlineUserGroup } from "react-icons/hi";
import { toast } from "react-toastify";
import ConfirmActionModal from "../common/ConfirmActionModal";

const GroupModal = ({onClose, currentGroup = null }) => {

  const {
    createGroup,
    updateGroup,
    fetchUserGroups,
  } = useGroup()

  const { socket } = useSocket()

  const [nom, setNom] = useState(currentGroup?.nom ||"")
  const [description, setDescription] = useState(currentGroup?.description || "")
  const [loading , setLoading] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);


  const handleCreateGroup = async(e) => {
    e.preventDefault()
    setLoading(true)

    if(!nom || nom.length === 0) {
      toast.error("Le nom du groupe est requis !")
      return
    }

    if (currentGroup) {
      setIsConfirmModalOpen(true);
    } else {
      executeAction()
    }
  }

  const executeAction = async () => {
    setLoading(true)
    try {
      if (currentGroup) {
        const updatedGroup = await updateGroup(currentGroup._id, { nom, description })
        await fetchUserGroups()
        socket?.emit('groupUpdated', {
          groupId: currentGroup._id,
          updates: updatedGroup
      })
      }else {
        const newGroup = await createGroup({ 
          nom,
          description
        })
        socket?.emit('groupCreated', { group: newGroup })
        await fetchUserGroups()
      }
        setNom("")
        setDescription("")
        onClose()
    } catch(error) {
      console.error("Erreur:", error)
    }finally{
      setLoading(false)
      onClose()
    }
  }

  return (
    <div className=" bg-gray-50 border-black p-6 w-[400px] rounded-lg shadow-lg relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-700">
        <IoIosCloseCircleOutline size={20} />
      </button>

      <div className="flex items-center mb-4">
        <div className='rounded-lg border-2 w-10 h-10 justify-center mr-3'>
          <HiOutlineUserGroup size={40} className="text-xl p-2 border-gray-300 border-2 rounded-lg text-gray-600"/>
        </div>

        <h2 className="text-lg font-semi-bold flex-grow">Informations à propos du Groupe {currentGroup ? "a modifier " : "a creer "}: </h2>
      </div>

      <form onSubmit={handleCreateGroup} >
        <div className=" mb-4">
          <label htmlFor="nom" className="text-sm mb-1 text-gray-500">Nom du Groupe :</label>
          <input 
            type="text" 
            id="nom"
            name="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            className=" w-full p-2 border bg-transparent border-gray-400 rounded-md focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Description de votre groupe <span className="text-gray-400">(facultatif)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
              className=" w-full p-2 border bg-transparent border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          />
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
              disabled={loading}
              className={`px-4 py-2 w-32 text-white rounded-lg  focus:outline-none ${currentGroup ? "bg-green-400 hover:bg-green-500" : "  bg-blue-600 hover:bg-blue-700"} ${
                loading && "opacity-50 cursor-not-allowed"
              }`}
            >
              {loading ? 'Chargement...' : currentGroup ? 'Modifier' :'Créer'}
            </button>
          </div>
      </form>

      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeAction}
        message="Êtes-vous sûr de vouloir modifier les informations du groupe ?"
      />
    </div>
  )
}

export default GroupModal
