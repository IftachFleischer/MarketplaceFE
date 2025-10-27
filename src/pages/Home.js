// src/pages/Home.js
import { useEffect, useState, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

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

export default function Home() {
    const [products, setProducts] = useState([]);
    const { user, token } = useContext(AuthContext);
    const myId = useMemo(
        () => normalizeId(user?.id) || normalizeId(user?._id),
        [user]
    );
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get("/products");
                setProducts(res.data);
            } catch (err) {
                console.error("Failed to load products", err);
            }
        };
        fetchProducts();
    }, []);

    const onMessageClick = (p) => {
        const sellerId = getSellerId(p);
        const pid = normalizeId(p.id || p._id);

        // logged-out: send to Sign In and remember product
        if (!token) {
            navigate("/login", {
                state: { fromMessageAttempt: true, productId: pid },
            });
            return;
        }
        // logged-in & not my item -> open conversation (thread for this product)
        if (sellerId && myId !== sellerId) {
            navigate(`/messages/${sellerId}?product=${pid}`);
        }
    };

    return (
        <div className="container" style={{ padding: "16px 0 32px" }}>
            <div className="home-head">
                <h2>Discover</h2>
            </div>

            <div className="p-grid">
                {products.length === 0 ? (
                    <p>No products found.</p>
                ) : (
                    products.map((p) => {
                        const id = normalizeId(p.id || p._id);
                        const cover = p.images?.[0] || "https://via.placeholder.com/400";
                        const sellerId = getSellerId(p);
                        const isMine = myId && sellerId && myId === sellerId;

                        return (
                            <div key={id} className="p-card">
                                <Link to={`/product/${id}`} className="p-card__media">
                                    {p.is_sold && <span className="p-badge">SOLD</span>}
                                    <img src={cover} alt={p.product_name} />
                                </Link>

                                <div className="p-card__body">
                                    <div className="p-card__row">
                                        <Link to={`/product/${id}`} className="p-title">
                                            {p.product_name}
                                        </Link>
                                        <div className="p-price">${p.price_usd}</div>
                                    </div>

                                    <div className="p-meta">
                                        {p.brand && <span className="p-chip">{p.brand}</span>}
                                        {p.category && (
                                            <span className="p-chip p-chip--muted">{p.category}</span>
                                        )}
                                    </div>

                                    {/* Footer ALWAYS rendered; sticks to bottom */}
                                    <div className="p-card__footer">
                                        {isMine ? (
                                            <button className="btn btn-ghost p-card__cta" disabled>
                                                Your listing
                                            </button>
                                        ) : p.is_sold ? (
                                            <button className="btn btn-primary p-card__cta" disabled>
                                                Sold
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-primary p-card__cta"
                                                onClick={() => onMessageClick(p)}
                                            >
                                                Message Seller
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
