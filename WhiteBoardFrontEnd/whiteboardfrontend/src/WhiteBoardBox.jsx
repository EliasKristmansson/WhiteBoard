import React from 'react';
import "./App.css";

const WhiteBoardBox = ({quitWhiteBoard}) => {

	// Rendering
	return (
		<div>
			<div className="quitButtonContainer">

				{/* Knapp för att lämna chatroom */}
				<button
					onClick={() => quitWhiteBoard()}
					className="quitButton">
					Quit Whiteboard Room
				</button>
			</div>
		</div>
	);
};

export default WhiteBoardBox;
