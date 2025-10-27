import { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");

    const minLen = 6;

    const validate = () => {
        if (!firstName.trim()) return "First name is required.";
        if (!lastName.trim()) return "Last name is required.";
        if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";
        if (password.length < minLen) return `Password must be at least ${minLen} characters.`;
        if (password !== confirm) return "Passwords do not match.";
        return null;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const message = validate();
        if (message) {
            setError(message);
            return;
        }

        try {
            const res = await api.post("/auth/register", {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                password,
            });

            // assuming backend returns { access_token, user }
            await login(res.data.access_token);
            const backTo = location.state?.redirectTo || "/";
            navigate(backTo);
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(detail || "Registration failed. Please try again.");
        }
    };

    const disabled = !firstName || !lastName || !email || !password || !confirm;

    return (
        <div className="auth-shell">
            <div className="auth-card card">
                <div className="auth-head">
                    <h2>Create your account</h2>
                    <p className="muted">It takes less than a minute</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit} className="auth-form" noValidate>
                    <div className="auth-grid">
                        <div>
                            <label className="auth-label">First name</label>
                            <input
                                className="auth-input"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                autoComplete="given-name"
                                required
                            />
                        </div>
                        <div>
                            <label className="auth-label">Last name</label>
                            <input
                                className="auth-input"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                autoComplete="family-name"
                                required
                            />
                        </div>
                    </div>

                    <label className="auth-label">Email</label>
                    <input
                        className="auth-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label className="auth-label">Password</label>
                    <input
                        className="auth-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={minLen}
                        placeholder={`At least ${minLen} characters`}
                    />

                    <label className="auth-label">Confirm password</label>
                    <input
                        className="auth-input"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={minLen}
                    />

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: 10 }}
                        disabled={disabled}
                    >
                        Sign up
                    </button>
                </form>

                <div className="auth-foot">
                    <span className="muted">Already have an account?</span>{" "}
                    <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
