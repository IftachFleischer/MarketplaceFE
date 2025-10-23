import { useState, useContext, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
    const { token } = useContext(AuthContext);
    const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // If already logged in, go home
    useEffect(() => {
        if (token) navigate("/");
    }, [token, navigate]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/auth/register", form);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 800);
        } catch (e) {
            setError("Registration failed");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "auto", marginTop: 50 }}>
            <h2>Register</h2>
            {success && <p>Registered! Redirecting to login…</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input name="first_name" placeholder="First name" onChange={handleChange} /><br />
                <input name="last_name" placeholder="Last name" onChange={handleChange} /><br />
                <input name="email" placeholder="Email" onChange={handleChange} /><br />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} /><br />
                <button type="submit">Register</button>
            </form>
        </div>
    );
}
