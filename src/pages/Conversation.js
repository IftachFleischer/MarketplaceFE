import { useEffect, useState, useContext, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import ChatBubble from "../components/ChatBubble";

export default function Conversation() {
    const { otherId } = useParams(); // /messages/:otherId
    const { search } = useLocation();
    const productId = new URLSearchParams(search).get("product"); // ?product=
    const { token } = useContext(AuthContext);

    const [otherUser, setOtherUser] = useState(null);
    const [product, setProduct] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);

    const isSold = Boolean(product?.is_sold);

    const scrollToBottom = () =>
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);

    const loadConversation = async () => {
        try {
            const url = productId
                ? `/messages/with/${otherId}?product_id=${productId}`
                : `/messages/with/${otherId}`;
            const res = await api.get(url);
            setOtherUser(res.data.other_user);
            setProduct(res.data.product || null);
            setMessages(res.data.messages);
        } catch (e) {
            console.error("Failed to load conversation:", e);
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        loadConversation();

        // Poll every 5s for new messages
        pollRef.current = setInterval(loadConversation, 5000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, otherId, productId]);

    const handleSend = async (e) => {
        e.preventDefault();
        const content = text.trim();
        if (!content) return;

        // Optimistic append
        const tempId = `temp-${Date.now()}`;
        const optimistic = {
            id: tempId,
            content,
            sent_by_me: true,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setText("");
        scrollToBottom();

        try {
            await api.post("/messages", {
                receiver_id: otherId,
                content,
                product_id: productId || null,
            });
            // Re-sync thread to replace the temp message with server one
            await loadConversation();
        } catch (e) {
            // Rollback optimistic message on error
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            const msg = e?.response?.data?.detail || e.message || "Send failed";
            alert(`Error: ${msg}`);
        }
    };

    if (!token)
        return <p style={{ textAlign: "center", marginTop: 40 }}>Please log in to view messages.</p>;
    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading…</p>;
    if (!otherUser) return <p style={{ textAlign: "center", marginTop: 40 }}>User not found.</p>;

    return (
        <div
            className="container"
            style={{
                padding: "20px 12px",
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 80px)",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Link to="/messages">← Back</Link>
                <div>
                    <h2 style={{ margin: 0 }}>{otherUser.name}</h2>
                    {product && (
                        <small style={{ opacity: 0.7 }}>
                            Listing: {product.name} {isSold ? "· SOLD" : ""}
                        </small>
                    )}
                </div>
            </div>

            {isSold && (
                <div
                    style={{
                        marginTop: 8,
                        background: "#ffe9e9",
                        border: "1px solid #ffc0c0",
                        color: "#b00020",
                        padding: "6px 10px",
                        borderRadius: 8,
                    }}
                >
                    This item is SOLD. New messages are disabled for buyers.
                </div>
            )}

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                    marginTop: 12,
                    background: "#fafafa",
                }}
            >
                {messages.length === 0 ? (
                    <p style={{ opacity: 0.7 }}>No messages yet. Start the conversation!</p>
                ) : (
                    messages.map((m) => (
                        <ChatBubble key={m.id} sentByMe={m.sent_by_me} timestamp={m.created_at}>
                            {m.content}
                        </ChatBubble>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isSold ? "Item is sold — messaging closed" : "Type a message…"}
                    disabled={isSold}
                    style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                    }}
                />
                <button type="submit" disabled={isSold}>
                    Send
                </button>
            </form>
        </div>
    );
}
