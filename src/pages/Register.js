import { useState } from "react";
import api from "../api/axios";

export default function Register() {
    const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post("/auth/register", form);
        setSuccess(true);
    };

    return (
        <div style={{ maxWidth: 400, margin: "auto", marginTop: 50 }}>
            <h2>Register</h2>
            {success && <p>Registered! You can now log in.</p>}
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