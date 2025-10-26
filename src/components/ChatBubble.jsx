export default function ChatBubble({ sentByMe, timestamp, children }) {
    // Layout
    const align = sentByMe ? "flex-end" : "flex-start";

    // Colors from CSS variables (index.css)
    const bg = sentByMe ? "var(--accent)" : "var(--panel-muted)";
    const color = sentByMe ? "#fff" : "var(--text)";
    const border = sentByMe ? "1px solid transparent" : "1px solid var(--border)";

    return (
        <div style={{ display: "flex", justifyContent: align, margin: "8px 0" }}>
            <div
                style={{
                    maxWidth: "min(560px, 80%)",   // keeps bubbles readable on wide screens
                    background: bg,
                    color,
                    border,
                    borderRadius: 14,
                    padding: "10px 12px",
                    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
                    lineHeight: 1.4,
                }}
            >
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {children}
                </div>

                {timestamp && (
                    <div style={{ textAlign: "right", marginTop: 6 }}>
                        <small style={{ color: "var(--text-muted)" }}>
                            {new Date(timestamp).toLocaleString()}
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
}
