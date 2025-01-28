/* eslint-disable react/prop-types */
import {IoIosCloseCircleOutline} from "react-icons/io"
import {AiOutlineCheck} from "react-icons/ai"
import Modal from "../modal/Modal"

const ConfirmActionModal = ({ isOpen, onClose, onConfirm, message}) => {
    // ne pas afficher le modal si isOpen est false
    if (!isOpen) return null 

  return (
    <Modal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
            <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 ">
                    <IoIosCloseCircleOutline size={24} className="text-gray-500 hover:text-gray-600"/>
                </button>

            
                        <div className="flex items-center mb-3 mt-4">
                            {/* Icone de warning */}
                            <div className=" bg-green-400 text-white p-2 rounded-full mr-3">
                                <AiOutlineCheck size={30}  />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmation</h2>
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
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-28"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
        </div>
    </Modal>
  )
}

export default ConfirmActionModal
