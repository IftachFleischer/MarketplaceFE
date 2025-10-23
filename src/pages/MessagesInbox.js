import { useEffect, useState, useContext, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const PLACEHOLDER = "https://via.placeholder.com/56x56.png?text=IMG";

export default function MessagesInbox() {
    const { token } = useContext(AuthContext);
    const [inbox, setInbox] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [productsMap, setProductsMap] = useState({}); // { [productId]: product }
    const navigate = useNavigate();
    const timerRef = useRef(null);

    const loadInbox = async () => {
        try {
            const res = await api.get("/messages/inbox");
            const rows = res.data || [];
            setInbox(rows);

            // Collect unique product_ids that we don't have yet
            const ids = Array.from(
                new Set(
                    rows
                        .map((r) => r.product_id)
                        .filter(Boolean)
                        .filter((pid) => !(pid in productsMap))
                )
            );

            if (ids.length) {
                // Fetch details for these product ids
                const fetched = await Promise.allSettled(ids.map((id) => api.get(`/products/${id}`)));
                const mapUpdates = {};
                fetched.forEach((res, i) => {
                    const pid = ids[i];
                    if (res.status === "fulfilled") {
                        mapUpdates[pid] = res.value.data;
                    } else {
                        // cache a null to avoid re-fetching failing ones every poll
                        mapUpdates[pid] = null;
                    }
                });
                if (Object.keys(mapUpdates).length) {
                    setProductsMap((prev) => ({ ...prev, ...mapUpdates }));
                }
            }
        } catch (e) {
            console.error("Failed to load inbox:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        loadInbox();
        // poll every 15s for freshness
        timerRef.current = setInterval(loadInbox, 15000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return inbox;
        return inbox.filter((c) => {
            const user = (c.user_name || "").toLowerCase();
            const prod = (c.product_name || "").toLowerCase();
            const prev = (c.preview || "").toLowerCase();
            return user.includes(s) || prod.includes(s) || prev.includes(s);
        });
    }, [q, inbox]);

    if (!token)
        return <p style={{ textAlign: "center", marginTop: 40 }}>Please log in to view messages.</p>;
    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading…</p>;

    return (
        <div style={{ maxWidth: 760, margin: "40px auto", padding: "0 12px" }}>
            <h2>Inbox</h2>

            {/* Search */}
            <div style={{ margin: "10px 0 16px" }}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by user, product, or message…"
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                    }}
                />
            </div>

            {filtered.length === 0 ? (
                <p>No conversations{q ? " match your search." : " yet."}</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filtered.map((c, idx) => {
                        const prod = c.product_id ? productsMap[c.product_id] : null;
                        const img = prod?.images?.[0] || PLACEHOLDER;
                        const title = c.product_name || prod?.product_name || "General chat";
                        const price = typeof prod?.price_usd !== "undefined" ? `$${prod.price_usd}` : "";
                        const sold = prod?.is_sold || c.product_is_sold;

                        return (
                            <button
                                key={`${c.user_id}-${c.product_id || "no_product"}-${idx}`}
                                onClick={() =>
                                    navigate(
                                        c.product_id ? `/messages/${c.user_id}?product=${c.product_id}` : `/messages/${c.user_id}`
                                    )
                                }
                                style={{
                                    textAlign: "left",
                                    border: "1px solid #ddd",
                                    borderRadius: 10,
                                    padding: 12,
                                    background: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "56px 1fr",
                                        gap: 12,
                                        alignItems: "center",
                                    }}
                                >
                                    {/* Product thumbnail (or placeholder) */}
                                    <img
                                        src={img}
                                        alt={title}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            border: "1px solid #eee",
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.src = PLACEHOLDER;
                                        }}
                                    />

                                    {/* Right column: title + meta */}
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <strong>
                                                {c.user_name}
                                                {title ? ` · ${title}` : ""}
                                                {price ? ` · ${price}` : ""}
                                                {sold ? " · SOLD" : ""}
                                            </strong>
                                            <small style={{ opacity: 0.7 }}>{new Date(c.timestamp).toLocaleString()}</small>
                                        </div>

                                        <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                                            {c.unread_count > 0 && (
                                                <span
                                                    style={{
                                                        background: "#007bff",
                                                        color: "white",
                                                        borderRadius: 12,
                                                        fontSize: 12,
                                                        padding: "2px 8px",
                                                    }}
                                                >
                                                    {c.unread_count}
                                                </span>
                                            )}
                                            <span style={{ opacity: 0.85 }}>
                                                {c.sent_by_me ? <em>You: </em> : null}
                                                {c.preview}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
