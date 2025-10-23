import { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

/** Extract seller id robustly from various Beanie/Mongo shapes */
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
    const { user } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                console.error("Failed to load product:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const sellerId = useMemo(() => (product ? getSellerId(product) : null), [product]);
    const myId = normalizeId(user?.id) || normalizeId(user?._id);
    const isMyProduct = sellerId && myId && sellerId === myId;
    const isSold = Boolean(product?.is_sold);

    const handleMessageSeller = () => {
        if (!sellerId) return;
        navigate(`/messages/${sellerId}?product=${id}`); // tie chat to this listing
    };

    if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
    if (!product) return <p style={{ textAlign: "center" }}>Product not found.</p>;

    return (
        <div style={{ maxWidth: 600, margin: "auto", marginTop: 50 }}>
            {isSold && (
                <div
                    style={{
                        background: "#ffe9e9",
                        border: "1px solid #ffc0c0",
                        color: "#b00020",
                        padding: "8px 12px",
                        borderRadius: 8,
                        marginBottom: 12,
                    }}
                >
                    This item has been SOLD.
                </div>
            )}

            <img
                src={product.images?.[0] || "https://via.placeholder.com/400"}
                alt={product.product_name}
                style={{ width: "100%", borderRadius: 10 }}
            />
            <h2 style={{ marginTop: 16 }}>
                {product.product_name} {isSold ? <span style={{ color: "crimson", fontSize: 16 }}>· SOLD</span> : null}
            </h2>
            <p>{product.product_description}</p>
            <h3>${product.price_usd}</h3>
            <p>
                <b>Brand:</b> {product.brand || "-"}
            </p>
            <p>
                <b>Category:</b> {product.category || "-"}
            </p>

            {/* Show button only if it's not my product and listing isn't sold */}
            {!isMyProduct && sellerId && !isSold && (
                <button
                    onClick={handleMessageSeller}
                    style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                        cursor: "pointer",
                        backgroundColor: "#f0f0f0",
                    }}
                >
                    💬 Message Seller
                </button>
            )}
        </div>
    );
}
