import GroupConversation from "../components/groups/GroupConversation"
import GroupDetail from "../components/groups/GroupDetail"
import GroupList from "../components/groups/GroupList"


const Groups = () => {


  return (
    <div className="h-full flex w-full p-1">
        <GroupList/>
        <GroupConversation/>
        <GroupDetail/>
    </div>
  )
}

export default Groups
