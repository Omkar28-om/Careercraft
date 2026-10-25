import useCanvasCursor from "../hooks/useCanvasCursor";

export default function CanvasCursor() {
  useCanvasCursor();

  return (
    <canvas
      id="canvas"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
