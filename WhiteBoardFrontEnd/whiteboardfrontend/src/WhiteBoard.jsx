import React, { useRef, useEffect, useState } from 'react';
import "./whiteboard.css";
import {
	PenTool,
	PaintBucket,
	Square,
	Circle,
	Triangle,
	Eraser
} from 'lucide-react';
import ChatBox from './ChatBox';
import WhiteBoardBox from './WhiteBoardBox';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const WhiteBoard = ({
	connection,
	whiteBoard,
	messages,
	message,
	setMessage,
	sendMessage,
	userName,
	quitWhiteBoard }) => {
	const canvasRef = useRef(null);
	const contextRef = useRef(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [color, setColor] = useState('#000000');
	const [tool, setTool] = useState('pen');
	const startPos = useRef({ x: 0, y: 0 });
	const [brushSize, setBrushSize] = useState(5);


	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d", { willReadFrequently: true });
		contextRef.current = context;

		const setCanvasSize = () => {

			const width = canvas.clientWidth;
			const height = canvas.clientHeight;

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				return true;
			}

			return false;

		};

		setCanvasSize();
		window.addEventListener('resize', setCanvasSize);

		if (connection) {
			connection.on("ReceiveDrawData", (startX, startY, endX, endY, remoteColor) => {
				drawLine(startX, startY, endX, endY, remoteColor);
			});

			connection.on("ReceiveCanvasImage", (imageDataUrl) => {
				const img = new Image();
				img.onload = () => {
					const ctx = contextRef.current;
					ctx.setTransform(1, 0, 0, 1, 0, 0);
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				};
				img.src = imageDataUrl;
			});
		}

		return () => {
			window.removeEventListener('resize', setCanvasSize);
		};
	}, [connection]);

	const startDrawing = ({ nativeEvent }) => {
		const { offsetX, offsetY } = nativeEvent;
		startPos.current = { x: offsetX, y: offsetY };

		if (tool === 'bucket') {
			floodFill(Math.floor(offsetX), Math.floor(offsetY));
		} else {
			setIsDrawing(true);
		}
	};

	const finishDrawing = async ({ nativeEvent }) => {
		if (!isDrawing) return;
		setIsDrawing(false);

		const { offsetX, offsetY } = nativeEvent;

		if (tool === 'square') {
			drawSquare(startPos.current, { x: offsetX, y: offsetY }, color);
		} else if (tool === 'circle') {
			drawCircle(startPos.current, { x: offsetX, y: offsetY }, color);
		} else if (tool === 'triangle') {
			drawTriangle(startPos.current, { x: offsetX, y: offsetY }, color);
		} else {
			return;
		}

		if (connection) {
			try {
				const canvas = canvasRef.current;
				const imageDataUrl = canvas.toDataURL();
				await connection.invoke("SendCanvasImage", imageDataUrl);
			} catch (err) {
				console.error("Error sending canvas image:", err);
			}
		}
	};


	const draw = async ({ nativeEvent }) => {
		if (!isDrawing || (tool !== 'pen' && tool !== 'eraser')) return;

		const { offsetX, offsetY } = nativeEvent;
		const { x: lastX, y: lastY } = startPos.current;

		const drawColor = tool === 'eraser' ? '#ffffff' : color;

		drawLine(lastX, lastY, offsetX, offsetY, drawColor);
		startPos.current = { x: offsetX, y: offsetY };

		if (connection) {
			try {
				await connection.invoke("SendDrawData", lastX, lastY, offsetX, offsetY, drawColor);
			} catch (err) {
				console.error("Error sending draw data:", err);
			}
		}
	};


	const drawLine = (x1, y1, x2, y2, drawColor) => {
		const ctx = contextRef.current;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.strokeStyle = drawColor;
		ctx.lineWidth = brushSize;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.closePath();
	};


	const drawSquare = (start, end, drawColor) => {
		const ctx = contextRef.current;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.strokeStyle = drawColor;
		ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
	};

	const drawCircle = (start, end, drawColor) => {
		const ctx = contextRef.current;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
		ctx.beginPath();
		ctx.strokeStyle = drawColor;
		ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
		ctx.stroke();
	};

	const drawTriangle = (start, end, drawColor) => {
		const ctx = contextRef.current;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		const baseMidX = (start.x + end.x) / 2;
		ctx.beginPath();
		ctx.strokeStyle = drawColor;
		ctx.moveTo(baseMidX, start.y);
		ctx.lineTo(end.x, end.y);
		ctx.lineTo(start.x, end.y);
		ctx.closePath();
		ctx.stroke();
	};

	const floodFill = async (x, y) => {
		const canvas = canvasRef.current;
		const ctx = contextRef.current;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		const width = canvas.width;
		const height = canvas.height;
		const imageData = ctx.getImageData(0, 0, width, height);

		const targetColor = getColorAtPixel(imageData, x, y);
		const fillColor = hexToRgba(color);

		if (colorsMatch(targetColor, fillColor)) return;

		const pixelStack = [[x, y]];
		const visited = new Set();

		while (pixelStack.length) {
			const [px, py] = pixelStack.pop();
			if (px < 0 || py < 0 || px >= width || py >= height) continue;

			const key = `${px},${py}`;
			if (visited.has(key)) continue;
			visited.add(key);

			const currentColor = getColorAtPixel(imageData, px, py);
			if (!colorsMatch(currentColor, targetColor)) continue;

			setColorAtPixel(imageData, px, py, fillColor);

			pixelStack.push(
				[px + 1, py],
				[px - 1, py],
				[px, py + 1],
				[px, py - 1]
			);
		}

		ctx.putImageData(imageData, 0, 0);

		if (connection) {
			try {
				const imageDataUrl = canvas.toDataURL();
				await connection.invoke("SendCanvasImage", imageDataUrl);
			} catch (err) {
				console.error("Error sending canvas image:", err);
			}
		}
	};

	const getColorAtPixel = (imageData, x, y) => {
		const index = (y * imageData.width + x) * 4;
		return imageData.data.slice(index, index + 4);
	};

	const setColorAtPixel = (imageData, x, y, [r, g, b, a]) => {
		const index = (y * imageData.width + x) * 4;
		imageData.data[index] = r;
		imageData.data[index + 1] = g;
		imageData.data[index + 2] = b;
		imageData.data[index + 3] = a;
	};

	const colorsMatch = (a, b) => {
		return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
	};

	const hexToRgba = (hex) => {
		const bigint = parseInt(hex.slice(1), 16);
		return [
			(bigint >> 16) & 255,
			(bigint >> 8) & 255,
			bigint & 255,
			255
		];
	};

	return (
		<div className="whiteboard-container">
			<div className="tools-container">
				<div className="color-part">
					<label className="text-color">Color</label>
					<input className="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
				</div>
				<div className="brush-size">
					<label className="text-tools">Size: {brushSize}</label>
					<input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />

				</div>


				<div className="tools">
					<label className="text-tools">Tools</label>
					<button onClick={() => setTool('pen')} className={tool === 'pen' ? 'icon-btn active' : 'icon-btn'}>
						<PenTool />
					</button>
					<button
						onClick={() => setTool('eraser')} className={tool === 'eraser' ? 'icon-btn active' : 'icon-btn'}>
						<Eraser />
					</button>
					<button onClick={() => setTool('bucket')} className={tool === 'bucket' ? 'icon-btn active' : 'icon-btn'}>
						<PaintBucket />
					</button>
					<button onClick={() => setTool('square')} className={tool === 'square' ? 'icon-btn active' : 'icon-btn'}>
						<Square />
					</button>
					<button onClick={() => setTool('circle')} className={tool === 'circle' ? 'icon-btn active' : 'icon-btn'}>
						<Circle />
					</button>
					<button onClick={() => setTool('triangle')} className={tool === 'triangle' ? 'icon-btn active' : 'icon-btn'}>
						<Triangle />
					</button>

				</div>
				<div className="spacer" />
				<WhiteBoardBox quitWhiteBoard={quitWhiteBoard} />
			</div>
			<div className="main-area">
				<div className="canvas-container">
					<canvas
						style={{ width: "100%" }}
						className="board"
						ref={canvasRef}
						onMouseDown={startDrawing}
						onMouseUp={finishDrawing}
						onMouseMove={draw}
						onMouseLeave={() => setIsDrawing(false)}
					/>
				</div>
				<div className="chat-container">
					<ChatBox
						messages={messages}
						message={message}
						setMessage={setMessage}
						sendMessage={sendMessage}
						userName={userName}
						whiteBoard={whiteBoard}
					/>
				</div>
			</div>
		</div>
	);
};

export default WhiteBoard;
