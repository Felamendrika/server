
import { FiSearch} from 'react-icons/fi'
import { AiOutlineLoading3Quarters, AiOutlineUsergroupAdd } from "react-icons/ai";
import {HiOutlineUserGroup} from 'react-icons/hi'

import { useEffect, useState } from 'react';
import { useGroup } from '../../context/GroupContext';
import { useMessage } from '../../context/MessageContext';
import { useSocket } from '../../context/SocketContext';

import GroupModal from '../modal/GroupModal';
import { formatDistanceToNow } from 'date-fns';
const GroupList = () => {
    const {
        groups,
        currentGroup,
        // setCurrentGroup,
        setCurrentGroupActive,
        fetchUserGroups,
        loading
    } = useGroup()

    const {
        activeGroupConversation,
        fetchConversationMessages,
    } = useMessage()

    const { socket } = useSocket()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchUserGroups()
    }, [fetchUserGroups])

    // useEffect(() => {
    //     if (socket) {
    //         // Rejoindre les rooms de tous les groupes
    //         groups.forEach(group => {
    //             socket.emit('joinGroup', group.group_id._id)
    //         })

    //         // Écouter les mises à jour des groupes
    //         socket.on('groupModified', ({ groupId, updates }) => {
    //             if (currentGroup?._id === groupId) {
    //                 setCurrentGroup(prev => ({ ...prev, ...updates }))
    //             }
    //         })

    //         socket.on('groupRemoved', ({ groupId }) => {
    //             if (currentGroup?._id === groupId) {
    //                 setCurrentGroup(null)
    //             }
    //             fetchUserGroups()
    //         })

    //         return () => {
    //             socket.off('groupModified')
    //             socket.off('groupRemoved')
    //             groups.forEach(group => {
    //                 socket.emit('leaveGroup', group.group_id._id)
    //             })
    //         }
    //     }
    // }, [socket, groups, currentGroup, setCurrentGroup, fetchUserGroups])


    const toggleGroupModal = () => {
        setIsModalOpen(!isModalOpen)
    }

    const filteredGroups = groups.filter(group => 
        group?.group_id?.nom.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelectedGroup = async (group) => {
        try {
            setCurrentGroupActive(group.group_id)


            const conversation = await activeGroupConversation(group.group_id._id)
            if (conversation && conversation._id) {
                socket?.emit('joinConversation', conversation._id)
                fetchConversationMessages(conversation._id)
            }else {
                console.error("Aucune conversation selectionner")
            }
            
            console.log("Groupe selectionner :", group.group_id)
            console.log("Conversation dy groupe :", conversation)

        } catch (error) {
            console.error("Erreur lors de la selection du groupe:", error)
        }
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
        <div className="h-full min-w-[248px] flex flex-col bg-gray-50 border-gray-200 border-2 rounded-lg mr-2 shadow-md overflow-hidden">
            <div className="p-4 border-gray-200 "> 
                <div className="flex justify-between items-center p-2">
                    <h2 className="text-lg font-semibold">Groupes</h2>
                    <AiOutlineUsergroupAdd
                        size={40}
                        onClick={toggleGroupModal}
                        className="text-xl p-2 border-gray-300 border-2 rounded-lg  text-gray-600 cursor-pointer hover:text-gray-600 active:text-gray-700 hover:border-gray-500"
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

        <div className="flex-1 max-h-[75%] overflow-y-auto pl-1 pr-1 custom-scrollbar">
            {filteredGroups.length > 0 ? (
                <div className='p-2'>
                    {filteredGroups.map((group) => (
                        <div
                            key={group._id}
                            onClick={() => handleSelectedGroup(group)}
                            className={`flex items-center p-2 hover:bg-gray-100 hover:rounded-md cursor-pointer active:border-yellow-100 active:bg-gray-100 ${
                                currentGroup?._id === group.group_id._id
                                    ? "bg-gray-100 border-l-8 border-yellow-100 rounded-md "
                                    : "bg=gray-50"
                            }`}
                        >
                            <div className='rounded-lg border-2 w-10 h-10 justify-center'>
                                <HiOutlineUserGroup size={40} className="text-xl p-2 border-gray-300 border-2 rounded-lg text-gray-600"/>
                            </div>


                            {/* User info */}
                            <div className="ml-3 flex-1 w-24">
                                <div className="flex justify-between items-center truncate w-full">
                                    <span className="font-medium text-sm text-gray-800 truncate overflow-clip">{ group?.group_id?.nom || "Groupe " }</span>
                                </div>
                                    <p className="text-xs text-gray-600 overflow-clip truncate">{group?.dernierMessage ? group.dernierMessage.contenu : "Pas encore de message"}</p>
                                
                            </div>

                            <div className='flex flex-col items-center w-1/5'>
                                {/* Date dernier message */}
                                {group.dernierMessage && (
                                    <span className='text-xs text-gray-500 text-end'>
                                        {formatDistanceToNow(new Date(group.dernierMessage.date_envoi), {
                                            addSuffix: true
                                        })}
                                    </span>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-2">
                        <p className="text-gray-500">Aucun groupe pour l&apos;instant.</p>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
                <GroupModal isOpen={isModalOpen}  onClose={toggleGroupModal} />
            </div>
        )}
        
        </div>
    )
}

export default GroupList
