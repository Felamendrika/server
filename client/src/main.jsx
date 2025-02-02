import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css"
import { AuthProvider } from './context/AuthContext.jsx'
import { MessageProvider } from './context/MessageContext.jsx';
import { GroupProvider } from './context/GroupContext.jsx';
import { EventProvider } from './context/EventContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <SocketProvider>
              <MessageProvider>
                <GroupProvider>
                  <EventProvider>
                        <ToastContainer autoClose={3000} closeOnClick/>
                        <App />
                  </EventProvider>
                </GroupProvider>
              </MessageProvider>
          </SocketProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)

/*
  <AuthProvider>
        <ToastContainer />
        <App />
      </AuthProvider>
*/