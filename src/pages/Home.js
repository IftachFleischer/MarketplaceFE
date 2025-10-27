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
const cityFromAddress = (addr) => {
    if (!addr || typeof addr !== "string") return null;
    const first = addr.split(",")[0].trim();
    return first || null;
};

export default function Home() {
    const [products, setProducts] = useState([]);
    const [q, setQ] = useState("");
    const [sellerMap, setSellerMap] = useState({}); // { sellerId: { address, first_name, last_name } }
    const { user, token } = useContext(AuthContext);
    const myId = useMemo(() => normalizeId(user?.id) || normalizeId(user?._id), [user]);
    const navigate = useNavigate();

    // Load products
    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/products");
                setProducts(res.data);
            } catch (err) {
                console.error("Failed to load products", err);
            }
        })();
    }, []);

    // After products load, fetch missing seller public profiles
    useEffect(() => {
        const ids = Array.from(
            new Set(
                products
                    .map((p) => getSellerId(p))
                    .filter(Boolean)
                    .filter((sid) => !(sid in sellerMap))
            )
        );
        if (!ids.length) return;

        (async () => {
            const updates = {};
            await Promise.all(
                ids.map(async (sid) => {
                    try {
                        // expects a backend endpoint that returns { id, first_name, last_name, address }
                        const r = await api.get(`/users/${sid}/public`);
                        updates[sid] = r.data || null;
                    } catch {
                        updates[sid] = null;
                    }
                })
            );
            if (Object.keys(updates).length) {
                setSellerMap((prev) => ({ ...prev, ...updates }));
            }
        })();
    }, [products, sellerMap]);

    const onMessageClick = (p) => {
        const sellerId = getSellerId(p);
        const pid = normalizeId(p.id || p._id);

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

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return products;
        return products.filter((p) => {
            const name = (p.product_name || "").toLowerCase();
            const brand = (p.brand || "").toLowerCase();
            const cat = (p.category || "").toLowerCase();
            const desc = (p.product_description || "").toLowerCase();

            // also search in city if we already have it
            const sid = getSellerId(p);
            const city = cityFromAddress(sellerMap[sid]?.address) || "";
            const cityL = city.toLowerCase();

            return (
                name.includes(s) ||
                brand.includes(s) ||
                cat.includes(s) ||
                desc.includes(s) ||
                cityL.includes(s)
            );
        });
    }, [q, products, sellerMap]);

    return (
        <div className="container" style={{ padding: "16px 0 32px" }}>
            <div className="home-head">
                <h2>Discover</h2>
                <div className="search">
                    <input
                        className="search-input"
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by name, brand, category, city…"
                        aria-label="Search products"
                    />
                    {q && (
                        <button
                            className="search-clear"
                            type="button"
                            onClick={() => setQ("")}
                            aria-label="Clear search"
                            title="Clear"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: 10, color: "var(--text-muted)" }}>
                {products.length === 0
                    ? "Loading products…"
                    : q
                        ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
                        : `${products.length} item${products.length === 1 ? "" : "s"}`}
            </div>

            <div className="p-grid">
                {products.length === 0 ? (
                    <p>No products found.</p>
                ) : filtered.length === 0 ? (
                    <p>No matches for “{q}”.</p>
                ) : (
                    filtered.map((p) => {
                        const id = normalizeId(p.id || p._id);
                        const cover = p.images?.[0] || "https://via.placeholder.com/400";
                        const sellerId = getSellerId(p);
                        const isMine = myId && sellerId && myId === sellerId;

                        const seller = sellerMap[sellerId];
                        const city = cityFromAddress(seller?.city);

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
                                        {p.size && <span className="p-chip">{p.size}</span>}
                                        {city && <span className="p-chip"> {city}</span>}
                                        {p.brand && <span className="p-chip">{p.brand}</span>}
                                        {p.category && (
                                            <span className="p-chip p-chip--muted">{p.category}</span>
                                        )}
                                    </div>

                                    <div className="p-card__footer">
                                        {isMine ? (
                                            <button className="btn btn-ghost p-card__cta" disabled>
                                                Your listing
                                            </button>
                                        ) : p.is_sold ? (
                                            <button className="btn btn-ghost p-card__cta" disabled title="This item has been sold">
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
