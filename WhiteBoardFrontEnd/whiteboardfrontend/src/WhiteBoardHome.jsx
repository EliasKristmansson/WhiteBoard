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
				if (!message) {
					console.log(user);
				} else {
					setMessages(prev => [...prev, { user, message }]);
				}
			});

			connection.onclose(() => {
				console.log("Connection closed");
			});
		}
	}, [connection]);

	// Sk�ter vad som h�nder n�r anv�ndare ansluter sig till chatt
	const joinWhiteBoard = async (userName, whiteBoard) => {
		setLoading(true);
		setMessages([]);

		console.log("Connecting to:", `${import.meta.env.VITE_API_BASE_URL}/whiteboard`);
		const connection = new HubConnectionBuilder()
			.withUrl(`${import.meta.env.VITE_API_BASE_URL}/whiteboard`)
			.configureLogging(LogLevel.Information)
			.build();

		setConnection(connection);

		try {
			await connection.start();
			await connection.invoke("JoinWhiteBoard", userName, whiteBoard);
			setLoading(false);
		} catch (error) {
			console.error("Error starting connection: ", error);
			setLoading(false);
		}
	};

	// St�nger av connectionen n�r anv�ndaren vill g� ur ett chatroom
	const quitWhiteBoard = async () => {
		setLoading(true);

		// Kollar s� att det finns en connection
		if (connection) {
			try {
				const userConnection = {
					UserName: userName,
					WhiteBoard: whiteBoard
				};

				await connection.invoke("QuitWhiteBoard", userConnection); // Invokar servermetod f�r att l�mna chatroom
				await connection.stop(); // St�nger av connection
				setLoading(false);
			} catch (error) {
				console.error("Error stopping connection: ", error);
				setLoading(false);
			}
			finally {
				setConnection(null);
				setUserName('');
				setWhiteBoard('1');
				setMessages([]);
				setLoading(false);
			}

		}
	};

	// Skickar ett meddelande, kallar p� SendMessage i backend
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
					<div>
						<p>Connecting to chat room...</p>
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
					<div>
						<div className="login-container">
							<h2 className="connect-to-whiteboard">Connect to Whiteboard</h2>
							<div className="rest-of-login-container">
								<label>Name:</label><br />
								<input type="text" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} className="namebox" />
								<br />
								<br />
								{/* L�ter anv�ndaren v�lja chatroom med en dropdown-meny */}
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

								{/* Knapp f�r att joina ett chatroom */}
								<button className="join-button" onClick={() => {
									const trimmedName = userName.trim();
									if (!trimmedName) {
										alert("Please enter a valid name (no empty or whitespace-only names).");
										return;
									}
									joinWhiteBoard(trimmedName, whiteBoard);
								}}
								>
									Join Whiteboard Room
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
