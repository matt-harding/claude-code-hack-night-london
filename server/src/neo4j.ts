import neo4j, { Driver, Session } from "neo4j-driver";

const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password123";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    );
  }
  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function fetchFullGraph(): Promise<GraphData> {
  const session: Session = getDriver().session();

  try {
    // Fetch all nodes and relationships
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
    `);

    const nodesMap = new Map<string, GraphNode>();
    const edgesMap = new Map<string, GraphEdge>();

    for (const record of result.records) {
      const n = record.get("n");
      const r = record.get("r");
      const m = record.get("m");

      // Add source node
      if (n) {
        const nodeId = n.elementId;
        if (!nodesMap.has(nodeId)) {
          nodesMap.set(nodeId, {
            id: nodeId,
            label: n.properties.name || n.properties.title || n.labels[0],
            type: n.labels[0],
            properties: { ...n.properties },
          });
        }
      }

      // Add target node
      if (m) {
        const nodeId = m.elementId;
        if (!nodesMap.has(nodeId)) {
          nodesMap.set(nodeId, {
            id: nodeId,
            label: m.properties.name || m.properties.title || m.labels[0],
            type: m.labels[0],
            properties: { ...m.properties },
          });
        }
      }

      // Add relationship
      if (r) {
        const edgeId = r.elementId;
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            from: r.startNodeElementId,
            to: r.endNodeElementId,
            label: r.type,
            properties: { ...r.properties },
          });
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
    };
  } finally {
    await session.close();
  }
}

export async function runCypherQuery(query: string): Promise<GraphData> {
  const session: Session = getDriver().session();

  try {
    const result = await session.run(query);

    const nodesMap = new Map<string, GraphNode>();
    const edgesMap = new Map<string, GraphEdge>();

    for (const record of result.records) {
      for (const value of record.values()) {
        // Handle nodes
        if (value && typeof value === "object" && "labels" in value) {
          const node = value as any;
          const nodeId = node.elementId;
          if (!nodesMap.has(nodeId)) {
            nodesMap.set(nodeId, {
              id: nodeId,
              label:
                node.properties.name || node.properties.title || node.labels[0],
              type: node.labels[0],
              properties: { ...node.properties },
            });
          }
        }
        // Handle relationships
        if (
          value &&
          typeof value === "object" &&
          "type" in value &&
          "startNodeElementId" in value
        ) {
          const rel = value as any;
          const edgeId = rel.elementId;
          if (!edgesMap.has(edgeId)) {
            edgesMap.set(edgeId, {
              id: edgeId,
              from: rel.startNodeElementId,
              to: rel.endNodeElementId,
              label: rel.type,
              properties: { ...rel.properties },
            });
          }
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
    };
  } finally {
    await session.close();
  }
}
