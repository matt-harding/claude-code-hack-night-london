import "@/index.css";
import { useRef, useState } from "react";
import { mountWidget, useLayout } from "skybridge/web";

function WebcamTest() {
  const { theme } = useLayout();
  const isDark = theme === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch (err) {
      setError(`Camera error: ${err}`);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: isDark ? "#1a1a1a" : "#fff",
        color: isDark ? "#fff" : "#000",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <h2>📷 Webcam Test</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 8,
          background: "#000",
          display: streaming ? "block" : "none",
          margin: "0 auto",
        }}
      />

      {!streaming && !error && <p>Click the button to start your webcam</p>}

      <div style={{ marginTop: 16 }}>
        {!streaming ? (
          <button
            onClick={startWebcam}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              cursor: "pointer",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            Start Webcam
          </button>
        ) : (
          <button
            onClick={stopWebcam}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              cursor: "pointer",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            Stop Webcam
          </button>
        )}
      </div>
    </div>
  );
}

mountWidget(<WebcamTest />);
