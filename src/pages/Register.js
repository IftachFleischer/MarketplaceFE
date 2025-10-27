import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        city: "",
        password: "",
        confirm: "",
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");

    const setField = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((e) => ({ ...e, [name]: undefined }));
        if (name === "password" || name === "confirm") {
            // re-validate password + confirm on the fly
            validate({ ...form, [name]: value }, /*silent*/ true);
        }
    };

    const validate = (values = form, silent = false) => {
        const e = {};

        if (!values.first_name.trim()) e.first_name = "First name is required";
        if (!values.last_name.trim()) e.last_name = "Last name is required";

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
        if (!emailOk) e.email = "Enter a valid email";

        if (values.password.length < 6) {
            e.password = "Password must be at least 6 characters";
        }
        if (values.confirm !== values.password) {
            e.confirm = "Passwords do not match";
        }

        // Phone is optional; add a light pattern check if provided
        if (values.phone_number && !/^[\d+\-\s()]{6,}$/.test(values.phone_number)) {
            e.phone_number = "Enter a valid phone number";
        }

        // City optional; you can make it required if you prefer:
        // if (!values.city.trim()) e.city = "City is required";

        if (!silent) setErrors(e);
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        const eobj = validate();
        if (Object.keys(eobj).length) return;

        setSubmitting(true);
        try {
            await api.post("/auth/register", {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim(),
                password: form.password,
                phone_number: form.phone_number.trim() || null,
                city: form.city.trim() || null,
            });
            navigate("/login");
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                "Registration failed. Please try again.";
            setServerError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const FieldError = ({ name }) =>
        errors[name] ? (
            <div className="auth-error" style={{ marginTop: 6 }}>{errors[name]}</div>
        ) : null;

    return (
        <div className="auth-shell">
            <div className="auth-card card">
                <div className="auth-head">
                    <h2>Create account</h2>
                    <p className="muted">Join to buy & sell with confidence</p>
                </div>

                {serverError && <div className="auth-error">{serverError}</div>}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {/* Name grid */}
                    <div className="auth-grid">
                        <div>
                            <label className="auth-label">First name</label>
                            <input
                                className="auth-input"
                                value={form.first_name}
                                onChange={(e) => setField("first_name", e.target.value)}
                                autoComplete="given-name"
                            />
                            <FieldError name="first_name" />
                        </div>

                        <div>
                            <label className="auth-label">Last name</label>
                            <input
                                className="auth-input"
                                value={form.last_name}
                                onChange={(e) => setField("last_name", e.target.value)}
                                autoComplete="family-name"
                            />
                            <FieldError name="last_name" />
                        </div>
                    </div>

                    <label className="auth-label">Email</label>
                    <input
                        className="auth-input"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        autoComplete="email"
                        inputMode="email"
                    />
                    <FieldError name="email" />

                    <label className="auth-label">Phone (optional)</label>
                    <input
                        className="auth-input"
                        value={form.phone_number}
                        onChange={(e) => setField("phone_number", e.target.value)}
                        placeholder="+972 50 123 4567"
                        autoComplete="tel"
                        inputMode="tel"
                    />
                    <FieldError name="phone_number" />

                    <label className="auth-label">City (public)</label>
                    <input
                        className="auth-input"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder="Tel Aviv"
                        autoComplete="address-level2"
                    />
                    <FieldError name="city" />

                    <label className="auth-label">Password</label>
                    <input
                        className="auth-input"
                        type="password"
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                    />
                    <FieldError name="password" />

                    <label className="auth-label">Confirm password</label>
                    <input
                        className="auth-input"
                        type="password"
                        value={form.confirm}
                        onChange={(e) => setField("confirm", e.target.value)}
                        autoComplete="new-password"
                    />
                    <FieldError name="confirm" />

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: 6 }}
                        disabled={submitting}
                    >
                        {submitting ? "Creating…" : "Create account"}
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
