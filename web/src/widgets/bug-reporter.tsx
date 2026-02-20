import "@/index.css";
import { useRef, useState } from "react";
import { mountWidget, useLayout } from "skybridge/web";
import { useCallTool } from "../helpers";

type CaptureState = "idle" | "capturing" | "captured" | "sending" | "sent";

function BugReporter() {
  const { theme } = useLayout();
  const isDark = theme === "dark";
  const { callToolAsync } = useCallTool("bug-reporter");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<CaptureState>("idle");
  const [imageData, setImageData] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const captureScreen = async () => {
    try {
      setState("capturing");
      setError(null);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "window" } as any,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Wait a frame for video to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(video, 0, 0);

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());

      // Get base64 image
      const dataUrl = canvas.toDataURL("image/png");
      setImageData(dataUrl);
      setState("captured");
    } catch (err) {
      setError(`Capture failed: ${err}`);
      setState("idle");
    }
  };

  const sendToAnalyze = async () => {
    if (!imageData) return;

    setState("sending");
    try {
      await callToolAsync({
        action: "analyze",
        image: imageData,
        description:
          description ||
          "Please analyze this screenshot and identify any UI bugs or issues.",
      });
      setState("sent");
    } catch (err) {
      setError(`Failed to send: ${err}`);
      setState("captured");
    }
  };

  const reset = () => {
    setState("idle");
    setImageData(null);
    setDescription("");
    setError(null);
  };

  const styles = {
    container: {
      padding: 20,
      background: isDark ? "#1a1a1a" : "#fff",
      color: isDark ? "#fff" : "#000",
      borderRadius: 12,
      fontFamily: "system-ui, sans-serif",
      maxWidth: 600,
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    title: {
      margin: 0,
      fontSize: 20,
      fontWeight: 600,
    },
    button: {
      padding: "12px 24px",
      fontSize: 16,
      cursor: "pointer",
      border: "none",
      borderRadius: 8,
      fontWeight: 500,
      transition: "all 0.2s",
    },
    primaryBtn: {
      background: "#3b82f6",
      color: "#fff",
    },
    secondaryBtn: {
      background: isDark ? "#333" : "#e5e7eb",
      color: isDark ? "#fff" : "#000",
    },
    dangerBtn: {
      background: "#ef4444",
      color: "#fff",
    },
    successBtn: {
      background: "#22c55e",
      color: "#fff",
    },
    preview: {
      marginTop: 16,
      border: `2px solid ${isDark ? "#333" : "#e5e7eb"}`,
      borderRadius: 8,
      overflow: "hidden",
    },
    previewImage: {
      width: "100%",
      display: "block",
    },
    textarea: {
      width: "100%",
      padding: 12,
      fontSize: 14,
      border: `1px solid ${isDark ? "#444" : "#ddd"}`,
      borderRadius: 8,
      background: isDark ? "#2a2a2a" : "#fff",
      color: isDark ? "#fff" : "#000",
      resize: "vertical" as const,
      minHeight: 80,
      marginTop: 12,
      boxSizing: "border-box" as const,
    },
    error: {
      color: "#ef4444",
      marginTop: 12,
      padding: 12,
      background: isDark ? "#2a1a1a" : "#fef2f2",
      borderRadius: 8,
    },
    instructions: {
      color: isDark ? "#aaa" : "#666",
      fontSize: 14,
      marginBottom: 16,
    },
    buttonGroup: {
      display: "flex",
      gap: 12,
      marginTop: 16,
    },
    successMessage: {
      textAlign: "center" as const,
      padding: 20,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ fontSize: 24 }}>🐛</span>
        <h2 style={styles.title}>Bug Reporter</h2>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {state === "idle" && (
        <>
          <p style={styles.instructions}>
            Capture a screenshot of the bug you're seeing. Claude will analyze
            it and help you debug.
          </p>
          <button
            onClick={captureScreen}
            style={{ ...styles.button, ...styles.primaryBtn }}
          >
            📸 Capture Screen
          </button>
        </>
      )}

      {state === "capturing" && <p>Select a window or screen to capture...</p>}

      {(state === "captured" || state === "sending") && imageData && (
        <>
          <div style={styles.preview}>
            <img
              src={imageData}
              alt="Captured screenshot"
              style={styles.previewImage}
            />
          </div>

          <textarea
            style={styles.textarea}
            placeholder="Describe the bug (optional)... e.g., 'The button should be blue but it's showing as red'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={state === "sending"}
          />

          <div style={styles.buttonGroup}>
            <button
              onClick={sendToAnalyze}
              disabled={state === "sending"}
              style={{
                ...styles.button,
                ...styles.successBtn,
                opacity: state === "sending" ? 0.7 : 1,
              }}
            >
              {state === "sending" ? "Sending..." : "🔍 Send to Claude"}
            </button>
            <button
              onClick={captureScreen}
              disabled={state === "sending"}
              style={{ ...styles.button, ...styles.secondaryBtn }}
            >
              📸 Recapture
            </button>
            <button
              onClick={reset}
              disabled={state === "sending"}
              style={{ ...styles.button, ...styles.dangerBtn }}
            >
              ✕ Cancel
            </button>
          </div>
        </>
      )}

      {state === "sent" && (
        <div style={styles.successMessage}>
          <p style={{ fontSize: 48, margin: 0 }}>✅</p>
          <p>Screenshot sent! Check Claude's response above.</p>
          <button
            onClick={reset}
            style={{ ...styles.button, ...styles.primaryBtn, marginTop: 12 }}
          >
            Capture Another
          </button>
        </div>
      )}

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

mountWidget(<BugReporter />);
