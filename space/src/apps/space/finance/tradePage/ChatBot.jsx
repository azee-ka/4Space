import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

export default function ChatBot() {
  const [msgs, setMsgs] = useState([
    { role: "bot", text: "Hi! Ask for trade ideas." },
  ]);
  const [inTxt, setInTxt] = useState("");

  const send = () => {
    if (!inTxt) return;
    setMsgs([
      ...msgs,
      { role: "user", text: inTxt },
      { role: "bot", text: `🤖 Idea for "${inTxt}"` },
    ]);
    setInTxt("");
  };

  return (
    <div className="tp-chat">
      <h4>
        <FontAwesomeIcon icon={faComments} /> TradeBot
      </h4>
      <div className="tp-chat-window">
        {msgs.map((m, i) => (
          <div key={i} className={m.role}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="tp-chat-input">
        <input
          placeholder="Ask..."
          value={inTxt}
          onChange={(e) => setInTxt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
