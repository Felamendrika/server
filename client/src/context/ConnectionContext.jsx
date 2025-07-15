/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useCallback } from 'react'

const ConnectionContext = createContext()

export const ConnectionProvider = ({ children }) => {
    const [ onlineUsers, setOnlineUsers ] = useState(new Set())

    const updateOnlineUsers = useCallback((users) => {
      console.log("Mise à jour des utilisateurs en ligne:", users);
      setOnlineUsers(new Set(users))
    }, [])

  const addOnlineUser = useCallback((userId) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.add(userId);
      return newSet;
    });
  }, []);

  const removeOnlineUser  = useCallback((userId) => {
    setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
    })
  }, [])

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId)
  }, [onlineUsers])

  const contextValue = {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    updateOnlineUsers,
    addOnlineUser,
    removeOnlineUser
  }

  return (
    <ConnectionContext.Provider value={contextValue}>
        {children}
    </ConnectionContext.Provider>
  );
}

export const useConnection = () => {
    const context = useContext(ConnectionContext)
    if (!context) {
        throw new Error('useConnection doit être utilisé à l\'intérieur d\'un ConnectionContextProvider')
    }
    return context
}
