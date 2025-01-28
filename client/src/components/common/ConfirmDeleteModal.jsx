/* eslint-disable react/prop-types */
import {IoIosCloseCircleOutline} from "react-icons/io"
import {CiWarning} from "react-icons/ci"

import Modal from "../modal/Modal"

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, message}) => {
    // ne pas afficher le modal si isOpen est false
    if (!isOpen) return null 

  return (
    <Modal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
            <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow-lg relative">
                {/* Bouton pour fermer le modal */}
                <button onClick={onClose} className="absolute top-4 right-4 ">
                    <IoIosCloseCircleOutline size={24} className="text-gray-500 hover:text-gray-600"/>
                </button>

                <div className="flex items-center mb-3 mt-4">
                    {/* Icone de warning */}
                    <div className=" bg-yellow-300 p-2 rounded-full mr-3">
                        <CiWarning size={40}  />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 ">Confirmation de suppression</h2>
                </div>

                {/* Message dynamique */}
                <p className="text-gray-600 mb-4">{message}</p>

                <div className="flex justify-end gap-5">
                    {/* Bouton annuler */}
                    <button
                    onClick={onClose}
                    className="px-4 py-2 border-2 text-blue-500 rounded-md hover:bg-gray-200 active:bg-gray-300 w-28"
                    >
                    Annuler
                    </button>
                    {/* Bouton Confirmer */}
                    <button
                        onClick={() => {
                        onConfirm(); // Exécute l'action de suppression
                        onClose(); // Ferme le modal après la confirmation
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 w-28"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    </Modal>
  )
}

export default ConfirmDeleteModal
