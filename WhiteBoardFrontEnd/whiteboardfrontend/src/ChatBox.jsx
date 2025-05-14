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
		<div className="p-4 h-64 flex flex-col justify-between bg-gradient-to-r from-purple-500 to-indigo-600">
			

			{/* Message input */}
			<div className="flex items-end space-x-2">
				<textarea
					className="w-full p-2 bg-white rounded-2xl resize-none"
					rows="1"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder="Type a message..."
				/>
				<button onClick={handleSend} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
					Send
				</button>
			</div>

			{/* Chat messages */}
			<div className="flex-1 overflow-y-auto bg-white rounded p-2 mb-2">
				{messages.map((msg, index) => (
					<div key={index} className="mb-1">
						<strong>{msg.user}:</strong> {msg.message}
					</div>
				))}
			</div>
		</div>
	);
};


export default ChatBox;
