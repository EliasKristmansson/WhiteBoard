import React, { useState, useEffect } from 'react';
import "./App.css";
import "./whiteboard.css";
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import WhiteBoard from './WhiteBoard';
import WhiteBoardBox from './WhiteBoardBox';
import ChatBox from './ChatBox';

const WhiteBoardHome = () => {
	const [connection, setConnection] = useState(null);
	const [userName, setUserName] = useState('');
	const [whiteBoard, setWhiteBoard] = useState('1');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState([]);

	useEffect(() => {
		if (connection) {
			connection.on("ReceiveMessage", (user, message) => {
				// If message is undefined or user is a stringified message
				if (!message) {
					console.log(user); // system/log messages like "username joined..."
				} else {
					setMessages(prev => [...prev, { user, message }]);
				}
			});

			connection.onclose(() => {
				console.log("Connection closed");
			});
		}
	}, [connection]);



	// Sköter vad som händer när användare ansluter sig till chatt
	const joinWhiteBoard = async (userName, whiteBoard) => {
		setLoading(true);

		// Sätter connection, med hårdkodad URL för chathub
		const connection = new HubConnectionBuilder()
			.withUrl("https://whiteboard-backend.onrender.com/whiteboard")
			.configureLogging(LogLevel.Information)
			.build();

		setConnection(connection); // Sätter connection innan den skapas

		try {
			await connection.start(); // Starta connection
			await connection.invoke("JoinWhiteBoard", userName, whiteBoard); // Invokar servermetod för att joina chatroom
			setLoading(false);
		} catch (error) {
			console.error("Error starting connection: ", error);
			setLoading(false);
		}
	};

	// Stänger av connectionen när användaren vill gå ur ett chatroom
	const quitWhiteBoard = async () => {
		setLoading(true);

		// Kollar så att det finns en connection
		if (connection) {
			try {
				const userConnection = {
					UserName: userName,
					WhiteBoard: whiteBoard
				};

				await connection.invoke("QuitWhiteBoard", userConnection); // Invokar servermetod för att lämna chatroom
				await connection.stop(); // Stänger av connection
				setLoading(false);
			} catch (error) {
				console.error("Error stopping connection: ", error);
				setLoading(false);
			}
			finally {
				// Sätter alla värden tillbaka till sina standardvärden
				// det viktiga är att connection är null, messages töms, och att user resettas
				setConnection(null);
				setUserName('');
				setWhiteBoard('1');
				setLoading(false);
			}
		}
	};

	// Skickar ett meddelande, kallar på SendMessage i backend
	const sendMessage = async (whiteBoard, message, userName) => {
		if (connection) {
			await connection.invoke("SendMessage", whiteBoard, message, userName);
		}
	};

	// Rendering
	return (
		<div className="relative">
			{!connection && (
				<img src="/doodle.png" alt="background" className="background-img" />
			)}
			<main>
				{loading ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-white">Connecting to chat room...</p>
					</div>
				) : connection ? (
					<>
						{/* Calls till komponenter, med parametrar */}
						<WhiteBoard
							connection={connection}
							whiteBoard={whiteBoard}
							messages={messages}
							message={message}
							setMessage={setMessage}
							sendMessage={sendMessage}
							userName={userName}
							quitWhiteBoard={quitWhiteBoard}
						/>

						
					</>
				) : (
					<div className="flex items-center justify-center min-h-screen bg-gray-900">
						<div className="login-container">
							<h2 className="connect-to-whiteboard">Connect to Whiteboard</h2>
							<div className="rest-of-login-container">
										<label>Name:</label><br />
										<input type="text" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} className="namebox" />
								<br />
								<br />
								{/* Låter användaren välja chatroom med en dropdown-meny */}
								<label>Rooms:</label>
								<div className="whiteboard-buttons">
									{["1", "2", "3", "4", "5"].map((room) => (
										<button
											key={room}
											className={`whiteboard-button ${whiteBoard === room ? "selected" : ""}`}
											onClick={() => setWhiteBoard(room)}
										>
											{room}
										</button>
									))}
								</div>
								<br />

								{/* Knapp för att joina ett chatroom */}
										<button className="join-button" onClick={() => { const trimmedName = userName.trim();
												if (!trimmedName) {
													alert("Please enter a valid name (no empty or whitespace-only names).");
													return;
												}
												joinWhiteBoard(trimmedName, whiteBoard);
											}}
										>
											Join Chat Room
										</button>

							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
};

export default WhiteBoardHome;
