import { Link, useNavigate } from "react-router-dom";
import { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";

/* id helpers */
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
const getDocId = (p) => normalizeId(p?._id) || normalizeId(p?.id);
const getSellerId = (p) => {
    const s = p?.seller;
    if (!s) return null;
    if (typeof s === "string") return s;
    if (s.id) return normalizeId(s.id);
    if (s.$id) return normalizeId(s.$id);
    return normalizeId(s);
};

const formatPrice = (v) => {
    if (typeof v === "number") return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    const n = Number(v);
    return Number.isFinite(n) ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$—";
};

export default function ProductCard({ product, onMessage }) {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const id = getDocId(product);
    const sellerId = getSellerId(product);
    const myId = normalizeId(user?.id) || normalizeId(user?._id);
    const isMine = myId && sellerId && String(myId) === String(sellerId);

    const cover = useMemo(() => product?.images?.[0] || "https://via.placeholder.com/600", [product]);

    const handleMessageClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onMessage?.(product);
    };

    return (
        <Link to={`/product/${id}`} className="p-card">
            {/* image area */}
            <div className="p-card__media">
                {product?.is_sold && <span className="p-badge p-badge--sold">SOLD</span>}
                <img
                    src={cover}
                    alt={product?.product_name || "Product image"}
                    loading="lazy"
                    decoding="async"
                />
            </div>

            {/* body */}
            <div className="p-card__body">
                <div className="p-card__row">
                    <h4 className="p-title">{product?.product_name}</h4>
                    <div className="p-price">{formatPrice(product?.price_usd)}</div>
                </div>

                <div className="p-meta">
                    {product?.brand && <span className="p-chip">{product.brand}</span>}
                    {product?.category && <span className="p-chip p-chip--muted">{product.category}</span>}
                </div>

                {!isMine && (
                    <button className="btn btn-ghost p-card__cta" onClick={handleMessageClick}>
                        Message Seller
                    </button>
                )}
            </div>
        </Link>
    );
}
