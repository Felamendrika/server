/* eslint-disable no-unused-vars */

import {useEffect, useRef,useState} from 'react'
import { FiPaperclip, FiTrash2, FiEdit ,FiSmile, FiMoreHorizontal, FiX } from 'react-icons/fi'
import EmojiPicker from 'emoji-picker-react'
import { toast } from 'react-toastify'
import userAvatar from "../../assets/userAvatar.jpg"

import {format} from 'date-fns'

import ConfirmDeleteModal from "../common/ConfirmDeleteModal"
import { useMessage } from '../../context/MessageContext'
import { useGroup } from '../../context/GroupContext'
import { useSocket } from "../../context/SocketContext"

import GroupModal from '../modal/GroupModal'

const GroupConversation = () => {
    const {
      fetchGroupConversation,
      fetchConversationMessages,
      fetchFilesByConversations,
      currentConversation,
      clearConversationState,
      createMessage,
      updateMessage,
      deleteMessage,
      deleteConversation,
      setCurrentConversation,
      messages,
      loading
    } = useMessage()

    const {
      currentGroup,
      setCurrentGroup,
      deleteGroup,
    } = useGroup()

    const { socket } = useSocket()

    const [messageContent, setMessageContent] = useState([])
    const [editingMessageId, setEditingMessageId] = useState(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    // const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [file, setFile] = useState(null)
    const [fileName, setFileName] = useState("");
    const [filePreview, setFilePreview] = useState([])
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [openDropdownMessageId, setOpenDropdownMessageId] = useState(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const scrollRef = useRef(null)
    const dropdownRef = useRef(null)

    useEffect(() => {
      fetchGroupConversation
    }, [fetchGroupConversation])

    useEffect(() => {
      if (currentConversation) {
        fetchConversationMessages(currentConversation._id)
      }
    }, [fetchConversationMessages, currentConversation])

    useEffect(() => {
      if (!currentGroup) {
          setCurrentConversation(null); // Réinitialiser si aucun groupe n'est sélectionné
      }
  }, [currentGroup, setCurrentConversation]);

    useEffect(() => {
      if (socket && currentGroup) {
        /*socket.on("updateGroup", (data) => {
          setCurrentGroup(data.group)
        }) */
        
        const handleGroupUpdated = (data) => {
          if (data.group._id === currentGroup._id) {
            setCurrentGroup(data.group)
          }
        }

        const handleGroupRemoved = ({ groupId }) => {
          if ( groupId === currentGroup._id) {
            setCurrentGroup(null)
            setCurrentConversation(null)
            clearConversationState()
          }
        }

        /*const handleMessageModified = (data) => {
          if (currentConversation._id === data.conversation._id) {
            fetchConversationMessages(currentConversation._id)
          }
        }

        const handleMessageDeleted = (data) => {
          if (currentConversation._id === data.conversation._id) {
            fetchConversationMessages(currentConversation._id)
          }
        } */

        socket.on("updateGroup", handleGroupUpdated)
        socket.on("removeGroup", handleGroupRemoved)
      }
    }, [socket, currentGroup, setCurrentGroup, setCurrentConversation, clearConversationState])


  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Défiler automatiquement jusqu'au dernier message
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentConversation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) {
        return;
      }
      setOpenDropdownMessageId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

    const handleEmojiClick = (emoji) => {
        setMessageContent((prev) => prev + emoji.emoji)
    }

    useEffect(() => {
      return () => {
        if (filePreview) {
          URL.revokeObjectURL(filePreview);
        }
      };
    }, [filePreview]);


    const handleSendMessage = async () => {
      if (!messageContent.length === 0 && !file) {
        toast.warning("Le message est vide. Veuillez saisir du texte")
        return
      }
  
      try {
        if (editingMessageId) {
          // modif message existant
          await updateMessage(editingMessageId, messageContent)
          setEditingMessageId(null)
        } else {
          await createMessage(currentConversation._id, messageContent, file)
          await fetchConversationMessages(currentConversation._id)
        }
  
        await fetchFilesByConversations(currentConversation._id)
        setMessageContent("")
        setFile(null)
        setFilePreview(null)

        setTimeout(scrollToBottom, 100);
        
      } catch (error) {
        console.error("Erreur lors de l'envoi du message :", error)
        toast.error("Erreur lors de l'envoi du message")
      }
    }
  
    const handleEditMessage = (message) => {
      setEditingMessageId(message._id)
      setMessageContent(message.contenu)
      setFilePreview(null)
    }

    const handleCancelEdit = () => {
      setEditingMessageId(null)
      setMessageContent("")
    }
  
    const handleDeleteMessage = async (messageId) => {
      try {
        await deleteMessage(messageId)
        await fetchFilesByConversations(currentConversation._id)
  
      } catch (error) {
        console.error("Erreur lors de la suppression du message :", error)
        toast.error("Erreur lors de la suppression du message")
      }
    }    

    const handleDeleteGroup = async () => {
      if (currentGroup._id) {
        try {
          await deleteGroup(currentGroup._id)
          if(currentConversation?._id) {
            await deleteConversation(currentConversation._id)
          }
          await fetchGroupConversation()

          setCurrentGroup(null)
          setCurrentConversation(null)
          console.log("Groupe et conversation de groupe supprimer :", currentGroup)
        } catch (error) {
          console.error("Erreur lors de la suppression du groupe:", error)
        }
      } else {
        console.error("NO groupe for deleting")
      }
    }

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
            setFileName(selectedFile.name)
        
            if (selectedFile.type.startsWith("image")) {
                //await previewFile(selectedFile._id)
                const reader = new FileReader();
                reader.onload = (event) => setFilePreview(event.target.result);
                reader.readAsDataURL(selectedFile)
            }
            else {
                setFilePreview(URL.createObjectURL(selectedFile))
            }
    
        }
    }
    const handleFileRemove = () => {
        setFile(null)
        setFilePreview(null)
    }

    const toggleDropdown = (messageId) => {
      setOpenDropdownMessageId((prevId) => (prevId === messageId ? null : messageId))
    }  

    if (loading) {
      return <div className="text-center">Chargement des conversations...</div>;
    }

    if (!currentGroup || !currentConversation) {
      return (
        <div className="h-full min-w-[70%] flex flex-col bg-gray-50 border-black rounded-lg pb-4 shadow-sm overflow-hidden text-center text-gray-500 justify-center">Sélectionnez un groupe pour afficher les messages de la conversation.</div>
      )
  }
  
   /* if (!currentConversation) {
      return <div className="h-full min-w-[70%] flex flex-col bg-gray-50 border-black rounded-lg pb-4 shadow-sm overflow-hidden text-center text-gray-500 justify-center">Sélectionnez une conversation pour afficher les messages.</div>;
    }*/

    return (
        <div className="h-full w-[70%] flex flex-col bg-gray-50 border-gray-200 border-2 rounded-lg pb-4 shadow-sm overflow-hidden ">
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b'>
              <div className='flex items-center gap-3'>
                {/* <div className="w-12 h-12 rounded-full bg-gray-300"></div> */}
                <div>
                    <h3 className="font-semibold text-lg">{currentGroup?.nom || "Nom du Groupe"}</h3>
                    <p className="text-gray-500 text-sm">{ currentGroup?.description || "Description du groupe"}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'> 
                <button
                onClick={() => setIsUpdateModalOpen(true)}
                className='border-transparent hover:rounded-lg p-1 hover:text-gray-500 hover:border-yellow-500 active:text-gray-500 active:border-yellow-500 transition-all'
                >
                  <FiEdit size={20}/>
                </button>
                <button
                onClick={() => setIsDeleteModalOpen(true)}
                className='border-transparent hover:rounded-lg p-1 hover:text-red-500 hover:border-red-500 active:text-red-500 active:border-red-500 transition-all'
                >
                  <FiTrash2 size={20}/>
                </button>

              </div>
            
            </div>

            {messages.length > 0 ? (
              <div 
                ref={scrollRef}
                className='flex-1 max-h-[90%] space-y-4 p-4 overflow-y-auto pr-1 custom-scrollbar'
              >
                {messages.map((msg) => {
                  const isUserMessage = !currentConversation?.otherParticipants.some(
                    (p) => p._id === msg.user_id._id
                  )

                  const messageParticipant = currentConversation?.otherParticipants.find(
                    (p) => p._id === msg.user_id._id
                  )
                  return (
                    <div 
                      key={msg._id}
                      className={`flex ${
                        isUserMessage ? "justify-end" : "justify-start"
                      }`}
                    > 
                      {!isUserMessage && messageParticipant && (
                        <div className='flex flex-col items-center mr-1 mt-2'>
                          <img 
                            src={messageParticipant?.avatar || userAvatar}
                            alt={messageParticipant?.pseudo || "image"} 
                            className='w-8 h-8 rounded-full object-cover'
                          />
                        </div>
                      )}
                      <div className={`relative flex flex-col mr-3 ml-3 mb-1 ${isUserMessage ? "items-end" : "items-start"}`}>
                          {!isUserMessage && messageParticipant && (
                            <span className='text-xs text-gray-600 mt-1'>
                              {messageParticipant?.pseudo || "Utilisateur"}
                            </span>
                          )}
                        <div className={`p-3 rounded-lg max-lg max-w-xs md:max-w-xs ${isUserMessage ? "bg-gray-100" : "bg-yellow-50"}`}>
                          <div className='max-h-[90%] w-full'>
                            {msg.isDeleted ? (
                              msg.fichier ? (
                                <span className="text-gray-500 italic">Fichier supprimé</span>
                              ) : (
                                <span className='text-gray-500 italic mt-2 p-3'>Message supprimé</span>
                              )
                            ) : (
                              <p className={`text-sm font-normal mt-2 cursor-default`}>
                                {msg.contenu }
                              </p>
                            )}
                          </div>

                          <div>
                            {msg.fichier && msg.fichier.type.startsWith("image") ? (
                              <a
                                href={`${msg.fichier.chemin_fichier}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={msg.fichier.nom}
                                className='text-sm text-blue-600 underline cursor-pointer'
                              >
                                <img 
                                  src={`${msg.fichier.chemin_fichier}`}
                                  alt="image"
                                  className='rounded-md cursor-pointer max-w-full max-h-[300px] '
                                />
                              </a>
                            ) : msg.fichier ? (
                              <a
                                href={`${msg.fichier.chemin_fichier}`}
                                target='_blank'
                                rel="noopener noreferrer"
                                download={msg.fichier.nom}
                                className='text-sm text-blue-600 underline cursor-pointer'
                              >
                                {msg.fichier.nom}
                              </a>
                            ) : null }
                          </div>
                        </div>
                        
                        {/* MEnu deroulant */}
                        <div className={` flex mb-2 ${
                          isUserMessage ? "justify-end mr-2" : "justify-start ml-2"
                        }`}
                        >
                          {isUserMessage && !msg.isDeleted && (
                            <button
                              onClick={() => toggleDropdown(msg._id)}
                              className={`absolute top-1 text-gray-500 hover:text-gray-700 ${isUserMessage ? "right-2 " : "left-2" }`}
                            > 
                              <FiMoreHorizontal size={18} />
                            </button>
                          )}
                          {openDropdownMessageId === msg._id && (
                            <div
                              className={`absolute ${ isUserMessage ? "left-1" : "right-1"} mt-2 bg-gray-50 shadow-md rounded-lg border`}
                            >
                              <button
                                onClick={() => {
                                  handleEditMessage(msg) 
                                  setOpenDropdownMessageId(null) 
                                }}
                                className='block px-4 py-2 hover:bg-gray-100 text-left w-full '
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteMessage(msg._id) 
                                  setOpenDropdownMessageId(null) 
                                }}
                                className='block px-4 py-2 hover:bg-gray-100 text-left w-full '
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                          <p className='text-xs text-end text-gray-400 pt-1 block'>
                            {format(new Date(msg.date_envoi), "dd-MM-yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            ) : (
              <div className='flex-1 max-h-[90%] space-y-2 p-4 overflow-y-auto pr-1 custom-scrollbar'>
                <p className="text-center text-gray-500">Aucune message pour l&apos;instant</p>
              </div>
            )}

            
      {/* Input Section */}

      <div className='pt-4 pl-4 pr-4 border-t flex items-center gap-3 w-full'>
        {/* Fichier */}
        <label htmlFor="fileInput" className='cursor-pointer text-gray-500'>
          <FiPaperclip size={20}/>
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Previsualisation */}
        { file && filePreview && (
          <div className="relative">
            {file?.type?.startsWith("image") ? (
              <img
                src={filePreview}
                className="max-w-[100px] max-h-[100px] rounded-md"
              />

            ) : (
              <div className="bg-gray-200 text-gray-600 rounded-md p-2">
                  {fileName || "Fichier sélectionné"}
              </div>
            )}
            <button
              onClick={handleFileRemove}
              className='absolute top-0 right-0 bg-red-500 text-white rounded-full p-1'
            >
              <FiX size={12} />
            </button>
          </div>
        )}

        <input
          type="text"
          placeholder="Tapez votre message..."
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:outline-none"
        />

        {/* Emoji Picker */}
        <div className="relative justify-end">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-gray-500"
          >
            <FiSmile size={20} />
          </button>
          {showEmojiPicker && (
            <div
              className="absolute bottom-12 right-0 z-10"
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
        {editingMessageId && (
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
          >
            Annuler
          </button>
        )}

        {/* Bouton Envoyer */}
        <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"   
        >
          {editingMessageId ? "Modifier" : "Envoyer"}
        </button>
      </div>


      {/* Modal de confirmation */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <GroupModal 
          currentGroup={currentGroup}
          onClose={() => setIsUpdateModalOpen(false)}
          />
        </div>
      )}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteGroup}
        message="Êtes-vous sûr de vouloir supprimer le groupe ?"
      />
    </div>
    )
}

export default GroupConversation
