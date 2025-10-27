export default function ChatBubble({ sentByMe, timestamp, children, compact = true }) {
    const sideClass = sentByMe ? "cb cb--me" : "cb cb--them";
    return (
        <div className={sideClass}>
            <div className="cb__bubble">
                <div className="cb__content">{children}</div>
                <div className="cb__meta">
                    <small>{new Date(timestamp).toLocaleString()}</small>
                </div>
            </div>
        </div>
    );
}