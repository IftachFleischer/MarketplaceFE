import { useEffect, useState, useContext, useRef } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function UnreadMessagesBadge() {
    const { token } = useContext(AuthContext);
    const [count, setCount] = useState(0);
    const timerRef = useRef(null);

    const fetchCount = async () => {
        if (!token) {
            setCount(0);
            return;
        }
        try {
            const res = await api.get("/messages/unread/count");
            setCount(Number(res.data.unread_count || 0));
        } catch (e) {
            // keep silent to avoid nav noise
        }
    };

    useEffect(() => {
        fetchCount();
        // poll every 15 seconds
        timerRef.current = setInterval(fetchCount, 15000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); // re-setup when auth changes

    if (!token || count <= 0) return null;
    return <span> ({count})</span>;
}
