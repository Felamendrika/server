/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { getUsers } from "../../services/userService";

const ParticipantModal = ({
  isOpen,
  onClose,
  onSave,
  currentUserId,
  existingParticipants = [],
}) => {
  const [users, setUsers] = useState([]); // Liste de tous les utilisateurs
  const [filteredUsers, setFilteredUsers] = useState([]); // Liste filtrée
  const [selectedUsers, setSelectedUsers] = useState([]); // Liste des utilisateurs sélectionnés
  const [searchTerm, setSearchTerm] = useState(""); // Terme de recherche
  const [loading, setLoading] = useState(false);

  // Charger tous les utilisateurs à l'ouverture du modal
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await getUsers();
        console.log("Réponse getUsers:", response);

        // Normaliser la source: certains endpoints renvoient { users }, d'autres { data }
        const raw = Array.isArray(response?.users)
          ? response.users
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        console.log("Utilisateurs bruts:", raw);

        // Sécuriser: ne garder que les champs nécessaires et filtrer current user + existants
        const existingIds = new Set(
          (existingParticipants || [])
            .map((p) => {
              // p peut être un id direct, ou un objet { user_id } (string ou objet)
              const u = p?.user_id;
              if (!u) return undefined;
              return typeof u === "string" ? u : u?._id;
            })
            .filter(Boolean)
        );

        const sanitized = raw
          .filter(
            (u) =>
              u && u._id && u._id !== currentUserId && !existingIds.has(u._id)
          )
          .map((u) => ({
            _id: u._id,
            nom: u.nom || "",
            prenom: u.prenom || "",
            pseudo: u.pseudo || "",
            avatar: u.avatar || null,
            email: u.email || "", // utile pour la recherche, non affiché
          }));

        console.log("Utilisateurs sanitisés:", sanitized);
        setUsers(sanitized);
        setFilteredUsers(sanitized);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des utilisateurs :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, currentUserId, existingParticipants]);

  // Gestion de la recherche
  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    setFilteredUsers(
      users.filter(
        (user) =>
          user.nom?.toLowerCase().includes(lowercasedTerm) ||
          user.prenom?.toLowerCase().includes(lowercasedTerm) ||
          user.pseudo?.toLowerCase().includes(lowercasedTerm) ||
          user.email?.toLowerCase().includes(lowercasedTerm)
      )
    );
  }, [searchTerm, users]);

  // Gestion de la sélection d'un utilisateur
  const handleSelectUser = (user) => {
    if (selectedUsers.some((selected) => selected._id === user._id)) {
      // Désélectionner si déjà sélectionné
      setSelectedUsers(
        selectedUsers.filter((selected) => selected._id !== user._id)
      );
    } else {
      // Ajouter à la liste des sélectionnés
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Vérifie si un utilisateur est sélectionné
  const isSelected = (userId) =>
    selectedUsers.some((user) => user._id === userId);

  // Sauvegarder les participants sélectionnés
  const handleSave = () => {
    onSave(selectedUsers);
    setSelectedUsers([]); // Réinitialiser la sélection
  };

  // Annuler et réinitialiser
  const handleCancel = () => {
    setSelectedUsers([]);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[600px] flex flex-col shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Ajouter des participants</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-2 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Participants sélectionnés */}
        {selectedUsers.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Participants sélectionnés ({selectedUsers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{user.pseudo || `${user.nom} ${user.prenom}`}</span>
                  <button
                    onClick={() => handleSelectUser(user)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des utilisateurs */}
        <div className="overflow-y-auto max-h-[300px] border rounded">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "Aucun utilisateur trouvé"
                : "Aucun utilisateur disponible"}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectUser(user)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar du participant */}
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.pseudo || user.nom}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-600 font-medium ${
                        user.avatar ? "hidden" : "flex"
                      }`}
                    >
                      {(user.pseudo || user.nom || user.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.pseudo || `${user.nom} ${user.prenom}`}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected(user._id)}
                  onChange={() => handleSelectUser(user)}
                  className="w-5 h-5 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
                />
              </div>
            ))
          )}
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={selectedUsers.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Ajouter ({selectedUsers.length})
          </button>
        </div>
      </div>
    </div>
  );
};

/*
// Filtrer l'utilisateur actuel et les participants existants
        const filteredUsers = response.data.filter(user => 
          user._id !== currentUserId && 
          !existingParticipants.some(participant => participant.user_id === user._id)
        );
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
*/

export default ParticipantModal;
