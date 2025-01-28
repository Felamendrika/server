/* eslint-disable react/prop-types */
import { useState } from "react";
import { addParticipant, removeParticipant } from "../../services/participantService";

const ParticipantModal = ({ eventId, participants, onClose }) => {
  const [newParticipant, setNewParticipant] = useState("");

  const handleAddParticipant = async () => {
    await addParticipant(eventId, { email: newParticipant });
    setNewParticipant("");
  };

  const handleRemoveParticipant = async (participantId) => {
    await removeParticipant(eventId, participantId);
  };

  return (
    <div>
      <h2>Participants</h2>
      <ul>
        {participants.map((participant) => (
          <li key={participant._id}>
            {participant.email}
            <button onClick={() => handleRemoveParticipant(participant._id)}>
              Retirer
            </button>
          </li>
        ))}
      </ul>
      <input
        type="email"
        value={newParticipant}
        onChange={(e) => setNewParticipant(e.target.value)}
        placeholder="Email du participant"
      />
      <button onClick={handleAddParticipant}>Ajouter</button>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
};

export default ParticipantModal;
