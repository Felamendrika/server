
//import UserList from '../components/messages/UsersList'
import ConversationList from '../components/messages/ConversationList'
import ConversationDisplay from '../components/messages/ConversationDisplay'
import MediaList from '../components/messages/MediaList'

const Messages = () => {

  return (
    <div className="h-full flex p-1 w-full">
        <ConversationList/>
        <ConversationDisplay/>
        <MediaList/>
    </div>
  )
}

export default Messages
