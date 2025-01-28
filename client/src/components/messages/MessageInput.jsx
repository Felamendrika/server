/* eslint-disable react/prop-types */
import {useState} from 'react'
import Picker from 'emoji-picker-react'
import {FiPaperclip, FiSmile, FiSend} from 'react-icons/fi'

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState("")
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    // gestion etat emoji
    const handleEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji)
    }

    //gerer l'envoi du message
    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message) //appel la fonction passee en prop
            setMessage("")
        }
    }

  return (
    <div className='relative bg-white p-4 flex items-center gap-4 border-t'>
        
        {/* Icone pour ajouter un fichier */}
        <button
            type="button"
            title="Ajouter un fichier"
            className='text-gray-500 hover:text-gray-700'
        >
            <FiPaperclip size={20} />
            <input type="file" className='hidden'/>
        </button>

        {/* Champ de saisie */}
        <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ecrire un message ..."
            className='flex-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:outline-none'
        />


        {/* Emoji  */}
        <button
            type="button"
            title="ajouter un emoji"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className='text-gray-500 hover:text-gray-700 relative'
        >
            <FiSmile size={20} />
            { showEmojiPicker && (
                <div className='absolute bottom-10 right-0 bg-white border rounded-lg shadow-lg z-10'>
                    <Picker onEmojiClick={handleEmojiClick} />
                </div>
            )}
        </button>

        {/* Envoye le message */}
        <button
            type="button"
            onClick={handleSend}
            title='Envoyer'
            className='bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600'
        >
            <FiSend size={20} />
        </button>
    </div>
  )
}

export default MessageInput
