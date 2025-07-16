import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/layout/ErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ConnectionProvider } from "./context/ConnectionContext.jsx";
import { EventProvider } from "./context/EventContext.jsx";
import { GroupProvider } from "./context/GroupContext.jsx";
import { MessageProvider } from "./context/MessageContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ConnectionProvider>
          <SocketProvider>
            <NotificationProvider>
              <AuthProvider>
                <MessageProvider>
                  <GroupProvider>
                    <EventProvider>
                      <ToastContainer autoClose={3000} closeOnClick />
                      <App />
                    </EventProvider>
                  </GroupProvider>
                </MessageProvider>
              </AuthProvider>
            </NotificationProvider>
          </SocketProvider>
        </ConnectionProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);

/*
  <AuthProvider>
        <ToastContainer />
        <App />
      </AuthProvider>
*/
