import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/** Normalize any possible id shape (string, {$oid}, {_id:{$oid}}, etc.) */
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

/** Get a product's id from various shapes: p.id, p._id, p._id.$oid, etc. */
const getProductId = (p) => {
    if (!p) return null;
    return normalizeId(p.id) || normalizeId(p._id) || null;
};

/** Extract seller id robustly from various Beanie/Mongo shapes */
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
    const { user } = useContext(AuthContext);
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

    const myId = normalizeId(user?.id) || normalizeId(user?._id);

    // Hide my own products if logged in
    const visibleProducts = (myId
        ? products.filter((p) => (p?.is_sold === false || !p?.is_sold) && (normalizeId(getSellerId(p)) !== myId))
        : products.filter((p) => p?.is_sold === false || !p?.is_sold)
    );

    const handleMessageSeller = (e, sellerId) => {
        e.preventDefault(); // don't trigger the outer Link
        e.stopPropagation();
        if (!sellerId) {
            alert("Seller not found for this item.");
            return;
        }
        navigate(`/messages/${sellerId}`);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Products</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {visibleProducts.length === 0 ? (
                    <p>No products found.</p>
                ) : (
                    visibleProducts.map((p) => {
                        const pid = getProductId(p);
                        const sellerId = getSellerId(p);
                        return (
                            <Link
                                key={pid || JSON.stringify(p)}
                                to={pid ? `/product/${pid}` : "#"}
                                onClick={(e) => {
                                    if (!pid) {
                                        e.preventDefault();
                                        console.warn("Product missing id:", p);
                                        alert("This product is missing an ID and cannot be opened.");
                                    }
                                }}
                                style={{ textDecoration: "none", color: "inherit" }}
                            >
                                <div
                                    style={{
                                        border: "1px solid #ccc",
                                        borderRadius: 10,
                                        padding: 10,
                                        width: 220,
                                        textAlign: "center",
                                        opacity: pid ? 1 : 0.6,
                                        cursor: pid ? "pointer" : "not-allowed",
                                    }}
                                >
                                    <img
                                        src={p.images?.[0] || "https://via.placeholder.com/150"}
                                        alt={p.product_name}
                                        style={{ width: "100%", borderRadius: 8, height: 150, objectFit: "cover" }}
                                    />
                                    <h4 style={{ margin: "10px 0 6px" }}>{p.product_name}</h4>
                                    <p style={{ margin: 0 }}>${p.price_usd}</p>

                                    {/* Message Seller button (non-owner listings only; Home already filters your own) */}
                                    {sellerId && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!sellerId || !pid) return alert("Missing seller or product");
                                                navigate(`/messages/${sellerId}?product=${pid}`); // ← pass product
                                            }}
                                            style={{
                                                marginTop: 10,
                                                padding: "8px 10px",
                                                borderRadius: 8,
                                                border: "1px solid #ccc",
                                                background: "#f0f0f0",
                                                cursor: "pointer",
                                                width: "100%",
                                            }}
                                        >
                                            💬 Message Seller
                                        </button>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
