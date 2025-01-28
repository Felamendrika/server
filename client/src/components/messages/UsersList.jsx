/* eslint-disable react/prop-types */
import { useEffect, useState} from 'react'

import userAvatar from "../../assets/userAvatar.jpg"

import { getUsers } from "../../services/userService"
import {FiSearch } from 'react-icons/fi'
import {IoIosCloseCircleOutline} from "react-icons/io"

const UsersList = ({ onSelect, onClose }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        console.log(data.users)
        if (data?.users || Array.isArray(data.users)) {
          setUsers(data?.users || [])
          setFilteredUsers(data?.users || [])
        } else {
          console.error("Aucune liste d'utilisateur recuperer")
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs :", error);
      } finally {
        setLoading(false)
      }
    };

    fetchUsers();
  }, []);

  // gerer la recherche 
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase()
    setSearchTerm(value)
    const filtered = users.filter(
      (user) => 
        user.pseudo.toLowerCase().includes(value) || user.email.toLowerCase().includes(value)
    )
    setFilteredUsers(filtered)
  }


  if (loading) {
    return <div className="text-center">Chargement des utilisateurs...</div>;
  }


  return (
    <div className='max-h-[460px] min-w-[300px] flex flex-col bg-gray-50 border-black rounded-lg p-3 shadow-md overflow-hidden'>
      <div className='relative p-2'>
            <IoIosCloseCircleOutline 
              onClick={onClose}
              size={24}
              className='absolute top-4 right-4 text-gray-500 cursor-pointer hover:text-gray-700'
            />
      </div>
      <div className="p-4  border-gray-200">
          <h3 className="text-lg font-semibold">Créer une conversation</h3>
        <div className="mt-2 relative">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Recherche..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-3 py-2 border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-transparent"
          />
        </div>
      </div>

      {/* User List */}
      {filteredUsers.length > 0 ? (
      <div className="flex-1 overflow-y-auto pl-1 pr-1 mb-3 custom-scrollbar">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => onSelect(user)}
            className="flex items-center p-2 hover:bg-gray-100 hover:rounded-md cursor-pointer"
          >
            {/* Avatar */}
            <img src={user?.avatar || userAvatar} alt="" className="w-10 h-10 justify-center rounded-full object-cover" />

            {/* User Info */}
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-gray-600">{user.pseudo}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

          </div>
        ))}
      </div>
      ) : (
        <p className="text-center text-gray-500">Aucun utilisateur trouvé pour l&apos;instant</p>
      )}
    </div>
  )
}

export default UsersList