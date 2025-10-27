import { useEffect, useState, useContext, useRef } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import ChatBubble from "../components/ChatBubble";

export default function Conversation() {
    const { otherId } = useParams();
    const { search } = useLocation();
    const navigate = useNavigate();
    const productId = new URLSearchParams(search).get("product");
    const { token } = useContext(AuthContext);

    const [otherUser, setOtherUser] = useState(null);
    const [product, setProduct] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);

    const bottomRef = useRef(null);
    const pollRef = useRef(null);

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
        pollRef.current = setInterval(loadConversation, 5000);
        return () => clearInterval(pollRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, otherId, productId]);

    const handleSend = async (e) => {
        e.preventDefault();
        const content = text.trim();
        if (!content) return;

        const tempId = `temp-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            {
                id: tempId,
                content,
                sent_by_me: true,
                is_read: false,
                created_at: new Date().toISOString(),
            },
        ]);
        setText("");
        scrollToBottom();

        try {
            await api.post("/messages", {
                receiver_id: otherId,
                content,
                product_id: productId || null,
            });
            await loadConversation();
        } catch (e) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            alert(e?.response?.data?.detail || e.message || "Send failed");
        }
    };

    if (!token) return <p style={{ textAlign: "center", marginTop: 40 }}>Please log in.</p>;
    if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading…</p>;
    if (!otherUser) return <p style={{ textAlign: "center", marginTop: 40 }}>User not found.</p>;

    return (
        <div className="chat-shell">
            {/* HEADER */}
            <div className="chat-header">
                <div className="chat-header__left">
                    <button className="chat-back" onClick={() => navigate("/messages")} aria-label="Back">
                        ← Back
                    </button>
                    <div>
                        <div className="chat-title">{otherUser.name}</div>
                        <div className="chat-sub muted">
                            {product ? "Listing conversation" : "General conversation"}
                        </div>
                    </div>
                </div>
            </div>

            {/* BODY: thread + product panel */}
            <div className="chat-body">
                <section className="chat-main card">
                    {messages.length === 0 ? (
                        <p className="muted" style={{ padding: 12, margin: 0 }}>
                            No messages yet. Start the conversation!
                        </p>
                    ) : (
                        messages.map((m) => (
                            <ChatBubble key={m.id} sentByMe={m.sent_by_me} timestamp={m.created_at} compact>
                                {m.content}
                            </ChatBubble>
                        ))
                    )}
                    <div ref={bottomRef} />
                </section>

                <aside className="chat-aside">
                    {product && (
                        <div className="chat-product card">
                            <Link to={`/product/${product.id}`} className="chat-product__media">
                                <img
                                    src={product.image || product.thumbnail || "https://via.placeholder.com/300"}
                                    alt={product.name}
                                />
                            </Link>
                            <div className="chat-product__body">
                                <div className="chat-product__row">
                                    <Link to={`/product/${product.id}`} className="chat-product__title">
                                        {product.name}
                                    </Link>
                                    {product.price && (
                                        <div className="chat-product__price">${product.price}</div>
                                    )}
                                </div>
                                <div className="chat-product__chips">
                                    {product.brand && <span className="p-chip">{product.brand}</span>}
                                    {product.category && (
                                        <span className="p-chip p-chip--muted">{product.category}</span>
                                    )}
                                </div>
                                <Link
                                    to={`/product/${product.id}`}
                                    className="btn btn-primary"
                                    style={{ width: "100%", marginTop: "auto" }}
                                >
                                    View Listing
                                </Link>
                            </div>
                        </div>
                    )}
                </aside>

                {/* COMPOSER sits UNDER the thread only */}
                <form className="chat-composer" onSubmit={handleSend}>
                    <input
                        className="chat-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message…"
                    />
                    <button type="submit" className="btn btn-primary">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
