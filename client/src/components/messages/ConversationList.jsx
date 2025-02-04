/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useState} from "react"
import { FiSearch, FiPlusCircle } from "react-icons/fi"
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import UserList from "./UsersList"

import { useMessage } from "../../context/MessageContext";

import { useSocket } from "../../context/SocketContext";

//import { format} from "date-fns";
import { formatDistanceToNow } from "date-fns";

import userAvatar from "../../assets/userAvatar.jpg"
import { toast } from "react-toastify";

const ConversationList = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)

    const {
        conversations,
        fetchPrivateConversations,
        setCurrentConversation,
        fetchConversationMessages,
        createConversation,
        currentConversation,
        loading
    } = useMessage()

    const { socket, isUserOnline } = useSocket();  // Modification ici

    // Fonction pour vérifier si un utilisateur est en ligne
    // const isUserOnline = useCallback((userId) => {
    //     return onlineUsers.includes(userId);
    // }, [onlineUsers]);

    
    useEffect(() => {   
        const fetchData = async () => {
            try {
                await fetchPrivateConversations()
            } catch (error) {
                console.error("Erreur lors du chargement des conversations privées :", error);
                toast.error("Impossible de charger les conversations privées.");                
            }
        }  

        fetchData()
    }, [fetchPrivateConversations])

    useEffect(() => {
        if (socket) {

            // if(conversations.length > 0) {
            //     conversations.forEach(conversation => {
            //         socket.emit("joinConversation", conversation._id);
            //     });
            // }

            socket.on("conversationCreated", async (data) => {
                await fetchPrivateConversations();
            });

            socket.on("conversationRemoved", async ({ conversationId }) => {
                await fetchPrivateConversations();
                if (currentConversation?._id === conversationId) {
                    setCurrentConversation(null);
                }
            });

            return () => {
                socket.off("conversationCreated");
                socket.off("conversationRemoved");
                socket.off("conversationUpdated");
                // socket.off("messageReceived");
            }
        }
    }, [socket,fetchPrivateConversations, currentConversation, setCurrentConversation])

    // gestion du click
    const handleSelectConversation = async (conversation) => {
        if (currentConversation?._id === conversation._id) return; // Évite les rechargements inutiles
        
        if (currentConversation?._id) {
            socket?.emit("leaveConversation", currentConversation._id);
        }
        
        setCurrentConversation(conversation)
        await fetchConversationMessages(conversation._id)
        // markConversationAsRead(conversation._id)

        socket?.emit("joinConversation", conversation._id)
    }

    const filteredConversations = conversations.filter(conversation => 
        conversation?.otherParticipant?.pseudo?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const handleUserSelected = async (user) => {
        if (!user || !user._id) {
            toast.error("Utilisateur sélectionné invalide")
            return
        }
        try {
            const data = {
                type: "private",
                receiver_id: user._id,
            };

            const newConversation = await createConversation(data)
            socket?.emit("newPrivateConversation", {
                conversation: newConversation,
                receiverId: user._id
            });
            // socket?.emit("newConversation", { conversation: newConversation})
            setIsModalOpen(false)
            await fetchPrivateConversations()

        } catch (error) {
            console.error("Erreur de la creation de la conversation :", error)
            toast.error("Erreur lors de la création de la conversation.")
        }
    }

    const toggleUserModal = () => {
        setIsModalOpen(!isModalOpen)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <AiOutlineLoading3Quarters className="animate-spin text-2xl text-blue-500" />
                <div className="text-center">Chargement des conversations...</div>;
            </div>
        )
    }
    
return (
    <div className="h-full min-w-[230px] flex flex-col bg-gray-50 border-gray-200 border-2 rounded-lg mr-2 shadow-md overflow-hidden">
        <div className="p-3 border-gray-200 "> 
            <div className="flex justify-between items-center p-2">
                <h2 className="text-lg font-semibold">Messages</h2>
                <FiPlusCircle 
                    onClick={toggleUserModal}
                    className="text-xl  text-gray-500 cursor-pointer hover:text-gray-600 active:text-gray-700"
                />
            </div>
            <div className="mt-2 relative">
                <FiSearch className="absolute top-3 left-3 text-gray-400" />
                <input
                    type="text"
                    placeholder="Recherche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-transparent"
                />
            </div>
        </div>

            <div className="flex-1 max-h-[75%] overflow-y-auto pl-1 pr-1 custom-scrollbar " >
                {filteredConversations.length > 0 ? (
                    <div className="p-2">
                    {filteredConversations.map((conversation) => (
                        //const { _id, otherParticipant, lastMessage } = conversation;

                        <div
                            key={conversation._id}
                            onClick={() => handleSelectConversation(conversation)}
                            className={`flex w-full items-center p-2 hover:bg-gray-100 hover:rounded-md cursor-pointer ${
                                currentConversation?._id === conversation._id
                                    ? "bg-gray-100 border-l-8 border-yellow-100 rounded-md "
                                    : "bg-gray-50"
                            }`}
                        >
                            {/* Avatar */}
                            <img src={ conversation.otherParticipant?.avatar || userAvatar} alt="" className="w-10 h-10 justify-center rounded-full object-cover"/>

                            {/* User info */}
                            <div className="ml-3 flex-1 w-20">
                                <div className="flex justify-between items-center truncate w-full">
                                    <span className="font-medium text-sm text-gray-800 truncate overflow-clip">{ conversation.otherParticipant?.pseudo || "Utilisateur inconnu" }</span>
                                </div>
                                    <p className="text-xs text-gray-600 truncate overflow-clip">{conversation.lastMessage ? conversation.lastMessage.contenu : "Pas encore de message "}</p>
                        
                            </div>

                            <div className="flex flex-col items-center w-1/4">
                                {/* Indicateur de statut */}
                                <div
                                    className={`w-2 h-2 rounded-full mr-1 ml-4 ${
                                        isUserOnline(conversation.otherParticipant?._id) ? "bg-green-500" : "bg-gray-300"
                                            }`}
                                >
                                </div>  
                                {/* Date dernier message */}
                                {conversation.lastMessage && (
                                        <span className="text-xs text-gray-500 text-end">
                                            {/* {format(new Date(conversation.lastMessage.date_envoi), "dd/MM/yyy HH:mm")} */}
                                            {/* {new Date(conversation.lastMessage.date_envoi).toLocaleDateString()} */}
                                            {formatDistanceToNow(new Date(conversation.lastMessage.date_envoi), {
                                                addSuffix: false
                                            })}
                                        </span>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-2">
                        <p className="text-gray-500">Aucune conversation privée pour l&apos;instant.</p>
                    </div>
                )}
        </div>

        {/* MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
                    <UserList onSelect={handleUserSelected} onClose={toggleUserModal} />
            </div>
        )}
    </div>
  )
}

export default ConversationList

/*
socket.on("messageReceived", async (data) => {
                if (currentConversation?._id === data.conversation_id) {
                    await fetchPrivateConversations()
                }
            })
            socket.on("messageModified", async (data) => {
                if (currentConversation?._id === data.conversation_id) {
                    await fetchPrivateConversations()
                }
            })
            socket.on("messageDeleted", async (data) => {
                if (currentConversation?._id === data.conversation_id) {
                    await fetchPrivateConversations()
                }
            })

            socket.on("conversationUpdated", async (data) => {
                await fetchPrivateConversations();
            });
*/
