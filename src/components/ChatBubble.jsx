export default function ChatBubble({ sentByMe, timestamp, children }) {
    const align = sentByMe ? "flex-end" : "flex-start";
    const bg = sentByMe ? "#daf1ff" : "#ffffff";
    const border = sentByMe ? "1px solid #b7e2ff" : "1px solid #e5e5e5";

    return (
        <div style={{ display: "flex", justifyContent: align, marginBottom: 8 }}>
            <div
                style={{
                    maxWidth: "75%",
                    background: bg,
                    border,
                    borderRadius: 12,
                    padding: "8px 12px",
                    boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
                }}
            >
                <div style={{ whiteSpace: "pre-wrap" }}>{children}</div>
                <div style={{ textAlign: "right", marginTop: 4 }}>
                    <small style={{ opacity: 0.6 }}>
                        {new Date(timestamp).toLocaleString()}
                    </small>
                </div>
            </div>
        </div>
    );
}
