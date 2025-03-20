
/* eslint-disable react-refresh/only-export-components */

/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if(token) {
      const newSocket = io("http://localhost:5000", {
        auth: { token },
        // auth: { token: localStorage.getItem("token") },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      newSocket.on("connect", () => {
        console.log("Connecter au Socket avec succes");
        // setIsConnected(true);
        newSocket.emit("userConnected");
        newSocket.emit("getOnlineUsers");
      });

      newSocket.on("updateOnlineUsers", (users) => {
        console.log("Users online:", users);
        setOnlineUsers(users);
      });

      newSocket.on("userOnline", ({ userId }) => {
        console.log("User connected:", userId);
        setOnlineUsers(prev => [...new Set([...prev, userId])]);
      });

      newSocket.on("userOffline", ({ userId }) => {
          console.log("User disconnected:", userId);
          setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

      // Événements de messages
      newSocket.on("messageReceived", (data) => {
        console.log("Nouveau message recu:", data);
      });

      newSocket.on("messageModified", (data) => {
        console.log("Message updated:", data);
      });

      newSocket.on("messageDeleted", (data) => {
        console.log("Message deleted:", data);
      });

      newSocket.on("conversationUpdated", (data) => {
        console.log("Conversation mise à jour:", data);
      });

      // Événements pour les conversations privées
      newSocket.on("conversationCreated", (data) => {
        console.log("Nouvelle conversation privée créée:", data);
      })

      newSocket.on("conversationRemoved", (data) => {
          console.log("Conversation privée supprimée:", data);
      });

      // GESTION DE GROUPE
      newSocket.on("newGroup", (data) => {
        if (data || data.group) {
          console.log("nouveau groupe recu : ", data.group)
        }
      })

      newSocket.on("updatedGroup", (data) => {
        console.log("Groupe mis à jour:", data.group);
      })

      newSocket.on("removeGroup", (data) => {
        console.log("Groupe supprimé:", data.groupId);
      })

      // Événements pour les conversations de groupe
      /*newSocket.on("groupConversationCreated", (data) => {
          console.log("Nouvelle conversation de groupe créée:", data);
      })*/

      newSocket.on("groupConversationRemoved", (data) => {
          console.log("Conversation de groupe supprimée:", data);
      });

      newSocket.on("newFile", (data) => {
        console.log("Nouveau fichier ajouté:", data)
      })

      newSocket.on("fileRemoved", (data) => {
        console.log("Fichier supprimé:", data)
      })

      newSocket.on("refreshConversationFiles", (data) => {
        console.log("Mise à jour des fichiers de la conversation:", data);
      })

      // Ajout des événements du calendrier
    newSocket.on("newEvent", (data) => {
        if (data && data.event) {
            console.log("Nouvel événement reçu:", data.event);
        }
    });

    newSocket.on("eventModified", (data) => {
        if (data && data.event) {
            console.log("Événement modifié reçu:", data.event);
        }
    });

    newSocket.on("eventRemoved", (data) => {
        if (data && data.eventId) {
            console.log("Événement supprimé reçu:", data.eventId);
        }
    });

      // newSocket.on("newMessageNotification", (data) => {
      //   setNotifications(prev => [data, ...prev]);
      //   setUnreadMessages(prev => new Set(prev).add(data.conversationId))
      //   setHasNewMessages(true);
      // })
      
      newSocket.on("disconnected", () => {
        console.log("Déconnecté du Socket")
        // setIsConnected(false);
      });

    setSocket(newSocket)
      return () => {
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("updateOnlineUsers");
        newSocket.off("userOnline");
        newSocket.off("userOffline");
        // newSocket.off("newMessageNotification");
        newSocket.off("conversationUpdated");
        newSocket.off("conversationCreated");
        newSocket.off("conversationRemoved");
        // newSocket.off("groupConversationCreated");
        newSocket.off("groupConversationRemoved");
        newSocket.off("messageReceived");
        newSocket.off("messageModified");
        newSocket.off("messageDeleted");
        newSocket.off("newGroup")
        newSocket.off("updatedGroup");
        newSocket.off("removeGroup");
        newSocket.off("newFile");
        newSocket.off("fileRemoved");
        newSocket.off("refreshConversationFiles");
        newSocket.off("eventCreated");
        newSocket.off("eventModified");
        newSocket.off("eventRemoved");
        newSocket.disconnect();
      };
    }
  }, []);

  // const isUserOnline = (userId) => {
  //   return onlineUsers.includes(userId);
  // };

  // Fonctions utilitaires pour l'émission d'événements
  const emitEvent = useCallback((eventName, data) => {
    if (socket) {
      socket.emit(eventName, data);
    } else {
      console.warn("Socket non connecté. Impossible d'émettre:", eventName);
    }
  }, [socket]);

  // const clearNotifications = () => {
  //   setNotifications([]);
  //   setHasNewMessages(false);
  // };

  // const markConversationAsRead = (conversationId) => {
  //   setUnreadMessages(prev => {
  //     const newSet = new Set(prev);
  //     newSet.delete(conversationId);
  //     if (newSet.size === 0) {
  //       setHasNewMessages(false);
  //     }
  //     return newSet;
  //   });
  // };

  const contextValue = {
    socket,
    onlineUsers,
    // hasNewMessages,
    // unreadMessages,
    // notifications,
    isUserOnline: useCallback((userId) => onlineUsers.includes(userId), [onlineUsers]),
    // clearNotifications,
    // markConversationAsRead,
    // isOnlineUser: (userId) => onlineUsers.includes(userId),
    joinConversation: (conversationId) => {
      emitEvent("joinConversation", conversationId)
    },
    leaveConversation: (conversationId) => {
      emitEvent("leaveConversation", conversationId);
    },
    emitNewPrivateConversation: (data) => {
      emitEvent("newPrivateConversation", data);
    },
    emitConversationDeleted: (data) => {
      emitEvent("conversationDeleted", data);
    },
    /*emitNewGroupConversation: (data) => {
      emitEvent("newGroupConversation", data);
    },*/
    emitGroupCreated: (data) => {
      emitEvent("groupCreated", data)
    }, 
    emitGroupModified: (data) => {
      emitEvent("groupModified", data)
    },
    emitGroupDeleted: (data) => {
      emitEvent("groupDeleted", data)
    },
    emitGroupConversationDeleted: (data) => {
      emitEvent("groupConversationDeleted", data);
    },
    sendMessage: (conversationId, message, receiverId) => {
      emitEvent("newMessage", { conversationId, message, receiverId });
    },
    updateMessage: (conversationId, message) => {
      emitEvent("messageUpdated", { conversationId, message });
    },
    deleteMessage: (conversationId, messageId) => {
      emitEvent("messageDeleted", { conversationId, messageId });
    },
    emitFileUploaded: (data) => {
      emitEvent("fileUploaded", data);
    },
    emitFileDeleted: (data) => {
      emitEvent("fileDeleted", data);
    },
    emitConversationFilesUpdated: (conversationId) => {
      emitEvent("conversationFilesUpdated", conversationId);
    },
    emitEventCreated: (data) => {
      emitEvent("eventCreated", data);
    },
    emitEventUpdated: (data) => {
      emitEvent("eventUpdated", data);
    },
    emitEventDeleted: (data) => {
      emitEvent("eventDeleted", data);
    }
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) {
        throw new Error ('useSocket doit etre utiliser dans un SocketProvider')
    }
    return context
}

export default SocketProvider;