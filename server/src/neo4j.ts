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

export interface QueryFilters {
  nodeTypes?: string[];
  nodeNames?: string[];
  relationshipTypes?: string[];
  centerNode?: string; // Name of node to center the query around
  depth?: number; // How many hops from center node (default 1)
}

export async function queryGraph(filters: QueryFilters): Promise<GraphData> {
  const session: Session = getDriver().session();

  try {
    let query: string;
    const params: Record<string, any> = {};

    if (filters.centerNode) {
      // Query centered around a specific node with depth traversal
      const depth = filters.depth || 1;
      const depthPattern = "*1.." + depth;
      query = `
        MATCH (center)
        WHERE toLower(center.name) CONTAINS toLower($centerNode)
           OR toLower(center.title) CONTAINS toLower($centerNode)
        OPTIONAL MATCH path = (center)-[r${depthPattern}]-(connected)
        WITH center, relationships(path) AS rels, nodes(path) AS pathNodes
        UNWIND (CASE WHEN pathNodes IS NULL THEN [center] ELSE pathNodes END) AS n
        RETURN DISTINCT n, rels
      `;
      params.centerNode = filters.centerNode;
    } else {
      // Build a filtered query
      const conditions: string[] = [];

      if (filters.nodeTypes && filters.nodeTypes.length > 0) {
        conditions.push("any(label IN labels(n) WHERE label IN $nodeTypes)");
        params.nodeTypes = filters.nodeTypes;
      }

      if (filters.nodeNames && filters.nodeNames.length > 0) {
        conditions.push(
          "(any(name IN $nodeNames WHERE toLower(n.name) CONTAINS toLower(name)) OR " +
            "any(name IN $nodeNames WHERE toLower(n.title) CONTAINS toLower(name)))",
        );
        params.nodeNames = filters.nodeNames;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      let relFilter = "";
      if (filters.relationshipTypes && filters.relationshipTypes.length > 0) {
        relFilter = `WHERE type(r) IN $relationshipTypes`;
        params.relationshipTypes = filters.relationshipTypes;
      }

      query = `
        MATCH (n)
        ${whereClause}
        OPTIONAL MATCH (n)-[r]-(m)
        ${relFilter}
        RETURN n, r, m
      `;
    }

    const result = await session.run(query, params);

    const nodesMap = new Map<string, GraphNode>();
    const edgesMap = new Map<string, GraphEdge>();

    for (const record of result.records) {
      for (const value of record.values()) {
        if (!value) continue;

        // Handle arrays (from path queries)
        if (Array.isArray(value)) {
          for (const item of value) {
            processValue(item, nodesMap, edgesMap);
          }
        } else {
          processValue(value, nodesMap, edgesMap);
        }
      }
    }

    // Filter edges to only include those between nodes in our result set
    const nodeIds = new Set(nodesMap.keys());
    const filteredEdges = Array.from(edgesMap.values()).filter(
      (edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to),
    );

    return {
      nodes: Array.from(nodesMap.values()),
      edges: filteredEdges,
    };
  } finally {
    await session.close();
  }
}

function processValue(
  value: any,
  nodesMap: Map<string, GraphNode>,
  edgesMap: Map<string, GraphEdge>,
): void {
  if (!value || typeof value !== "object") return;

  // Handle nodes
  if ("labels" in value && "properties" in value) {
    const node = value;
    const nodeId = node.elementId;
    if (!nodesMap.has(nodeId)) {
      nodesMap.set(nodeId, {
        id: nodeId,
        label: node.properties.name || node.properties.title || node.labels[0],
        type: node.labels[0],
        properties: { ...node.properties },
      });
    }
  }

  // Handle relationships
  if ("type" in value && "startNodeElementId" in value) {
    const rel = value;
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

// Get available node types and relationship types for UI/LLM hints
export async function getGraphSchema(): Promise<{
  nodeTypes: string[];
  relationshipTypes: string[];
}> {
  const session: Session = getDriver().session();

  try {
    const nodeTypesResult = await session.run("CALL db.labels()");
    const relTypesResult = await session.run("CALL db.relationshipTypes()");

    return {
      nodeTypes: nodeTypesResult.records.map((r) => r.get(0) as string),
      relationshipTypes: relTypesResult.records.map((r) => r.get(0) as string),
    };
  } finally {
    await session.close();
  }
}
