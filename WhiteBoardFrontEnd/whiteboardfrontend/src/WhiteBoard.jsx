import React, { useRef, useEffect, useState } from 'react';

const WhiteBoard = ({ connection, whiteBoard }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.6;
        canvas.style.border = "2px solid black";
        canvas.style.backgroundColor = "white";

        const context = canvas.getContext("2d");
        context.lineCap = "round";
        context.strokeStyle = "black";
        context.lineWidth = 3;
        contextRef.current = context;

        if (connection) {
            connection.on("ReceiveDrawData", (startX, startY, endX, endY) => {
                drawLine(startX, startY, endX, endY, false);
            });
        }
    }, [connection]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        lastPos.current = { x: offsetX, y: offsetY };
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        setIsDrawing(false);
    };

    const draw = async ({ nativeEvent }) => {
        if (!isDrawing) return;

        const { offsetX, offsetY } = nativeEvent;
        const { x: lastX, y: lastY } = lastPos.current;

        drawLine(lastX, lastY, offsetX, offsetY, true);

        lastPos.current = { x: offsetX, y: offsetY };

        if (connection) {
            try {
                await connection.invoke("SendDrawData", lastX, lastY, offsetX, offsetY);
            } catch (err) {
                console.error("Error sending draw data:", err);
            }
        }
    };

    const drawLine = (x1, y1, x2, y2, isLocal) => {
        const ctx = contextRef.current;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    };

    return (
        <div className="whiteBoard">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
            />
        </div>
    );
};

export default WhiteBoard;
