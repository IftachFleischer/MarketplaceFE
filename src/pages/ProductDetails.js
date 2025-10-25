import { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/* helpers */
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
    const { user } = useContext(AuthContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [idx, setIdx] = useState(0);

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

    const images = useMemo(
        () => (Array.isArray(product?.images) ? product.images.filter(Boolean) : []),
        [product]
    );
    const hasMultiple = images.length > 1;

    const sellerId = useMemo(() => (product ? getSellerId(product) : null), [product]);
    const myId = normalizeId(user?.id) || normalizeId(user?._id);
    const isMyProduct = sellerId && myId && sellerId === myId;

    const handleMessageSeller = () => {
        if (!sellerId) return;
        navigate(`/messages/${sellerId}?product=${id}`);
    };

    const next = () => setIdx((i) => (i + 1) % images.length);
    const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);

    useEffect(() => {
        if (idx > images.length - 1) setIdx(0);
    }, [images.length, idx]);

    if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
    if (!product) return <p style={{ textAlign: "center" }}>Product not found.</p>;

    return (
        <div className="container" style={{ padding: 20 }}>
            {/* Two columns on wide screens, stack on small */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(280px, 560px) 1fr",
                    gap: 24,
                    alignItems: "start",
                }}
            >
                {/* LEFT: media (bounded + centered) */}
                <div style={{ width: "100%", maxWidth: 560 }}>
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            maxHeight: "70vh",
                            minHeight: 360,
                            borderRadius: 14,
                            overflow: "hidden",
                            border: "1px solid #e6e6e6",
                            background: "#f7f7f7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <img
                            src={images[idx] || "https://via.placeholder.com/800"}
                            alt={product.product_name}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",    // no stretch, no crop
                                display: "block",
                                margin: "0 auto",
                                imageRendering: "auto",
                            }}
                        />

                        {hasMultiple && (
                            <>
                                <button onClick={prev} style={navArrowStyle("left")} aria-label="Previous image">‹</button>
                                <button onClick={next} style={navArrowStyle("right")} aria-label="Next image">›</button>
                            </>
                        )}

                        <span
                            style={{
                                position: "absolute",
                                bottom: 10,
                                left: 10,
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                fontSize: 12,
                                padding: "3px 8px",
                                borderRadius: 999,
                            }}
                        >
                            {images.length} {images.length === 1 ? "image" : "images"}
                        </span>
                    </div>

                    {/* Thumbnails only if multiple */}
                    {hasMultiple && (
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 10,
                                overflowX: "auto",
                                paddingBottom: 4,
                            }}
                        >
                            {images.map((url, i) => {
                                const active = i === idx;
                                return (
                                    <button
                                        key={`${url}-${i}`}
                                        onClick={() => setIdx(i)}
                                        title={`Image ${i + 1}`}
                                        style={{
                                            width: 84,
                                            height: 84,
                                            flex: "0 0 auto",
                                            borderRadius: 10,
                                            overflow: "hidden",
                                            border: active ? "2px solid #111" : "1px solid #e6e6e6",
                                            padding: 0,
                                            background: "#fff",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`thumb-${i}`}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT: details */}
                <div style={{ paddingTop: 4 }}>
                    <h2 style={{ margin: "0 0 8px" }}>{product.product_name}</h2>
                    <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 10 }}>${product.price_usd}</div>
                    <p style={{ marginTop: 0, opacity: 0.9 }}>{product.product_description}</p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 8,
                            marginTop: 10,
                            marginBottom: 16,
                        }}
                    >
                        <div><b>Brand:</b> {product.brand || "-"}</div>
                        <div><b>Category:</b> {product.category || "-"}</div>
                    </div>

                    {!isMyProduct && (
                        <button className="btn btn-ghost" onClick={handleMessageSeller} style={{ borderColor: "#ddd" }}>
                            Message Seller
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function navArrowStyle(side) {
    return {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [side]: 10,
        width: 36,
        height: 36,
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.25)",
        background: "rgba(255,255,255,0.92)",
        cursor: "pointer",
        fontSize: 22,
        lineHeight: "34px",
    };
}
