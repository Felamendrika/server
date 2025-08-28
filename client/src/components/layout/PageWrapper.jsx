import { Route, Routes } from "react-router-dom";

import Calendrier from "../../pages/Calendrier";
import Groups from "../../pages/Groups";
import Messages from "../../pages/Messages";

const PageWrapper = () => {
  return (
    <div className="h-full flex">
      <Routes>
        {/* Sous-routes pour le pageWrapper */}
        <Route index element={<Messages />} />
        <Route path="messages" element={<Messages />} />
        <Route path="groups" element={<Groups />} />
        <Route path="calendrier" element={<Calendrier />} />

        {/* Redirection par defaut  */}
        <Route path="/*" element={<Messages />} />
      </Routes>
    </div>
  );
};

export default PageWrapper;
