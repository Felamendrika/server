
/* eslint-disable react-refresh/only-export-components */

/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useState } from "react";

// import { useAuth } from "./AuthContext"
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("connect", () => {
      console.log("Connecter au Socket avec succes");
      socket.emit("userConnected");
      socket.emit("getOnlineUsers");
    });

    socket.on("updateOnlineUsers", (users) => {
      console.log("Users online:", users);
      setOnlineUsers(users);
    });

    socket.on("userOnline", ({ userId }) => {
      console.log("User connected:", userId);
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    socket.on("userOffline", ({ userId }) => {
      console.log("User disconnected:", userId);
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

   // Événements de messages
   socket.on("messageReceived", (data) => {
    console.log("New message received:", data);
  });

  socket.on("messageModified", (data) => {
    console.log("Message updated:", data);
  });

  socket.on("messageDeleted", (data) => {
    console.log("Message deleted:", data);
  });

    // Événements pour les conversations privées
    socket.on("conversationCreated", (data) => {
      console.log("Nouvelle conversation privée créée:", data);
  });

  socket.on("conversationRemoved", (data) => {
      console.log("Conversation privée supprimée:", data);
  });

  // Événements pour les conversations de groupe
  socket.on("groupConversationCreated", (data) => {
      console.log("Nouvelle conversation de groupe créée:", data);
  });

  socket.on("groupConversationRemoved", (data) => {
      console.log("Conversation de groupe supprimée:", data);
  });


  setSocket(socket);
    return () => {
      socket.off("conversationCreated");
      socket.off("conversationRemoved");
      socket.off("groupConversationCreated");
      socket.off("groupConversationRemoved");
      socket.off("messageReceived");
      socket.off("messageModified");
      socket.off("messageDeleted");
      socket.disconnect();
    };
  }, []);

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const contextValue = {
    socket,
    onlineUsers,
    isUserOnline,
    // isOnlineUser: (userId) => onlineUsers.includes(userId),
    joinConversation: (conversationId) => {
      socket?.emit("joinConversation", conversationId)
    },
    emitNewPrivateConversation: (data) => {
      socket?.emit("newPrivateConversation", data);
    },
    emitConversationDeleted: (data) => {
        socket?.emit("conversationDeleted", data);
    },
    emitNewGroupConversation: (data) => {
        socket?.emit("newGroupConversation", data);
    },
    emitGroupConversationDeleted: (data) => {
        socket?.emit("groupConversationDeleted", data);
    },
    sendMessage: (conversationId, message) => {
      socket?.emit("newMessage", { conversationId, message });
    },
    updateMessage: (conversationId, message) => {
      socket?.emit("messageUpdated", { conversationId, message });
    },
    deleteMessage: (conversationId, messageId) => {
      socket?.emit("messageDeleted", { conversationId, messageId });
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