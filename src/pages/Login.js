import { useState, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const fromMessageAttempt = location.state?.fromMessageAttempt;
    const backProductId = location.state?.productId;
    const justRegistered = location.state?.registered;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await api.post("/auth/login", { email, password });
            login(res.data.access_token, res.data.user);

            if (fromMessageAttempt && backProductId) {
                navigate(`/product/${backProductId}`);
            } else {
                navigate("/");
            }
        } catch (err) {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-card card">
                <div className="auth-head">
                    <h2>{fromMessageAttempt ? "Sign in to message the seller" : "Sign in"}</h2>
                    <p className="muted">
                        {fromMessageAttempt ? "Join the conversation" : "Access your account"}
                    </p>
                </div>

                {justRegistered && (
                    <div className="auth-banner">
                        Account created successfully — please sign in.
                    </div>
                )}
                {fromMessageAttempt && (
                    <div className="auth-banner">
                        You must be logged in to message the seller.
                    </div>
                )}
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <label className="auth-label">Email</label>
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus
                        required
                    />

                    <label className="auth-label" style={{ marginTop: 10 }}>
                        Password
                    </label>
                    <div className="auth-input-wrap">
                        <input
                            className="auth-input"
                            type={showPwd ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="auth-eye"
                            onClick={() => setShowPwd((s) => !s)}
                            aria-label="Toggle password visibility"
                        >
                            {showPwd ? "🙈" : "👁️"}
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 14 }}>
                        Sign in
                    </button>
                </form>

                <div className="auth-foot">
                    <span className="muted">No account?</span>{" "}
                    <Link to="/register">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
