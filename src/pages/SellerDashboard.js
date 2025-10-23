import { useEffect, useState, useContext, useCallback } from "react";
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

/** Get a product's id from various shapes: p.id, p._id, p._id.$oid, etc. */
const getProductId = (p) => normalizeId(p?.id) || normalizeId(p?._id) || null;

export default function SellerDashboard() {
    const { token, user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        product_name: "",
        product_description: "",
        price_usd: "",
        category: "",
        brand: "",
        images: [""],
    });
    const [editingId, setEditingId] = useState(null);

    const myId = normalizeId(user?.id) || normalizeId(user?._id);

    const loadProducts = useCallback(async () => {
        try {
            const res = await api.get("/products");
            // keep only my products
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

    // Only send editable fields
    const editablePayload = ({
        product_name,
        product_description,
        price_usd,
        category,
        brand,
        images,
    }) => ({
        product_name,
        product_description,
        price_usd: Number(price_usd),
        category,
        brand,
        images,
    });

    const resetForm = () =>
        setForm({
            product_name: "",
            product_description: "",
            price_usd: "",
            category: "",
            brand: "",
            images: [""],
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
            images: product.images?.length ? [product.images[0]] : [""],
        });
        const pid = getProductId(product);
        setEditingId(pid);
    };

    const handleDelete = async (rawId) => {
        const id = typeof rawId === "string" ? rawId : getProductId(rawId);
        if (!id) {
            alert("Missing product id");
            return;
        }
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
        if (!id) {
            alert("Missing product id");
            return;
        }
        if (!window.confirm("Mark this product as SOLD?")) return;
        try {
            const res = await api.patch(`/products/${id}/mark_sold`);
            // Update local state (replace the updated product)
            setProducts((prev) =>
                prev.map((p) => (getProductId(p) === id ? res.data : p))
            );
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || "Failed to mark as sold";
            alert(`Error: ${msg}`);
            console.error("Failed to mark sold:", err);
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={handleSubmit} style={{ marginBottom: 40 }}>
                <input
                    name="product_name"
                    placeholder="Product name"
                    value={form.product_name}
                    onChange={handleChange}
                    required
                /><br />
                <textarea
                    name="product_description"
                    placeholder="Description"
                    value={form.product_description}
                    onChange={handleChange}
                /><br />
                <input
                    name="price_usd"
                    type="number"
                    placeholder="Price (USD)"
                    value={form.price_usd}
                    onChange={handleChange}
                /><br />
                <input
                    name="category"
                    placeholder="Category"
                    value={form.category}
                    onChange={handleChange}
                /><br />
                <input
                    name="brand"
                    placeholder="Brand"
                    value={form.brand}
                    onChange={handleChange}
                /><br />
                <input
                    name="images"
                    placeholder="Image URL (optional)"
                    value={form.images[0]}
                    onChange={(e) => setForm((prev) => ({ ...prev, images: [e.target.value] }))}
                /><br />
                <button type="submit">
                    {editingId ? "Update Product" : "Add Product"}
                </button>
            </form>

            <h3>Your Products</h3>
            {products.length === 0 ? (
                <p>No products yet.</p>
            ) : (
                products.map((p) => {
                    const id = getProductId(p);
                    return (
                        <div
                            key={id || JSON.stringify(p)}
                            style={{
                                border: "1px solid #ccc",
                                borderRadius: 10,
                                padding: 10,
                                marginBottom: 10,
                            }}
                        >
                            <h4>
                                {p.product_name}{" "}
                                {p.is_sold ? <span style={{ color: "crimson" }}>· SOLD</span> : null}
                            </h4>
                            <p>{p.product_description}</p>
                            <p>${p.price_usd}</p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {!p.is_sold && (
                                    <button onClick={() => handleMarkSold(id)}>Mark as Sold</button>
                                )}
                                <button onClick={() => handleEdit(p)} disabled={p.is_sold}>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(id)}>Delete</button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
