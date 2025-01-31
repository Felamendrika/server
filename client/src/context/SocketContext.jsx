
/* eslint-disable react-refresh/only-export-components */

/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false); // nouveau state pour suivre la connexion

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on("connect", () => {
      console.log("Connecter au Socket avec succes");
      setIsConnected(true);
      newSocket.emit("userConnected");
      newSocket.emit("getOnlineUsers");
    });

    newSocket.on("disconnected", () => {
      console.log("Déconnecté du Socket")
      setIsConnected(false);
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

    // Événements pour les conversations privées
    newSocket.on("conversationCreated", (data) => {
      console.log("Nouvelle conversation privée créée:", data);
    })

    newSocket.on("conversationRemoved", (data) => {
        console.log("Conversation privée supprimée:", data);
    });

    // Événements pour les conversations de groupe
    newSocket.on("groupConversationCreated", (data) => {
        console.log("Nouvelle conversation de groupe créée:", data);
    });

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
    newSocket.on("eventCreated", (data) => {
      console.log("Nouvel événement créé:", data);
    });

    newSocket.on("eventModified", (data) => {
      console.log("Événement mis à jour:", data);
    });

    newSocket.on("eventRemoved", (data) => {
      console.log("Événement supprimé:", data);
    });

  setSocket(newSocket)
    return () => {
      newSocket.off("conversationCreated");
      newSocket.off("conversationRemoved");
      newSocket.off("groupConversationCreated");
      newSocket.off("groupConversationRemoved");
      newSocket.off("messageReceived");
      newSocket.off("messageModified");
      newSocket.off("messageDeleted");
      newSocket.off("newFile");
      newSocket.off("fileRemoved");
      newSocket.off("refreshConversationFiles");
      newSocket.off("eventCreated");
      newSocket.off("eventModified");
      newSocket.off("eventRemoved");
      newSocket.disconnect();
    };
  }, []);

  // const isUserOnline = (userId) => {
  //   return onlineUsers.includes(userId);
  // };

  // Fonctions utilitaires pour l'émission d'événements
  const emitEvent = useCallback((eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
    } else {
      console.warn("Socket non connecté. Impossible d'émettre:", eventName);
    }
  }, [socket, isConnected]);

  const contextValue = {
    socket,
    onlineUsers,
    isConnected,
    isUserOnline: useCallback((userId) => onlineUsers.includes(userId), [onlineUsers]),
    // isOnlineUser: (userId) => onlineUsers.includes(userId),
    joinConversation: (conversationId) => {
      emitEvent("joinConversation", conversationId)
    },
    emitNewPrivateConversation: (data) => {
      emitEvent("newPrivateConversation", data);
    },
    emitConversationDeleted: (data) => {
      emitEvent("conversationDeleted", data);
    },
    emitNewGroupConversation: (data) => {
      emitEvent("newGroupConversation", data);
    },
    emitGroupConversationDeleted: (data) => {
      emitEvent("groupConversationDeleted", data);
    },
    sendMessage: (conversationId, message) => {
      emitEvent("newMessage", { conversationId, message });
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