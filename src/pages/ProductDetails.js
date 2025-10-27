import { useEffect, useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/** ——— helpers ——— */
const normalizeId = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") {
        if (val.$oid) return String(val.$oid);
        if (val._id) return normalizeId(val._id);
        if (val.id) return normalizeId(val.id);
    }
    return String(val);
};
const getSellerId = (p) => {
    const s = p?.seller;
    if (!s) return null;
    if (typeof s === "string") return s;
    if (s.id) return normalizeId(s.id);
    if (s.$id) return normalizeId(s.$id);
    return normalizeId(s);
};

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(0);

    const myId = useMemo(
        () => normalizeId(user?.id) || normalizeId(user?._id),
        [user]
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get(`/products/${id}`);
                if (!mounted) return;
                setProduct(res.data);
                setActive(0);
            } catch (e) {
                console.error("Failed to load product:", e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [id]);

    if (loading) return <div className="container" style={{ padding: 24 }}>Loading…</div>;
    if (!product) return <div className="container" style={{ padding: 24 }}>Product not found.</div>;

    const images = product.images && product.images.length ? product.images.slice(0, 5) : [];
    const sellerId = getSellerId(product);
    const isMine = sellerId && myId && sellerId === myId;

    const handleMessage = () => {
        const pid = normalizeId(product.id || product._id);
        if (!token) {
            navigate("/login", {
                state: { fromMessageAttempt: true, productId: pid },
            });
            return;
        }
        if (sellerId && myId !== sellerId) {
            navigate(`/messages/${sellerId}?product=${pid}`);
        }
    };

    return (
        <div className="container" style={{ padding: "16px 0 32px" }}>
            <div className="pd-grid">
                {/* Left: media */}
                <div className="pd-media card">
                    <div className="pd-media__main">
                        <img
                            src={images[active] || "https://via.placeholder.com/900"}
                            alt={product.product_name}
                            className="pd-media__img"
                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/900")}
                        />
                    </div>

                    {images.length > 1 && (
                        <div className="pd-thumbs">
                            {images.map((src, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`pd-thumb ${i === active ? "is-active" : ""}`}
                                    onClick={() => setActive(i)}
                                    aria-label={`Show image ${i + 1}`}
                                >
                                    <img src={src} alt={`thumb ${i + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: details */}
                <aside className="pd-side card">
                    <h2 style={{ margin: "0 0 6px" }}>{product.product_name}</h2>
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>${product.price_usd}</div>

                    {product.product_description && (
                        <p className="muted" style={{ marginTop: 0 }}>{product.product_description}</p>
                    )}

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0 14px" }}>
                        {product.size && <span className="p-chip">{product.size}</span>}
                        {product.brand && <span className="p-chip">{product.brand}</span>}
                        {product.category && <span className="p-chip p-chip--muted">{product.category}</span>}
                    </div>

                    {!isMine ? (
                        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleMessage}>
                            Message Seller
                        </button>
                    ) : (
                        <button className="btn btn-ghost" style={{ width: "100%" }} disabled>
                            This is your listing
                        </button>
                    )}
                </aside>
            </div>
        </div>
    );
}
