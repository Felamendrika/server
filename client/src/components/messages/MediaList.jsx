
import { useEffect, useState } from "react"
import { FiSearch, FiTrash } from "react-icons/fi"
import {BsFileText} from 'react-icons/bs'
// import {toast} from 'react-toastify'

import { useMessage } from "../../context/MessageContext"
// import { useSocket } from "../../context/SocketContext"

const MediaList = () => {
  const {
    fetchFilesByConversations,
    fetchConversationMessages,
    currentConversation,
    deleteFile,
    fichiers,
    loading
  } = useMessage()

  // const { socket } = useSocket()

  const [images, setImages] = useState([])
  const [otherFiles, setOtherFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("")
  //const [filteredFiles, setFilteredFiles] = useState([])

  /*
  // Écouter les événements socket pour les fichiers
  useEffect(() => {
    if (socket && currentConversation?._id) {
      socket.on("fileDeleted", ({ fileId, conversationId }) => {
        if (conversationId === currentConversation._id) {
          fetchFilesByConversations(currentConversation._id)
        }
      })

      socket.on("newFile", ({ conversationId }) => {
        if (conversationId === currentConversation._id) {
          fetchFilesByConversations(currentConversation._id)
        }
      })

      return () => {
        socket.off("fileDeleted")
        socket.off("newFile")
      }
    }
  }, [socket, currentConversation, fetchFilesByConversations])
  */

  useEffect(() => {
    if (currentConversation?._id) {
      fetchFilesByConversations(currentConversation._id)
    }
  }, [fetchFilesByConversations, currentConversation?._id])

  // separer les images et les autres fichiers
  useEffect(() => {
    if(Array.isArray(fichiers)) {
      setImages(fichiers.filter((fichier) => fichier.type.startsWith("image")))
      setOtherFiles(fichiers.filter((fichier) => !fichier.type.startsWith("image")))
    } else {
      setImages([])
      setOtherFiles([])
      console.error("Fichiers n'est pas un tableau :", fichiers)
    }
  }, [fichiers])

  const filteredFiles = otherFiles.filter(
    (fichier) => 
      fichier.nom.toLowerCase().includes(searchTerm) ||
      fichier.type.toLowerCase().includes(searchTerm)
  )

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase()
    setSearchTerm(value)
  }

  const handleDeleteFile = async (fichierId) => {
    try {
      await deleteFile(fichierId)
      await fetchConversationMessages(currentConversation._id)

      /*
      // Émettre l'événement de suppression via socket
      socket?.emit("fileDeleted", {
        fileId: fichierId,
        conversationId: currentConversation._id
      })
      */
      // toast.success("Fichier supprimer avec succes !")
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier :", error);
    }
  }
  
  if (loading) {
    return <div className="h-full min-w-[175px] flex flex-col border-gray-200 border-2 bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden text-center">Chargement des medias...</div>;
  }

  if (!currentConversation) {
    return <div className="h-full min-w-[175px] flex flex-col bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden text-center text-gray-500 justify-center">Sélectionnez une conversation pour afficher les medias.</div>;
  }

  return (
    <div className="h-full min-w-[175px] flex flex-col border-gray-200 border-2 bg-gray-50 rounded-lg ml-2 shadow-md overflow-hidden">
      <div className="p-4 border-gray-200">
        <h2 className="text-base font-semibold">Galerie d&apos;images ({images.length})</h2>
      </div>

      <div className="flex-1 max-h-[40%] p-2 overflow-y-auto custom-scrollbar">

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <div
                key={image._id}
                className={` relative border rounded-lg overflow-clip`}
              >
                <a 
                  href={image.chemin_fichier}
                  target="_target"
                  rel="noopener noreferrer"
                  download
                >
                  <img 
                    src={image.chemin_fichier}
                    alt={image.nom}
                    className="w-full h-20 object-cover hover:opacity-80 cursor-pointer"
                  />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Aucune image pour l&apos;instant</p>
        )}
      </div>

      {/* Trait de séparation */}
      <div className="border-2 rounded w-[40%] mx-auto border-gray-400 my-2"></div>

      {/* Section fichier */}
      <div className="p-4 border-gray-200">
        <h2 className="text-base font-semibold">Fichiers ({filteredFiles.length})</h2>
        <div className="mt-2 relative">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Recherche ..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-3 py-2 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-transparent"
          />
        </div>
      </div>

      <div className="flex-1 max-h-[300px] overflow-y-auto custom-scrollbar pb-3">

        {/* Media list */}
        { filteredFiles.length > 0 ? (
          <div className="p-2">
            {filteredFiles.map((fichier) => (
              <div
                key={fichier._id}
                className="flex items-center p-2 hover:bg-gray-100 hover:rounded-md cursor-pointer justify-between"
              >
                <div className="flex items-center justify-between">
                  <a 
                    href={fichier.chemin_fichier}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >

                    <BsFileText size={20} className='text-gray-500 mr-2'/>
                    {/* User Info */}
                      <div className="ml-3 flex-1 w-32 truncate">
                          <span className="font-medium text-sm text-gray-600">{fichier.nom}</span>
                          <p className="text-xs text-gray-500 truncate">{fichier.taille}</p>
                      </div>
                  </a>

                  <button
                    onClick={() => handleDeleteFile(fichier._id)}
                    className="ml-4 hover:text-red-500 hover:border-red-500"
                  >
                    <FiTrash size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Aucun fichiers pour l&apos;instant</p>
        )}
      </div>
    </div>
  )
}

export default MediaList

/* 
import {getFileByConversation} from "../../services/fileService"

const { activeConversation } = state

const [fichiers, setFichiers] = useState([])

useEffect(() => {
  if (activeConversation) {
    fetchFilesByConversation(activeConversation)
  }
}, [activeConversation])

  const fetchFilesByConversation = async (conversationId) => {
    setLoading(true)
    try {
      const fichiers = await getFilesByConversations(conversationId)
      setFichiers(fichiers)
    } catch (error) {
      console.error("Erreur lors du chargement des fichiers :", error)
    } finally {
      setLoading(false)
    }
  }

  if (!activeConversation) {
    return <div>Selectionner une conversation pour voir les fichiers media</div>
  }

  if (loading) {
    return <div>chargement des fichiers ...</div>
  }
*/
