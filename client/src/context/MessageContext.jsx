
/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import messageService from '../services/messageService'
import { getMessages, getUserPrivateConversation, getUserGroupConversation, createConversation as createConversationService, deleteConversation as deleteConversationService } from '../services/conversationService'
import { getFilesByConversation, uploadFile as uploadFileService , deleteFile as deleteFileService , previewFile as previewFileService, downloadFile as downloadFileService } from '../services/fileService'
import { toast } from 'react-toastify'

import { useSocket } from './SocketContext'

const MessageContext = createContext()


// fournir le contexte
export const MessageProvider = ({ children }) => {
    const {socket} = useSocket()

    const [conversations, setConversations] = useState([])
    const [messages, setMessages] = useState([])
    const [currentConversation, setCurrentConversation] = useState(null)
    
    const [fichiers, setFichiers] = useState([])
    const [loading, setLoading] = useState(false)

    // fonction pour nettoyer les conversations
    const clearConversationState = useCallback(() => {
        setCurrentConversation(null)
        setMessages([])
        setFichiers([])
    }, [])

        // GESTION CONVERSATIONS
        const fetchPrivateConversations = useCallback( async () => {
            setLoading(true)
            try {
                const { conversation } = await getUserPrivateConversation()
                setConversations(conversation || [])
                // console.log("Conversation filtrer ", conversation)
            } catch (error) {
                console.error("Erreur lors du chargement des conversations privee de l'utilisateur connecter: ", error)
            } finally {
                setLoading(false)
            }
        }, [])

    // ECOUTEUR D"EVEMENTS SOCKET
    useEffect(() => {
        if (socket) {
            socket.on("conversationCreated", (data) => {
                setConversations(prev => [...prev, data.conversation])
            })

            socket.on("conversationRemoved", ({ conversationId }) => {
                setConversations(prev => prev.filter(conv => conv._id !== conversationId));
                if (currentConversation?._id === conversationId) {
                    clearConversationState();
                }
            });

            // Conversations de groupe
            socket.on("groupConversationCreated", (data) => {
                setConversations(prev => [...prev, data.conversation]);
            });

            socket.on("groupConversationRemoved", ({ conversationId }) => {
                setConversations(prev => prev.filter(conv => conv._id !== conversationId));
                if (currentConversation?._id === conversationId) {
                    clearConversationState();
                }
            });

            // nouveau message recu
            socket.on("messageReceived", async (data) => {
                    if (currentConversation?._id === data.conversation_id) {
                        setMessages(prev => [...prev, data.message]);
                        // Mise à jour de la liste des conversations sans refresh
                        setConversations(prev => {
                        const updatedConversations = [...prev];
                        const conversationIndex = updatedConversations.findIndex(
                            conv => conv._id === data.conversation_id
                        );
                        if (conversationIndex !== -1) {
                            updatedConversations[conversationIndex].lastMessage = data.message;
                        }
                        return updatedConversations;
                        });
                    }
              });

            // Message modifié
            socket.on("messageModified", (data) => {
                if (currentConversation?._id === data.conversation_id) {
                setMessages(prev => 
                    prev.map(msg => msg._id === data.message._id ? data.message : msg)
                );
                }
            });

            socket.on("messageDeleted", (data) => {
                if (currentConversation?._id === data.conversation_id) {
                setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
                }
            });

            // Nouvelle conversation
            socket.on("newConversation", async () => {
                await fetchPrivateConversations();
            });

            // Conversation supprimer
            socket.on("conversationDeleted", ({ conversationId }) => {
                setConversations(prev => 
                    prev.filter(conv => conv._id !== conversationId)
                )
                if(currentConversation?._id === conversationId) {
                    clearConversationState()
                }
            })
        }

        return () => {
            if(socket) {
                socket.off("messageReceived")
                socket.off("messageModified")
                socket.off("messageDeleted");
                socket.off("conversationCreated");
                socket.off("conversationRemoved");
                socket.off("groupConversationCreated");
                socket.off("groupConversationRemoved");
            }
        }
    }, [socket, currentConversation, clearConversationState, fetchPrivateConversations])

    /** ------ GESTION DES GROUPES ET CONVERSATIONS ASSOCIÉES ------ **/

    const checkOrCreateGroupConversation =  async (groupId) => {
        try {
            const groupConversation = await getUserGroupConversation()
            // console.log(groupConversation)

            if (!groupConversation || !Array.isArray(groupConversation.data)) {
                console.error("Les conversations de groupe sont mal formatées :", groupConversation);
                throw new Error("Données invalides pour les conversations de groupe");
            }

            const conversations = groupConversation?.data || []
            // console.log("Conversations dans chechOuCreateConversation:", conversations);


            let conversation = conversations.find((conv) => conv.group_id._id === groupId )

            if(!conversation) {
                const response = await createConversationService({ type: "group", group_id: groupId})
                // console.log(response)
                // console.log(response.conversation)

                if(response?.conversation) {
                    conversation = response.conversation

                    socket?.emit("newGroupConversation", {
                        conversation: conversation,
                        groupId: groupId
                    });

                    //ajout de a nouvelle conversation al'etat local
                    setConversations(prev => [...prev , conversation])
                } else {
                    console.error("Aucun reponse de la creation de la conversation")
                    return null
                }
            }
            // console.log(conversation)
            socket?.emit("joinConversation", conversation._id)
            return conversation
        } catch (error) {
            console.error("Erreur lors de la vérification/création de la conversation :", error.message)
            // toast.error("Impossible de grer la conversation de groupe")
            throw error
        }
    }


    /** ------ GESTION DES CONVERSATIONS ------ **/

    const createConversation = async (data) => {
        try {
            const conversation = await createConversationService(data)

            if (conversation) {
                if (data.type === "private") {
                    socket?.emit("newPrivateConversation", {
                        conversation: conversation,
                        receiverId: data.receiver_id
                    });
                } else if (data.type === "group") {
                    socket?.emit("newGroupConversation", {
                        conversation: conversation,
                        groupId: data.group_id
                    });
                }
                setConversations((prev) => [...prev, conversation])
                // console.log(conversation)
                toast.success("Nouvelle conversation créer ")
            }else {
                console.warn("Aucune conversation créée :", conversation.message)
                toast.error("Aucune conversation créée. Une erreur s'est produite")
                throw new Error(conversation?.message || "Erreur inconnue lors de la création de la conversation.")
            }
            
        } catch (error) {
            console.error("Erreur lors de la creation de la conversation", error.message)
            toast.error(error.message || "Erreur inconnue lors de la création de la conversation")
        }
    }

    const deleteConversation = async (conversationId) => {
        try {
            await deleteConversationService(conversationId)
            const conversation = conversations.find(conv => conv._id === conversationId);
            
            if (conversation?.type === "private") {
                socket?.emit("conversationDeleted", { conversationId });
            } else if (conversation?.type === "group") {
                socket?.emit("groupConversationDeleted", {
                    conversationId,
                    groupId: conversation.group_id
                });
            }
            setConversations((prev) => 
                prev.filter((conv) => conv._id !== conversationId )
            )
            if (currentConversation?._id === conversationId) {
                clearConversationState();
            }
            setMessages([])
            toast.success("Conversation supprimé avec succes")

        } catch (error) {
            console.error("Erreur lors de la suppression de le conversation: ", error)
            toast.error(error.message || "Erreur lors de la suppression de la conversation")
        }
    }

    const fetchConversationMessages = useCallback(async (conversationId) => {
        setLoading(true) 
        try {
            const response = await getMessages(conversationId)
            setMessages(response.data || [])
        } catch (error) {
            console.error("Erreur lors de chargement des messages dans fetchConversationMessages:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // gerer la conversation de groupe active
    const activeGroupConversation = async (groupId) => {
        setLoading(true)
        try {
            const conversation = await checkOrCreateGroupConversation(groupId)
            // console.log("Conversation dans activeGroupConversation:", conversation)

            setCurrentConversation(conversation)
            //await fetchConversationMessages(conversation._id)
            //await fetchFilesByConversations(conversation._id)
            return conversation
        } catch(error) {
            console.error("Erreur lors de l'activation de l conversation :", error.message)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // GESTION DES MESSAGES 
    const createMessage = async ( conversationId, contenu, fichier ) => {
        try {
            const newMessage = await messageService.createMessage(
                conversationId,
                contenu,
                fichier
            )
            // Mise à jour immédiate des messages
            setMessages(prev => [...prev, newMessage]);

            // setConversations(prev => {
            //     const updatedConversations = [...prev]
            //     const conversationIndex = updatedConversations.findIndex(
            //         conv => conv._id === conversationId 
            //     )
            //     if(conversationIndex !== -1) {
            //         updatedConversations[conversationIndex].lastMessage = newMessage;
            //     }
            //     return updatedConversations
            // })
            
            // socket?.emit("newMessage", {
            //     message: newMessage,
            //     conversationId
            // })
            // console.log("Nouveau message :", newMessage)
            // setMessages((prev) => [...prev, newMessage])
            return newMessage
        }catch (err) {
            console.error("Erreur envoi du message:", err);
            toast.error(err.message || "Erreur lors de l'envoi du message")
        }
    };

    const updateMessage = async (messageId, contenu) => {
        try {
            const updateMessage = await messageService.updateMessage(
                messageId,
                contenu
            )

            setMessages((prev) => 
                prev.map((msg => 
                    msg._id === messageId ? { ...msg, contenu } : msg
                ))
            )
                // Mettre à jour la conversation si nécessaire
            setConversations(prev => {
                const updatedConversations = [...prev];
                const conversationIndex = updatedConversations.findIndex(
                conv => conv._id === updateMessage.conversation_id
                );
                if (conversationIndex !== -1) {
                updatedConversations[conversationIndex].lastMessage = updateMessage;
                }
                return updatedConversations;
            });
        
            // Émettre l'événement pour le socket
            socket?.emit("messageUpdated", {
                conversationId: updateMessage.conversation_id,
                message: updateMessage
            });

            console.log("message mi a jour :", updateMessage)
        } catch (err) {
            console.error("Erreur dans updateMessage pour la mise a jour:", err);
            toast.error( err.message || "Erreur lors de la mise a jour du message")
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            const updatedMessage = await messageService.deleteMessage(messageId)
            setMessages((prev) => 
                prev.map((msg) => 
                    msg._id === messageId
                        ? { ...msg, ...updatedMessage }
                        : msg
                )
            )
            // Mettre à jour la conversation si nécessaire
            setConversations(prev => {
                const updatedConversations = [...prev];
                const conversationIndex = updatedConversations.findIndex(
                conv => conv._id === currentConversation._id
                );
                if (conversationIndex !== -1) {
                updatedConversations[conversationIndex].lastMessage = null; // ou mettre à jour avec le dernier message valide
                }
                return updatedConversations;
            });
            socket?.emit("messageDeleted", {
                conversationId: currentConversation._id,
                messageId
            });

            toast.success("Message supprimé avec succès.")

            // await fetchConversationMessages(currentConversation._id)
        } catch (error) {
            console.error("Erreur lors de la suppression du message dans deleteMessage:", error)
            toast.error(error.message || "Erreur lors de la suppression du message")
        }
    }


    /** ------ GESTION DES FICHIERS ------ **/

    const uploadFile = async (formData, messageId) => {
        try {
            const uploadedFile = await uploadFileService(formData)
            if (messageId) {
                setFichiers((prev) => [...prev, uploadedFile]);
            }
            console.log(uploadFile.fichier)
            return uploadFile
        } catch (err) {
            console.error("Erreur dans uploadFile:", err);
        }
    };

    const fetchFilesByConversations = useCallback(async (conversationId) => {
        setLoading(true)
        try {
            const response = await getFilesByConversation(conversationId)

            // console.log(response)
            // console.log(response.fichiers)
            if (response && response.fichiers) {
                setFichiers(response.fichiers)
            } else {
                console.error("Aucune liste de fichiers récupérée")
                setFichiers([])
            }
            /*
            const { files } = await getFilesConversation(conversationId)
            setFiles(files || [])
            */
        } catch (err) {
            console.error("Erreur dans fetchFilesByConversation:", err);
            setFichiers([])
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteFile = async (fichierId) => {
        try {
            await deleteFileService(fichierId)
            // Supprimer le fichier de la liste des fichiers
            setFichiers((prev) => prev.filter((fichier) => fichier._id !== fichierId))

            //mettre  a jour les messages pour supprimer la reference au fichier
            setMessages((prevMessages) =>
                prevMessages.map((message) => 
                    message.fichier === fichierId ? { ...message, fichier: null } : message
                )
            )

            toast.success("Fichier supprimé avec succès !")
            await fetchFilesByConversations(currentConversation._id);
        } catch (err) {
            console.error("Erreur dans deleteFile:", err);
            toast.error("Erreur lors de la suppression du fichier !");
        }
    };

    const previewFile = async (fichierId) => {
        try {
            const file = await previewFileService(fichierId)
            return file
        } catch (error) {
            console.error("Erreur lors de la prévisualisation d'un fichier:", error);
        }
    }

    const downloadFile = async (fichierId) => {
        try {
            const file = await downloadFileService(fichierId)
            return file
        } catch (error) {
            console.error("Erreur lors du téléchargement d'un fichier:", error);
        }
    }


    const contextValue = { 
        conversations, 
        messages, 
        fichiers, 
        currentConversation,
        setCurrentConversation, 
        clearConversationState,
        fetchPrivateConversations ,
        checkOrCreateGroupConversation,
        activeGroupConversation,
        // fetchUsersGroups,
        createConversation, 
        deleteConversation, 
        fetchConversationMessages,
        createMessage, 
        updateMessage, 
        deleteMessage, 
        uploadFile, 
        fetchFilesByConversations, 
        deleteFile, 
        previewFile,
        downloadFile,
        loading 
    }

    return (
        <MessageContext.Provider value={contextValue}>
            {children}
        </MessageContext.Provider>
    )
}

export const useMessage = () => {
    const context = useContext(MessageContext)
    if (!context) {
        throw new Error ('useMessage doit etre utiliser dans un MessageProvider')
    }
    return context
}
