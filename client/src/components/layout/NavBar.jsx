import { useState } from 'react'
import { HiOutlineBell } from 'react-icons/hi'
import { FaUserCircle} from 'react-icons/fa'

import NotificationModal from '../modal/NotificationModal'
import UserModal from '../modal/UserModal'

// import { useNotification } from '../../context/NotifContext'

const NavBar = () => {
    const [isNotificationOpen, setNotificationOpen] = useState(false)
    const [isUserModal, setUserModal] = useState(false)
    // const { unreadCount } = useNotification();

    const toggleNotification= () => {
        setNotificationOpen(!isNotificationOpen)
    }

    const toggleUserModal = () => {
        setUserModal(!isUserModal)
    }

  return (
    <div className='bg-[#FBF4D6] h-10 flex sticky items-center justify-end pr-14 border border-black shadow-md rounded-lg' >
        <div className='flex items-center space-x-8 '>
            {/* Notification */}
            <div className='relative'>
                <HiOutlineBell
                    onClick={toggleNotification}
                    className='text-2xl cursor-pointer hover:text-gray-700'
                />
                {/* {unreadCount > 0 && (
                    <span className='absolute top-0 right-0 bg-red-500 rounded-full px-1 text-xs'>
                        {unreadCount}
                    </span>
                )} */}
            </div>

            {/* User Icon */}
            <div className='relative'>
                <FaUserCircle
                    onClick={toggleUserModal}
                    className='text-2xl cursor-pointer hover:text-gray-700'
                />
            </div>
        </div>
        {/* Modal */}
        {isNotificationOpen && <NotificationModal onClose={toggleNotification} />}
        {isUserModal && <UserModal onClose={toggleUserModal} />}
    </div>
  )
}

export default NavBar
