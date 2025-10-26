import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
    const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/auth/register", form);
            navigate("/login", { state: { registered: true } });
        } catch (err) {
            const msg = err?.response?.data?.detail || "Registration failed";
            setError(msg);
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-card card">
                <div className="auth-head">
                    <h2>Sign up</h2>
                    <p className="muted">Create an account to start selling or buying</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-grid">
                        <div>
                            <label className="auth-label">First name</label>
                            <input
                                name="first_name"
                                className="auth-input"
                                placeholder="Taylor"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="auth-label">Last name</label>
                            <input
                                name="last_name"
                                className="auth-input"
                                placeholder="Doe"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <label className="auth-label" style={{ marginTop: 10 }}>Email</label>
                    <input
                        name="email"
                        className="auth-input"
                        placeholder="name@example.com"
                        onChange={handleChange}
                        type="email"
                        required
                    />

                    <label className="auth-label" style={{ marginTop: 10 }}>Password</label>
                    <input
                        name="password"
                        className="auth-input"
                        placeholder="At least 6 characters"
                        onChange={handleChange}
                        type="password"
                        required
                    />

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 14 }}>
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
