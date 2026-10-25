import { useRef } from "react";
import useCanvasCursor from "../hooks/use-canvasCursor";
import "./CanvasCursor.css";

const CanvasCursor = () => {
  const canvasRef = useRef(null);
  useCanvasCursor(canvasRef);

  return <canvas ref={canvasRef} aria-hidden="true" className="canvas-cursor" />;
};

export default CanvasCursor;
