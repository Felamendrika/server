import { Routes, Route } from "react-router-dom"

import Messages from "../../pages/Messages"
import Groups from "../../pages/Groups"
import Calendrier from "../../pages/Calendrier"

const PageWrapper = () => {
  return (
    <div className="h-full flex">

    <Routes>
      {/* Sous-routes pour le pageWrapper */}
        <Route path="messages" element={<Messages/>} />
        <Route path="groups" element={<Groups/>} />
        <Route path="calendrier" element={<Calendrier/>} />

                {/* Redirection par defaut  */}
        <Route path="/*" element={<Messages />} />
    </Routes>
    </div>
  )
}

export default PageWrapper
