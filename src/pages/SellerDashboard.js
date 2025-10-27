import { useEffect, useState, useContext, useCallback } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/* ---------- id helpers ---------- */
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
const getProductId = (p) => normalizeId(p?.id) || normalizeId(p?._id) || null;

/* ---------- icons ---------- */
const TrashIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0  1 2 2v2" stroke="currentColor" strokeWidth="2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
const StarIcon = ({ filled, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ color: filled ? "#f5a623" : "currentColor" }}>
        <path
            d="M12 2l2.955 6.093 6.723.977-4.864 4.742 1.148 6.693L12 17.77 6.038 20.505l1.148-6.693L2.322 9.07l6.723-.977L12 2z"
            fill={filled ? "#f5a623" : "none"}
            stroke={filled ? "#f5a623" : "currentColor"}
            strokeWidth="1.5"
        />
    </svg>
);

export default function SellerDashboard() {
    const { token, user } = useContext(AuthContext);

    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        product_name: "",
        product_description: "",
        price_usd: "",
        category: "",
        brand: "",
        images: [],
        size: "",           // ← free text
    });
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);

    const myId = normalizeId(user?.id) || normalizeId(user?._id);

    const loadProducts = useCallback(async () => {
        try {
            const res = await api.get("/products");
            const mine = (res.data || []).filter((p) => normalizeId(getSellerId(p)) === myId);
            setProducts(mine);
        } catch (err) {
            console.error("Failed to load products:", err);
        }
    }, [myId]);

    useEffect(() => {
        if (token && user) loadProducts();
    }, [token, user, loadProducts]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const editablePayload = (f) => ({
        product_name: f.product_name,
        product_description: f.product_description,
        price_usd: Number(f.price_usd),
        category: f.category,
        brand: f.brand,
        images: Array.isArray(f.images) ? f.images.slice(0, 5) : [],
        size: f.size || "",     // ← keep sending the free-text size
    });

    const resetForm = () =>
        setForm({
            product_name: "",
            product_description: "",
            price_usd: "",
            category: "",
            brand: "",
            images: [],
            size: "",
        });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, editablePayload(form));
                alert("Product updated");
            } else {
                await api.post("/products", editablePayload(form));
                alert("Product created");
            }
            resetForm();
            setEditingId(null);
            await loadProducts();
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || "Save failed";
            alert(`Error: ${msg}`);
            console.error("Error saving product:", err);
        }
    };

    const handleEdit = (product) => {
        setForm({
            product_name: product.product_name || "",
            product_description: product.product_description || "",
            price_usd: product.price_usd ?? "",
            category: product.category || "",
            brand: product.brand || "",
            images: Array.isArray(product.images) ? product.images : product.images ? [product.images] : [],
            size: product.size || "",   // ← load existing free-text size
        });
        const pid = getProductId(product);
        setEditingId(pid);
        setDragIndex(null);
    };

    const handleDelete = async (rawId) => {
        const id = typeof rawId === "string" ? rawId : getProductId(rawId);
        if (!id) return alert("Missing product id");
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts((prev) => prev.filter((p) => getProductId(p) !== id));
            alert("Product deleted");
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || "Delete failed";
            alert(`Error: ${msg}`);
            console.error("Failed to delete:", err);
        }
    };

    const handleMarkSold = async (rawId) => {
        const id = typeof rawId === "string" ? rawId : getProductId(rawId);
        if (!id) return alert("Missing product id");
        if (!window.confirm("Mark this product as SOLD?")) return;
        try {
            const res = await api.patch(`/products/${id}/mark_sold`);
            setProducts((prev) => prev.map((p) => (getProductId(p) === id ? res.data : p)));
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || "Failed to mark as sold";
            alert(`Error: ${msg}`);
            console.error("Failed to mark sold:", err);
        }
    };

    /* -------- multiple uploads (max 5) -------- */
    const handleFilesPick = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const remaining = Math.max(0, 5 - (form.images?.length || 0));
        const slice = files.slice(0, remaining);
        if (!slice.length) {
            alert("You already have 5 images.");
            e.target.value = "";
            return;
        }

        setUploading(true);
        try {
            let newUrls = [];
            if (slice.length === 1) {
                const data = new FormData();
                data.append("file", slice[0]);
                const res = await api.post("/uploads/image", data, { headers: { "Content-Type": "multipart/form-data" } });
                newUrls = [res.data?.url].filter(Boolean);
            } else {
                const data = new FormData();
                slice.forEach((f) => data.append("files", f));
                const res = await api.post("/uploads/images", data, { headers: { "Content-Type": "multipart/form-data" } });
                newUrls = (res.data?.items || []).map((x) => x.url).filter(Boolean);
            }
            setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...newUrls].slice(0, 5) }));
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || "Upload failed";
            alert(`Image upload error: ${msg}`);
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    /* -------- thumbnails: remove / cover / drag re-order -------- */
    const removeImage = (index) => {
        setForm((prev) => {
            const imgs = [...(prev.images || [])];
            imgs.splice(index, 1);
            return { ...prev, images: imgs };
        });
    };
    const setAsCover = (index) => {
        setForm((prev) => {
            const imgs = [...(prev.images || [])];
            if (index < 0 || index >= imgs.length) return prev;
            const [picked] = imgs.splice(index, 1);
            imgs.unshift(picked);
            return { ...prev, images: imgs };
        });
    };
    const onDragStart = (i) => setDragIndex(i);
    const onDragOver = (e) => e.preventDefault();
    const onDrop = (i) => {
        if (dragIndex === null || dragIndex === i) return;
        setForm((prev) => {
            const imgs = [...(prev.images || [])];
            const [moved] = imgs.splice(dragIndex, 1);
            imgs.splice(i, 0, moved);
            return { ...prev, images: imgs };
        });
        setDragIndex(null);
    };

    return (
        <div className="container" style={{ padding: 20 }}>
            <h2 style={{ marginBottom: 16 }}>{editingId ? "Edit Product" : "Add New Product"}</h2>

            {/* SINGLE-COLUMN CARD — each field its own row; responsive internals */}
            <form onSubmit={handleSubmit} style={card()}>
                {/* Name */}
                <label style={label()}>Product name</label>
                <input
                    name="product_name"
                    placeholder="e.g. Vintage beige tee"
                    value={form.product_name}
                    onChange={handleChange}
                    required
                    style={input()}
                />

                {/* Description */}
                <label style={label({ mt: 10 })}>Description</label>
                <textarea
                    name="product_description"
                    placeholder="Condition, fit, fabric…"
                    value={form.product_description}
                    onChange={handleChange}
                    style={{ ...input(), minHeight: 140, resize: "vertical" }}
                />

                {/* Images */}
                <label style={label({ mt: 10 })}>Images (up to 5)</label>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleFilesPick}
                    disabled={uploading}
                    style={fileInput()}
                />
                {uploading && <small style={{ opacity: 0.7, display: "block", marginTop: 6 }}>Uploading…</small>}

                {/* Thumbnails */}
                <div
                    style={{
                        marginTop: 12,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
                        gap: 10,
                    }}
                >
                    {(form.images || []).map((url, i) => {
                        const isCover = i === 0;
                        return (
                            <div
                                key={`${url}-${i}`}
                                draggable
                                onDragStart={() => onDragStart(i)}
                                onDragOver={onDragOver}
                                onDrop={() => onDrop(i)}
                                title="Drag to reorder"
                                style={{
                                    position: "relative",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: dragIndex === i ? "2px dashed #111" : "1px solid #eee",
                                    background: "#fafafa",
                                }}
                            >
                                <img src={url} alt={`img-${i}`} style={{ width: "100%", height: 96, objectFit: "cover", display: "block" }} />
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 6,
                                        left: 6,
                                        right: 6,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <button type="button" onClick={() => setAsCover(i)} title={isCover ? "Cover image" : "Set as cover"} style={iconBtn({ bg: "rgba(255,255,255,0.95)" })}>
                                        <StarIcon filled={isCover} />
                                    </button>
                                    <button type="button" onClick={() => removeImage(i)} title="Remove image" style={iconBtn({ bg: "rgba(255,255,255,0.95)" })}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>
                    Tip: drag thumbnails to reorder · click the star to set the cover (first image shown in cards).
                </div>

                {/* Grid: Price / Brand / Size (free text) / Category */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                        marginTop: 16,
                    }}
                >
                    <div>
                        <label style={label()}>Price (USD)</label>
                        <input name="price_usd" type="number" placeholder="20" value={form.price_usd} onChange={handleChange} style={input()} />
                    </div>

                    <div>
                        <label style={label()}>Brand</label>
                        <input name="brand" placeholder="e.g. Uniqlo" value={form.brand} onChange={handleChange} style={input()} />
                    </div>

                    <div>
                        <label style={label()}>Size</label>
                        <input
                            name="size"
                            placeholder="e.g. M, EU 42, 32x30"
                            value={form.size}
                            onChange={handleChange}
                            style={input()}
                        />
                    </div>

                    <div>
                        <label style={label()}>Category</label>
                        <input name="category" placeholder="e.g. Shirts" value={form.category} onChange={handleChange} style={input()} />
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <button type="submit" disabled={uploading} style={primaryBtn()}>
                        {editingId ? "Update Product" : "Add Product"}
                    </button>
                </div>
            </form>

            <h3 style={{ margin: "18px 0 12px" }}>Your Products</h3>
            {products.length === 0 ? (
                <p>No products yet.</p>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: 16,
                    }}
                >
                    {products.map((p) => {
                        const id = getProductId(p);
                        const cover = p.images?.[0] || "https://via.placeholder.com/400";
                        const count = Array.isArray(p.images) ? p.images.length : 0;
                        return (
                            <div
                                key={id || JSON.stringify(p)}
                                style={{
                                    border: "1px solid #eee",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    background: "#fff",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                }}
                            >
                                <div style={{ position: "relative" }}>
                                    <img src={cover} alt={p.product_name} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                                    {count > 1 && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                bottom: 8,
                                                right: 8,
                                                background: "rgba(0,0,0,0.6)",
                                                color: "#fff",
                                                fontSize: 12,
                                                padding: "2px 6px",
                                                borderRadius: 8,
                                            }}
                                        >
                                            +{count - 1}
                                        </span>
                                    )}
                                </div>
                                <div style={{ padding: 12 }}>
                                    <h4 style={{ margin: 0 }}>
                                        {p.product_name} {p.is_sold ? <span style={{ color: "crimson", fontSize: 14 }}>· SOLD</span> : null}
                                    </h4>
                                    <div style={{ opacity: 0.85, margin: "6px 0" }}>${p.price_usd}</div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                                        {!p.is_sold && (
                                            <button onClick={() => handleMarkSold(id)} style={primaryBtn()}>
                                                Mark as Sold
                                            </button>
                                        )}
                                        <button onClick={() => handleEdit(p)} disabled={p.is_sold} style={secondaryBtn(p.is_sold)}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(id)} style={dangerBtn()}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ---------- styles ---------- */
function card() {
    return {
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    };
}
function label({ mt = 0 } = {}) {
    return { display: "block", marginBottom: 6, marginTop: mt, fontWeight: 600 };
}
function input() {
    return {
        width: "100%",
        boxSizing: "border-box",
        display: "block",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ccc",
        outline: "none",
        background: "#fff",
    };
}
function fileInput() {
    return {
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        padding: 4,
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "#fafafa",
    };
}
function primaryBtn() {
    return {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #111",
        background: "#111",
        color: "#fff",
        cursor: "pointer",
    };
}
function secondaryBtn(disabled) {
    return {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #bbb",
        background: disabled ? "#f0f0f0" : "#fff",
        color: disabled ? "#777" : "#111",
        cursor: disabled ? "not-allowed" : "pointer",
    };
}
function dangerBtn() {
    return {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #d66",
        background: "#ffecec",
        color: "#a00",
        cursor: "pointer",
    };
}
function iconBtn({ bg = "#fff" } = {}) {
    return {
        pointerEvents: "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 999,
        border: "1px solid #ccc",
        background: bg,
        cursor: "pointer",
        boxSizing: "border-box",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    };
}
