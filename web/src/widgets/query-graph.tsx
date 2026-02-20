import "@/index.css";
import { useEffect, useRef, useState } from "react";
import { mountWidget, useLayout, useDisplayMode } from "skybridge/web";
import { useToolInfo } from "../helpers";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Network, type Options } from "vis-network";
import { DataSet } from "vis-data";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Color palette for different node types
const nodeColors: Record<string, { background: string; border: string }> = {
  Character: { background: "#60a5fa", border: "#3b82f6" },
  Location: { background: "#34d399", border: "#10b981" },
  Race: { background: "#f472b6", border: "#ec4899" },
  Item: { background: "#fbbf24", border: "#f59e0b" },
  Event: { background: "#a78bfa", border: "#8b5cf6" },
};

const defaultColor = { background: "#9ca3af", border: "#6b7280" };

function QueryGraph() {
  const { input, output, isPending } = useToolInfo<"query-graph">();
  const { theme } = useLayout();
  const isDark = theme === "dark";
  const [displayMode, requestDisplayMode] = useDisplayMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDataRef = useRef<DataSet<any> | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const outputRef = useRef<GraphData | null>(null);

  // Store output in ref to avoid re-initialization on re-renders
  if (output && !outputRef.current) {
    outputRef.current = output as GraphData;
  }

  // Initialize network only once when output is available
  useEffect(() => {
    if (!containerRef.current || !outputRef.current) return;
    // Skip if already initialized
    if (networkRef.current) return;

    const graphData = outputRef.current;
    if (!graphData.nodes || !graphData.edges) return;

    setStats({ nodes: graphData.nodes.length, edges: graphData.edges.length });

    // Create vis-network compatible data
    const nodes = new DataSet(
      graphData.nodes.map((node) => {
        const color = nodeColors[node.type] || defaultColor;
        return {
          id: node.id,
          label: node.label,
          title: `${node.type}: ${node.label}`,
          color: {
            background: color.background,
            border: color.border,
            highlight: {
              background: color.background,
              border: "#fff",
            },
          },
          font: {
            color: isDark ? "#fff" : "#1f2937",
            size: 12,
          },
          // Store original data for selection
          _data: node,
        };
      }),
    );

    nodesDataRef.current = nodes;

    const edges = new DataSet(
      graphData.edges.map((edge) => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        arrows: "to",
        font: {
          color: isDark ? "#9ca3af" : "#6b7280",
          size: 10,
          strokeWidth: 0,
          background: isDark ? "#1f2937" : "#fff",
        },
        color: {
          color: isDark ? "#4b5563" : "#d1d5db",
          highlight: "#60a5fa",
        },
      })),
    );

    const options: Options = {
      nodes: {
        shape: "dot",
        size: 16,
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        width: 1,
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.5,
        },
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
        },
        stabilization: {
          enabled: true,
          iterations: 200,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
      },
      layout: {
        improvedLayout: true,
      },
    };

    // Create network
    const network = new Network(
      containerRef.current,
      { nodes, edges },
      options,
    );

    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeData = nodesDataRef.current?.get(nodeId) as any;
        if (nodeData?._data) {
          setSelectedNode(nodeData._data);
        }
      } else {
        setSelectedNode(null);
      }
    });

    networkRef.current = network;

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [output]);

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.3 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale / 1.3 });
    }
  };

  const handleReset = () => {
    if (networkRef.current) {
      networkRef.current.fit();
    }
  };

  // Build query description for the header
  const getQueryTitle = () => {
    if (!input) return "Graph Query";
    const parts: string[] = [];
    if (input.centerNode) parts.push(`"${input.centerNode}"`);
    if (input.nodeTypes?.length) parts.push(input.nodeTypes.join(", "));
    if (parts.length > 0) return parts.join(" · ");
    return "Graph Query";
  };

  if (isPending) {
    return (
      <div className={`kg-container ${isDark ? "dark" : "light"}`}>
        <div className="kg-loading">
          <div className="kg-spinner" />
          <p>Querying knowledge graph...</p>
        </div>
      </div>
    );
  }

  const isFullscreen = displayMode === "fullscreen";

  return (
    <div
      className={`kg-container ${isDark ? "dark" : "light"} ${isFullscreen ? "fullscreen" : ""}`}
    >
      <style>{`
        .kg-container {
          font-family: system-ui, -apple-system, sans-serif;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          height: 500px;
          display: flex;
          flex-direction: column;
        }
        .kg-container.dark {
          background: #1f2937;
          color: #f9fafb;
        }
        .kg-container.fullscreen {
          height: 100vh;
          border-radius: 0;
        }
        .kg-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .dark .kg-header {
          border-bottom-color: #374151;
        }
        .kg-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 16px;
        }
        .kg-query-badge {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .dark .kg-query-badge {
          background: #1e3a5f;
          color: #93c5fd;
        }
        .kg-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }
        .dark .kg-stats {
          color: #9ca3af;
        }
        .kg-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kg-stat-value {
          font-weight: 600;
          color: #3b82f6;
        }
        .kg-controls {
          display: flex;
          gap: 4px;
        }
        .kg-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: #f3f4f6;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
        }
        .dark .kg-btn {
          background: #374151;
          color: #e5e7eb;
        }
        .kg-btn:hover {
          background: #e5e7eb;
        }
        .dark .kg-btn:hover {
          background: #4b5563;
        }
        .kg-content {
          flex: 1;
          display: flex;
          position: relative;
        }
        .kg-graph {
          flex: 1;
          min-height: 400px;
        }
        .kg-sidebar {
          width: 280px;
          border-left: 1px solid #e5e7eb;
          padding: 16px;
          overflow-y: auto;
        }
        .dark .kg-sidebar {
          border-left-color: #374151;
        }
        .kg-sidebar-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #6b7280;
        }
        .dark .kg-sidebar-title {
          color: #9ca3af;
        }
        .kg-node-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .kg-node-type {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 12px;
        }
        .kg-props {
          font-size: 13px;
        }
        .kg-prop {
          display: flex;
          padding: 6px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .dark .kg-prop {
          border-bottom-color: #374151;
        }
        .kg-prop-key {
          width: 80px;
          flex-shrink: 0;
          color: #6b7280;
        }
        .dark .kg-prop-key {
          color: #9ca3af;
        }
        .kg-prop-value {
          flex: 1;
          word-break: break-word;
        }
        .kg-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 11px;
        }
        .dark .kg-legend {
          border-top-color: #374151;
        }
        .kg-legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kg-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .kg-loading {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #6b7280;
        }
        .kg-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="kg-header">
        <div className="kg-title">
          <span>🔍</span>
          <span>Knowledge Graph</span>
          <span className="kg-query-badge">{getQueryTitle()}</span>
        </div>
        <div className="kg-stats">
          <span className="kg-stat">
            <span className="kg-stat-value">{stats.nodes}</span> nodes
          </span>
          <span className="kg-stat">
            <span className="kg-stat-value">{stats.edges}</span> relationships
          </span>
        </div>
        <div className="kg-controls">
          <button className="kg-btn" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button className="kg-btn" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <button className="kg-btn" onClick={handleReset} title="Reset view">
            <RotateCcw size={16} />
          </button>
          <button
            className="kg-btn"
            onClick={() =>
              requestDisplayMode(isFullscreen ? "inline" : "fullscreen")
            }
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="kg-content">
        <div className="kg-graph" ref={containerRef} />
        {selectedNode && (
          <div className="kg-sidebar">
            <div className="kg-sidebar-title">SELECTED NODE</div>
            <div className="kg-node-name">{selectedNode.label}</div>
            <div
              className="kg-node-type"
              style={{
                background:
                  (nodeColors[selectedNode.type] || defaultColor).background +
                  "33",
                color: (nodeColors[selectedNode.type] || defaultColor).border,
              }}
            >
              {selectedNode.type}
            </div>
            <div className="kg-props">
              {Object.entries(selectedNode.properties)
                .filter(([key]) => key !== "name" && key !== "title")
                .map(([key, value]) => (
                  <div key={key} className="kg-prop">
                    <span className="kg-prop-key">{key}</span>
                    <span className="kg-prop-value">{String(value)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="kg-legend">
        {Object.entries(nodeColors).map(([type, colors]) => (
          <div key={type} className="kg-legend-item">
            <div
              className="kg-legend-dot"
              style={{ background: colors.background }}
            />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

mountWidget(<QueryGraph />);
