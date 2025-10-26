// src/components/NavBar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo_gradient.png"; // <-- adjust path if needed

export default function NavBar() {
    const { token, user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // control which links show
    const showLogin = !token && pathname !== "/login";
    const showSignup = !token && pathname !== "/register";
    const showHome = pathname !== "/";

    return (
        <header className="navbar">
            <div className="navbar-inner">
                {/* Left: brand/logo */}
                <div className="nav-left">
                    <Link to="/" className="brand">
                        <img
                            src={logo}
                            alt="Market"
                            className="navbar-logo"
                        />
                    </Link>
                </div>

                {/* Center navigation links */}
                <nav className="nav-links">
                    {showHome && <Link to="/">Home</Link>}
                    {token && <Link to="/messages">Messages</Link>}
                    {token && <Link to="/seller">My Products</Link>}
                </nav>

                {/* Right side (auth actions) */}
                <div className="nav-right">
                    {!token ? (
                        <>
                            {showLogin && (
                                <Link to="/login" className="btn btn-primary">
                                    Sign In
                                </Link>
                            )}
                            {showSignup && (
                                <Link to="/register" className="btn btn-primary">
                                    Sign Up
                                </Link>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="user-chip">
                                {user?.first_name ? `Hi, ${user.first_name}` : "Account"}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="btn btn-primary"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
