import React from 'react';
import "./App.css";

const WhiteBoardBox = ({quitWhiteBoard}) => {

	// Rendering
	return (
		<div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600">
			<div className="quitButtonContainer">

				{/* Knapp för att lämna chatroom */}
				<button
					onClick={() => quitWhiteBoard()}
					className="quitButton">
					Quit Chat Room
				</button>
			</div>
		</div>
	);
};

export default WhiteBoardBox;
