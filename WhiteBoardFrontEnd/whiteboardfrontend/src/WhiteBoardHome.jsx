import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import WhiteBoard from './WhiteBoard';
import WhiteBoardBox from './WhiteBoardBox';

const WhiteBoardHome = () => {
	const [connection, setConnection] = useState(null);
	const [userName, setUserName] = useState('');
	const [whiteBoard, setWhiteBoard] = useState('1');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (connection) {
			connection.on("ReceiveMessage", (user, boardId) => {
				console.log(`Server confirmed ${user} is in whiteboard ${boardId}`);
				setWhiteBoard(boardId); // Only update if you trust the server to drive this
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
			.withUrl("https://localhost:7264/whiteboard")
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
	const sendMessage = async (message) => {
		if (connection) {
			await connection.invoke("SendMessage", chatRoom, userName, message);
		}
	};

	// Rendering
	return (
		<div className="flex flex-col h-screen bg-gray-900">
			<main className="container mx-auto flex-grow">
				{loading ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-white">Connecting to chat room...</p>
					</div>
				) : connection ? (
					<>
						{ /*<div className="text-center text-2xl text-white font-semibold py-2 bg-gray-800 shadow">
							{whiteBoard === "General" ? "General" : "Announcements"}
						</div>*/}

						{/* Calls till komponenter, med parametrar */}
						<WhiteBoard />
						<WhiteBoardBox quitWhiteBoard={quitWhiteBoard} />
					</>
				) : (
					<div className="flex items-center justify-center min-h-screen bg-gray-900">
						<div className="login-container">
							<h2 className="text-xl font-bold mb-4 text-center">Connect to Whiteboard</h2>
							<input type="text" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} />
							<br />
							<br />
							{/* Låter användaren välja chatroom med en dropdown-meny */}
							<select value={whiteBoard} onChange={(e) => setWhiteBoard(e.target.value)}>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
							</select>
							<br />
							<br />

							{/* Knapp för att joina ett chatroom */}
							<button onClick={() => joinWhiteBoard(userName, whiteBoard)}>Join Chat Room</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
};

export default WhiteBoardHome;
