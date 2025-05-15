import React from 'react';
import "./App.css";

const ChatBox = ({ userName, sendMessage, whiteBoard, quitWhiteBoard, messages }) => {
	const [message, setMessage] = React.useState("");

	const handleSend = () => {
		if (message.trim()) {
			sendMessage(message, whiteBoard, userName);
			setMessage('');
		}
	};

	return (
		<div className="right-panel">
			{/* Chat messages */}
			<div className="chat-messages">
				{messages.map((msg, index) => (
					<div key={index} className="mb-1">
						<strong>{msg.user}:</strong> {msg.message}
					</div>
				))}
			</div>

			{/* Message input */}
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
