import React from 'react';
import "./App.css";

const ChatBox = ({ userName, sendMessage, whiteBoard, quitWhiteBoard, messages }) => {
	const [message, setMessage] = React.useState("");

	// Funktion f�r att skicka meddelanden fr�n frontend
	const handleSend = () => {
		if (message.trim()) {
			sendMessage(message, whiteBoard, userName);
			setMessage('');
		}
	};

	return (
		<div className="right-panel">
			{/* Chattmeddelanden */}
			<div className="chat-messages">
				{messages.slice(-23).map((msg, index) => (
					<div key={index} className="mb-1">
						<strong>{msg.user}:</strong> {msg.message}
					</div>
				))}
			</div>

			{/* Textf�lt och knapp f�r att skriva och skicka meddelanden */}
			<div className="chat-div">
				<textarea
					className="chat-textarea"
					rows="2"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder="Type a message..."
				/>
				<button onClick={handleSend}>
					Send
				</button>
			</div>
		</div>
	);
};


export default ChatBox;
