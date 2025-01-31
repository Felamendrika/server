
import {useEffect, useRef,useState} from 'react'

import { FiPaperclip, FiTrash2, FiSmile, FiMoreHorizontal, FiX } from 'react-icons/fi'
import EmojiPicker from 'emoji-picker-react'
import { toast } from 'react-toastify'
import userAvatar from "../../assets/userAvatar.jpg"

import {format} from 'date-fns'

import ConfirmDeleteModal from "../common/ConfirmDeleteModal"
import { useMessage } from '../../context/MessageContext'
import { useSocket } from '../../context/SocketContext'

const ConversationDisplay = () => {
  const {
    // fetchPrivateConversations,
    fetchConversationMessages,
    // fetchFilesByConversations,
    currentConversation,
    createMessage,
    updateMessage,
    deleteMessage,
    deleteConversation,
    setCurrentConversation,
    messages,
    loading
  } = useMessage()

  const { socket } = useSocket()

  const [messageContent, setMessageContent] = useState([])
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [openDropdownMessageId, setOpenDropdownMessageId] = useState(null);
  // const [isSending, setIsSending] = useState(false); // Nouvel état pour éviter les envois multiples

  const scrollRef = useRef(null)
  const dropdownRef = useRef(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }
    // Défiler automatiquement jusqu'au dernier message
    useEffect(() => {
      scrollToBottom()
    }, [messages, currentConversation]);

  // useEffect(() => {
  //   if (currentConversation) {
  //     fetchPrivateConversations(currentConversation._id)
  //   }
  // }, [fetchPrivateConversations, currentConversation])

  useEffect(() => {
    if (socket && currentConversation?._id) {
      socket.emit("joinConversation", currentConversation._id)

      
      const handleMessageReceived = (data) => {
        if (currentConversation._id === data.conversation_id) {
          // fetchConversationMessages(currentConversation._id);
          scrollToBottom();
        }
      };

      const handleMessageModified = (data) => {
        if (currentConversation._id === data.conversation_id) {
          fetchConversationMessages(currentConversation._id);
        }
      };

      const handleMessageDeleted = (data) => {
        if (currentConversation._id === data.conversation_id) {
          fetchConversationMessages(currentConversation._id);
        }
      };

      const handleConversationRemoved = ({ conversationId }) => {
        if (currentConversation._id === conversationId) {
          setCurrentConversation(null);
        }
      };

      socket.on("messageReceived", handleMessageReceived);
      socket.on("messageModified", handleMessageModified);
      socket.on("messageDeleted", handleMessageDeleted);
      socket.on("conversationRemoved", handleConversationRemoved);

      return () => {
        socket.emit("leaveConversation", currentConversation._id);
        socket.off("messageReceived", handleMessageReceived);
        socket.off("messageModified", handleMessageModified);
        socket.off("messageDeleted", handleMessageDeleted);
        socket.off("conversationRemoved", handleConversationRemoved);
      };
  }

  }, [socket, currentConversation, fetchConversationMessages, setCurrentConversation]);

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
    setShowEmojiPicker(false)
  }
  
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleSendMessage = async () => {
    // if (isSending) return; // Évite les envois multiples
    if (!messageContent.length === 0 && !file) {
      toast.warning("Le message est vide. Veuillez saisir du texte")
      return
    }

    try {
      if (editingMessageId) {
        // modif message existant
        const updatedMessage = await updateMessage(editingMessageId, messageContent)
        socket?.emit("messageUpdated", {
          conversationId: currentConversation._id,
          message: updatedMessage
        })
        setEditingMessageId(null)
      } else {
        // setIsSending(true);
        await createMessage(currentConversation._id, messageContent, file)
      }

      // await fetchFilesByConversations(currentConversation._id)
      setMessageContent("")
      setFile(null)
      setFilePreview(null)
      setShowEmojiPicker(false);

      // await fetchPrivateConversations(currentConversation._id)

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
      socket?.emit("messageDeleted", {
        conversationId: currentConversation._id,
        messageId
      })
      // await fetchFilesByConversations(currentConversation._id)

    } catch (error) {
      console.error("Erreur lors de la suppression du message :", error)
      toast.error("Erreur lors de la suppression du message")
    }
  }

  const handleDeleteConversation = async () => {
    if (currentConversation) {
        try {
          await deleteConversation(currentConversation._id)
          socket?.emit("conversationDeleted", {
            conversationId: currentConversation._id
          })
          setCurrentConversation(null)
          console.log("Conversation supprimer")
        } catch (error) {
            console.error("Erreur lors de la suppression :", error)
        }
    }else {
      console.log("NO CONVERSATION FOR DELETING")
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

  if (!currentConversation) {
    return <div className="h-full min-w-[70%] flex flex-col bg-gray-50 border-black rounded-lg pb-4 shadow-sm overflow-hidden text-center text-gray-500 justify-center">Sélectionnez une conversation pour afficher les messages.</div>;
  }

  return (
    <div className="h-full w-[70%] flex flex-col bg-gray-50 border-gray-200 border-2 rounded-lg pb-4 shadow-sm overflow-hidden ">
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-3'>
            <img src={ currentConversation.otherParticipant?.avatar || userAvatar} alt="" className='w-12 h-12 justify-center rounded-full object-cover' />
            <div>
              <h3 className="font-semibold text-lg">{currentConversation.otherParticipant.pseudo}</h3>
              <p className="text-gray-500 text-sm">{currentConversation.otherParticipant.nom} {" "} {currentConversation.otherParticipant.prenom} </p>
            </div>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className='border-transparent hover:rounded-lg p-1 hover:text-red-500 hover:border-red-500 active:text-red-500 active:border-red-500 transition-all'
          >
            <FiTrash2 size={20}/>
          </button>
      </div>
      

      {messages.length > 0 ? (
        <div 
          ref={scrollRef}
          className='flex-1 max-h-[90%] space-y-4 p-4 overflow-y-auto pr-1 custom-scrollbar'
        >
          {messages.map((msg) => {
            const isUserMessage = msg.user_id._id === currentConversation.otherParticipant._id
            return (
              <div
                key={msg._id}
                className={`flex ${
                  isUserMessage ? "justify-start" : "justify-end"
                }`}
              >
                <div className='relative flex flex-col mr-3 ml-3 mb-1' >
                  
                  <div className={`p-3 rounded-lg max-w-xs md:max-w-xs ${isUserMessage ? "bg-yellow-50" : "bg-gray-100"}`}>
                    <div className=' max-h-full w-full' >
                      {msg.isDeleted ? (
                        msg.fichier ? (
                          <span className="text-gray-500 italic">Fichier supprimé</span>
                        ) : (
                          <span className='text-gray-500 italic mt-2'>Message supprimé</span>
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
                        ) : null
                      }
                  </div>
                </div>

                {/* Menu deroulant */}
                  <div  className={`flex ${
                    isUserMessage ? "justify-start ml-2 " : "justify-end mr-2"
                    }`}
                  >
                    {!isUserMessage && !msg.isDeleted && (
                      <button 
                      onClick={() => toggleDropdown(msg._id)}
                        //onClick={() => handleEditMessage(msg)}
                        className={`absolute top-1 text-gray-500 hover:text-gray-700 ${isUserMessage ? "left-2 " : "right-2" }`}
                      >
                        <FiMoreHorizontal size={18} />
                      </button>

                    )}
                      {openDropdownMessageId === msg._id && !isUserMessage && !msg.isDeleted && (
                        <div
                          // ref={dropdownRef}
                          className={`absolute ${ isUserMessage ? "left-1" : "right-1"} top-0 mt-6 bg-gray-50 shadow-md rounded-lg border z-10`}
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
      {currentConversation && currentConversation.otherParticipant?.isDeleted ? (
        <div className='pt-4 pl-4 pr-4 border-t flex items-center gap-3 w-full'>
          <p className='italic text-center text-gray-500'>Ce contact a été supprimé</p>
        </div>
      ) : (

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
          <div className="relative">
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
      )}


      {/* Modal de confirmation */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConversation}
        message="Êtes-vous sûr de vouloir supprimer la conversation ?"
      />
    </div>
  )
}

export default ConversationDisplay
