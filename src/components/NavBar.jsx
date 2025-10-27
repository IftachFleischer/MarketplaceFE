import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

// ---- helpers ----
function idFromAnything(x) {
    if (!x) return null;
    if (typeof x === "string") return x;
    if (x.$oid) return String(x.$oid);
    if (x._id) return idFromAnything(x._id);
    if (x.id) return idFromAnything(x.id);
    if (x.$id) return idFromAnything(x.$id);
    return null;
}

export default function NavBar() {
    const { token, user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!token) {
            setUnread(0);
            return;
        }

        let stopped = false;
        let timer;

        const fetchUnread = async () => {
            try {
                const { data } = await api.get("/messages");
                const myId = idFromAnything(user?.id) || idFromAnything(user?._id);
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data.items)
                        ? data.items
                        : [];

                let count = 0;
                for (const msg of list) {
                    const receiverId =
                        idFromAnything(msg.receiver) ||
                        idFromAnything(msg?.receiver?.$id) ||
                        idFromAnything(msg?.receiver?.id);
                    const unread =
                        msg.is_read === false ||
                        msg.isRead === false ||
                        msg.read === false;
                    if (receiverId && myId && receiverId === myId && unread) count++;
                }

                if (!stopped) setUnread(count);
            } catch (err) {
                console.error("Unread check failed:", err);
            } finally {
                if (!stopped) timer = setTimeout(fetchUnread, 20000);
            }
        };

        fetchUnread();
        return () => {
            stopped = true;
            clearTimeout(timer);
        };
    }, [token, user]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const showLogin = !token && pathname !== "/login";
    const showSignup = !token && pathname !== "/register";

    return (
        <header className="navbar">
            <div className="container navbar-inner">
                {/* ---- Left section: Logo ---- */}
                <div className="nav-left">
                    <Link to="/" className="brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                            src="/logo_black.png"
                            alt="Marketplace Logo"
                            className="navbar-logo"
                            style={{ height: "48px", width: "auto" }}
                        />
                    </Link>
                </div>

                {/* ---- Center section: Nav Links ---- */}
                <nav className="nav-links">
                    <Link to="/" className={pathname === "/" ? "active" : ""}>
                        Home
                    </Link>

                    {token && (
                        <Link
                            to="/messages"
                            className={`${pathname.startsWith("/messages") ? "active " : ""}${unread > 0 ? "nav-badge-dot" : ""
                                }`}
                            title={unread > 0 ? `${unread} unread` : "Messages"}
                        >
                            Messages
                        </Link>
                    )}

                    {token && (
                        <Link
                            to="/seller"
                            className={pathname === "/seller" ? "active" : ""}
                        >
                            My Products
                        </Link>
                    )}
                </nav>

                {/* ---- Right section: Auth ---- */}
                <div className="nav-right">
                    {!token ? (
                        <>
                            {showLogin && <Link to="/login" className="btn btn-ghost">Sign In</Link>}
                            {showSignup && <Link to="/register" className="btn btn-ghost">Sign Up</Link>}
                        </>
                    ) : (
                        <>
                            <span className="user-chip">
                                {user?.first_name ? `Hi, ${user.first_name}` : "Account"}
                            </span>
                            <button onClick={handleLogout} className="btn btn-primary">Sign Out</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
