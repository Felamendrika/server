
import Sidebar from '../components/layout/Sidebar'
import NavBar from '../components/layout/NavBar'
import PageWrapper from "../components/layout/PageWrapper"

const Dashboard = () => {
  return (
    <div className="flex h-screen overflow-auto custom-scrollbar bg-gray-50">
      <Sidebar/>

      {/* Main container */}
      <div className="flex  flex-col flex-1 ml-1 mr-1">
          <NavBar/>

          {/* Page Wrapper */}
          <div className="max-h-[695px] flex-1 bg-gray-50 p-2 overflow-auto custom-scrollbar rounded-2xl border border-black mt-1">
            <PageWrapper/>
          </div>
          

      </div>
    </div>
  )
}

export default Dashboard
