import React from 'react';

const WhiteBoardBox = ({quitWhiteBoard}) => {

	// Rendering
	return (
		<div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600">
			<div className="flex items-end space-x-2">

				{/* Knapp för att lämna chatroom */}
				<button
					onClick={() => quitWhiteBoard()}
					className="px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600">
					Quit Chat Room
				</button>
			</div>
		</div>
	);
};

export default WhiteBoardBox;
