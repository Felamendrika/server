// Composant réutilisable pour l'affichage d'une liste de participants avec scroll
/* eslint-disable react/prop-types */

const PartcipantList = ({
  participants = [],
  currentUserId,
  maxHeight = 160,
  onRemove,
}) => {
  return (
    <div
      className="space-y-2 overflow-y-auto custom-scrollbar border rounded p-2"
      style={{ maxHeight }}
    >
      {participants.length === 0 ? (
        <div className="text-sm text-gray-500">Aucun participant</div>
      ) : (
        participants.map((p) => {
          const u = p.user || p.user_id || p || {};
          const userIdStr = typeof u === "string" ? u : u?._id;
          return (
            <div
              key={p._id || userIdStr}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center gap-2">
                {u?.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u?.pseudo}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-700">
                    {(u?.pseudo || u?.nom || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm">
                  {u?.pseudo || `${u?.nom || ""} ${u?.prenom || ""}`.trim()}
                </span>
              </div>
              {onRemove && userIdStr !== currentUserId && (
                <button
                  type="button"
                  onClick={() => onRemove(userIdStr)}
                  className="text-red-500 hover:text-red-700"
                >
                  Retirer
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default PartcipantList;
