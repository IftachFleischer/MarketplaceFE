// src/components/ChatBubble.jsx
export default function ChatBubble({ sentByMe, timestamp, children }) {
    const formatted = formatLocalTime(timestamp);
    return (
        <div className={`bubble-row ${sentByMe ? "is-me" : "is-them"}`}>
            <div className={`bubble ${sentByMe ? "bubble--me" : "bubble--them"}`}>
                <div className="bubble__text">{children}</div>
                <div className="bubble__meta">{formatted}</div>
            </div>
        </div>
    );
}

/** Force display in the viewer's local time.
 * If the backend sends UTC without 'Z', we append 'Z' to avoid the -2h drift.
 */
function formatLocalTime(ts) {
    try {
        let s = typeof ts === "string" ? ts : new Date(ts).toISOString();
        if (typeof ts === "string" && !s.endsWith("Z") && !s.includes("+")) {
            // treat as UTC if it looks naive
            s += "Z";
        }
        const d = new Date(s);
        return d.toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return String(ts);
    }
}
