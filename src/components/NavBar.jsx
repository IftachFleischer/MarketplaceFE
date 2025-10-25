import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

export default function NavBar() {
    const { token, user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [unread, setUnread] = useState(0);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const showLogin = !token && pathname !== "/login";
    const showSignup = !token && pathname !== "/register";
    const isActive = (to) => pathname === to;

    useEffect(() => {
        let t;
        if (!token) {
            setUnread(0);
            return;
        }
        const fetchUnread = async () => {
            try {
                const res = await api.get("/messages/unread/count");
                setUnread(res.data?.unread_count || 0);
            } catch { }
        };
        fetchUnread();
        t = setInterval(fetchUnread, 15000);
        return () => t && clearInterval(t);
    }, [token]);

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="brand">
                    Market
                </Link>

                <nav className="nav-links">
                    <Link className={isActive("/") ? "active" : ""} to="/">Home</Link>
                    {token && (
                        <Link className={isActive("/messages") ? "active" : ""} to="/messages">
                            Messages
                            {unread > 0 && <span className="badge">{unread}</span>}
                        </Link>
                    )}
                    {token && (
                        <Link className={isActive("/seller") ? "active" : ""} to="/seller">
                            My Products
                        </Link>
                    )}
                </nav>

                <div className="nav-actions">
                    {!token ? (
                        <>
                            {showLogin && <Link to="/login" className="btn btn-light">Login</Link>}
                            {showSignup && <Link to="/register" className="btn btn-light">Sign up</Link>}
                        </>
                    ) : (
                        <>
                            <span className="user-chip">
                                {user?.first_name ? `Hi, ${user.first_name}` : "Account"}
                            </span>
                            <button onClick={handleLogout} className="btn btn-danger">Sign out</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
