import { createContext, useState, useEffect } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!!token);

    const fetchMe = async () => {
        try {
            const res = await api.get("/auth/me"); // token is attached by interceptor
            setUser(res.data);
        } catch {
            // token invalid/expired
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchMe();
    }, [token]);

    // Accept just the token; we'll fetch user ourselves
    const login = async (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setLoading(true);
        await fetchMe();
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const value = { token, user, login, logout, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
