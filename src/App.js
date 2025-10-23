import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useContext } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import SellerDashboard from "./pages/SellerDashboard";
import MessagesInbox from "./pages/MessagesInbox";
import Conversation from "./pages/Conversation";
import UnreadMessagesBadge from "./components/UnreadMessagesBadge";

import { AuthContext } from "./context/AuthContext";

function NavBar() {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // this already redirects to /login in your AuthContext
  };

  return (
    <nav style={{ padding: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <Link to="/">Home</Link>

      {!token ? (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      ) : (
        <>
          <Link to="/seller">My Products</Link>
          <Link to="/messages">
            Messages
            <UnreadMessagesBadge />
          </Link>
          <Link to="/dashboard">Dashboard</Link>

          <span style={{ marginLeft: "auto", opacity: 0.8 }}>
            {user ? `Hi, ${user.first_name || user.email}` : ""}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* Public auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected pages */}
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
              <MessagesInbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:otherId"
          element={
            <ProtectedRoute>
              <Conversation />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
