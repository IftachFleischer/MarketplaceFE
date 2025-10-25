import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import SellerDashboard from "./pages/SellerDashboard";
import MessagesInbox from "./pages/MessagesInbox";
import Conversation from "./pages/Conversation";
import NavBar from "./components/NavBar"; // ← use the separate component

function App() {
  return (
    <Router>
      <NavBar />

      <main className="container" style={{ padding: "16px 0 32px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller"
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <div className="container container--narrow" style={{ padding: "8px 0" }}>
                  <MessagesInbox />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages/:otherId"
            element={
              <ProtectedRoute>
                <div className="container container--narrow" style={{ padding: "8px 0" }}>
                  <Conversation />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
