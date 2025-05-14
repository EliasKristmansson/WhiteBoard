import React, { useRef, useEffect, useState } from 'react';
import "./whiteboard.css";

const WhiteBoard = ({ connection, whiteBoard }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [tool, setTool] = useState('pen'); // pen, bucket, square, circle, triangle
    const startPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const context = canvas.getContext("2d");
        context.scale(dpr, dpr);
        context.lineCap = "round";
        context.lineWidth = 3;
        contextRef.current = context;

        if (connection) {
            connection.on("ReceiveDrawData", (startX, startY, endX, endY, remoteColor) => {
                drawLine(startX, startY, endX, endY, remoteColor);
            });
        }
    }, [connection]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        const scale = window.devicePixelRatio || 1;
        startPos.current = { x: offsetX, y: offsetY };

        if (tool === 'bucket') {
            floodFill(Math.floor(offsetX * scale), Math.floor(offsetY * scale));
        } else {
            setIsDrawing(true);
        }
    };

    const finishDrawing = ({ nativeEvent }) => {
        if (!isDrawing) return;
        setIsDrawing(false);

        const { offsetX, offsetY } = nativeEvent;
        if (tool === 'square') {
            drawSquare(startPos.current, { x: offsetX, y: offsetY }, color);
        } else if (tool === 'circle') {
            drawCircle(startPos.current, { x: offsetX, y: offsetY }, color);
        } else if (tool === 'triangle') {
            drawTriangle(startPos.current, { x: offsetX, y: offsetY }, color);
        }
    };

    const draw = async ({ nativeEvent }) => {
        if (!isDrawing || tool !== 'pen') return;

        const { offsetX, offsetY } = nativeEvent;
        const { x: lastX, y: lastY } = startPos.current;

        drawLine(lastX, lastY, offsetX, offsetY, color);
        startPos.current = { x: offsetX, y: offsetY };

        if (connection) {
            try {
                await connection.invoke("SendDrawData", lastX, lastY, offsetX, offsetY, color);
            } catch (err) {
                console.error("Error sending draw data:", err);
            }
        }
    };

    const drawLine = (x1, y1, x2, y2, drawColor) => {
        const ctx = contextRef.current;
        ctx.strokeStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    };

    const drawSquare = (start, end, drawColor) => {
        const ctx = contextRef.current;
        ctx.strokeStyle = drawColor;
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    };

    const drawCircle = (start, end, drawColor) => {
        const ctx = contextRef.current;
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.strokeStyle = drawColor;
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
    };

    const drawTriangle = (start, end, drawColor) => {
        const ctx = contextRef.current;
        const baseMidX = (start.x + end.x) / 2;
        ctx.beginPath();
        ctx.strokeStyle = drawColor;
        ctx.moveTo(baseMidX, start.y); // top
        ctx.lineTo(end.x, end.y); // bottom right
        ctx.lineTo(start.x, end.y); // bottom left
        ctx.closePath();
        ctx.stroke();
    };

    const floodFill = (x, y) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
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

            // Boundary check
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
            <div className="left-panel">
                <div className="tools-container">
                    <label className="text-color">Color:</label>
                    <input className="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                    <label className="text-tools">Tool:</label>
                    <div className="tools">
                        <button onClick={() => setTool('pen')} className={tool === 'pen' ? 'active' : ''}>
                            Pen
                        </button>
                        <button onClick={() => setTool('bucket')} className={tool === 'bucket' ? 'active' : ''}>
                            Bucket
                        </button>
                        <button onClick={() => setTool('square')} className={tool === 'square' ? 'active' : ''}>
                            Square
                        </button>
                        <button onClick={() => setTool('circle')} className={tool === 'circle' ? 'active' : ''}>
                            Circle
                        </button>
                        <button onClick={() => setTool('triangle')} className={tool === 'triangle' ? 'active' : ''}>
                            Triangle
                        </button>
                    </div>

                </div>
                <canvas className="board"
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={draw}
                    onMouseLeave={() => setIsDrawing(false)}
                />
            </div>
    );
};

export default WhiteBoard;
