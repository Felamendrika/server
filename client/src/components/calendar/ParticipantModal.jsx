/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
//import { useEvent } from '../context/EventContext';
import userService from '../services/userService';

const ParticipantModal = ({ isOpen, onClose, onSave }) => {
  //const { getEventParticipants } = useEvent();

  const [users, setUsers] = useState([]); // Liste de tous les utilisateurs
  const [filteredUsers, setFilteredUsers] = useState([]); // Liste filtrée
  const [selectedUsers, setSelectedUsers] = useState([]); // Liste des utilisateurs sélectionnés
  const [searchTerm, setSearchTerm] = useState(''); // Terme de recherche

  // Charger tous les utilisateurs à l'ouverture du modal
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsers();
        setUsers(response);
        setFilteredUsers(response);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Gestion de la recherche
  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(
        (user) =>
          user.name.toLowerCase().includes(lowercasedTerm) ||
          user.email.toLowerCase().includes(lowercasedTerm)
      )
    );
  }, [searchTerm, users]);

  // Gestion de la sélection d'un utilisateur
  const handleSelectUser = (user) => {
    if (selectedUsers.some((selected) => selected.id === user.id)) {
      // Désélectionner si déjà sélectionné
      setSelectedUsers(selectedUsers.filter((selected) => selected.id !== user.id));
    } else {
      // Ajouter à la liste des sélectionnés
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Vérifie si un utilisateur est sélectionné
  const isSelected = (userId) => selectedUsers.some((user) => user.id === userId);

  // Sauvegarder les participants sélectionnés
  const handleSave = () => {
    onSave(selectedUsers);
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px] max-h-[500px] flex flex-col shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Ajout de Participant(s)</h2>
          <button onClick={onClose} className="text-gray-500">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-2 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Recherche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Liste des utilisateurs */}
        <div className="overflow-y-auto max-h-[300px]">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-4 py-2 border-b"
            >
              <div className="flex items-center gap-3">
                {/* Avatar du participant */}
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected(user.id)}
                onChange={() => handleSelectUser(user)}
                className="w-5 h-5 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
              />
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default ParticipantModal;

