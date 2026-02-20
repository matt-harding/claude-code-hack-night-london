import { McpServer } from "skybridge/server";
import { z } from "zod";
import { env } from "./env.js";
import { executeActions, fetchTasks } from "./supabase.js";
import { fetchFullGraph, queryGraph } from "./neo4j.js";

const SERVER_URL = "http://localhost:3000";

const ActionSchema = z.object({
  type: z.enum(["add", "delete", "toggle", "move"]),
  title: z.string().optional().describe("Task title (required for add)"),
  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Task priority"),
  dueDate: z.string().optional().describe("Due date (ISO string)"),
  taskId: z
    .string()
    .optional()
    .describe("Task ID (required for delete/toggle/move)"),
  status: z
    .enum(["todo", "in_progress", "done"])
    .optional()
    .describe("Target status (required for move)"),
});

const server = new McpServer(
  { name: "todo-app", version: "0.0.1" },
  { capabilities: {} },
)
  .registerWidget(
    "manage-tasks",
    {
      description: "View and manage your to-do list",
      _meta: {
        ui: {
          csp: {
            resourceDomains: ["https://fonts.googleapis.com"],
            connectDomains: [env.SUPABASE_URL],
          },
        },
      },
    },
    {
      description:
        "Call with no arguments to display the user's task board. Pass an `actions` array to add, move, or delete tasks — all actions are applied before returning the updated list.",
      inputSchema: {
        actions: z
          .array(ActionSchema)
          .optional()
          .describe("Actions to perform before returning the task list"),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ actions }, extra) => {
      const nodeEnv = process.env.NODE_ENV || "development";
      let userId = (extra.authInfo?.extra as any)?.userId as string | undefined;

      // In development, use a test user if not authenticated
      if (!userId && nodeEnv !== "production") {
        userId = "dev-user";
      }

      if (!userId) {
        return {
          content: [
            { type: "text", text: "Please sign in to manage your tasks." },
          ],
          isError: true,
          _meta: {
            "mcp/www_authenticate": [
              `Bearer resource_metadata="${SERVER_URL}/.well-known/oauth-protected-resource/mcp"`,
            ],
          },
        };
      }

      if (actions && actions.length > 0) {
        await executeActions(userId, actions);
      }

      const { tasks, error } = await fetchTasks(userId);

      if (error) {
        return {
          content: [
            { type: "text", text: `Error fetching tasks: ${error.message}` },
          ],
          isError: true,
        };
      }

      const todo = tasks.filter((t) => t.status === "todo").length;
      const inProgress = tasks.filter((t) => t.status === "in_progress").length;
      const done = tasks.filter((t) => t.status === "done").length;

      return {
        structuredContent: { tasks },
        content: [
          {
            type: "text",
            text: `${todo} todo, ${inProgress} in progress, ${done} done. ${tasks.length} total tasks.`,
          },
        ],
      };
    },
  )
  .registerWidget(
    "knowledge-graph",
    {
      description:
        "Visualize the complete Lord of the Rings knowledge graph with all characters, locations, items, and events",
    },
    {
      description: `Display the FULL Lord of the Rings knowledge graph visualization.

This knowledge graph contains:
- 24 Characters: Frodo, Sam, Gandalf, Aragorn, Legolas, Gimli, Boromir, Gollum, Sauron, Saruman, and more
- 12 Locations: The Shire, Rivendell, Mordor, Rohan, Gondor, Minas Tirith, Helm's Deep, etc.
- 7 Races: Hobbit, Human, Elf, Dwarf, Wizard, Orc, Ent
- 7 Items: The One Ring, Sting, Andúril, Glamdring, Mithril Coat, Palantír, Phial of Galadriel
- 6 Events: Council of Elrond, Battle of Moria, Battle of Helm's Deep, Battle of Pelennor Fields, etc.

Relationships include: family ties (FATHER_OF, BROTHER_OF), friendships (FRIENDS_WITH, ALLY_OF), enemies (ENEMY_OF, SERVES), romance (LOVES), mentorship (MENTORS), item ownership (WIELDS, CARRIES), and battle participation (FOUGHT_IN, DIED_IN).

USE THIS TOOL WHEN:
- User wants to see the entire LOTR universe
- User asks "show me the knowledge graph"
- User wants an overview of all characters and relationships
- User is exploring without a specific focus

For focused queries about specific characters or relationships, use query-graph instead.`,
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      try {
        const graphData = await fetchFullGraph();

        const nodeCount = graphData.nodes.length;
        const edgeCount = graphData.edges.length;

        // Group nodes by type for summary
        const nodeTypes: Record<string, number> = {};
        for (const node of graphData.nodes) {
          nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
        }

        const typeSummary = Object.entries(nodeTypes)
          .map(([type, count]) => `${count} ${type}`)
          .join(", ");

        return {
          structuredContent: graphData,
          content: [
            {
              type: "text",
              text: `Knowledge Graph loaded: ${nodeCount} nodes (${typeSummary}), ${edgeCount} relationships.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error loading knowledge graph: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  )
  .registerWidget(
    "query-graph",
    {
      description:
        "Query specific parts of the Lord of the Rings knowledge graph - filter by character, location, or relationship type",
    },
    {
      description: `Query a FILTERED subset of the Lord of the Rings knowledge graph.

USE THIS TOOL WHEN:
- User asks about a SPECIFIC character: "Show me Frodo's relationships" → centerNode: "Frodo"
- User asks about character connections: "Who are Gandalf's allies?" → centerNode: "Gandalf", relationshipTypes: ["ALLY_OF", "FRIENDS_WITH"]
- User asks about a group: "Show me all the hobbits" → nodeTypes: ["Character"], nodeNames: ["Frodo", "Sam", "Merry", "Pippin", "Bilbo"]
- User asks about locations: "What's in Mordor?" → centerNode: "Mordor", depth: 2
- User asks about items: "Who has the One Ring?" → centerNode: "One Ring"
- User asks about battles: "Who fought at Helm's Deep?" → centerNode: "Helm's Deep", relationshipTypes: ["FOUGHT_IN"]
- User asks about family: "Show me Elrond's family" → centerNode: "Elrond", relationshipTypes: ["FATHER_OF"]

EXAMPLE QUERIES:
- Fellowship members: centerNode: "Council of Elrond", relationshipTypes: ["MEMBER_OF"]
- Frodo's journey companions: centerNode: "Frodo", depth: 1
- All villains: nodeNames: ["Sauron", "Saruman", "Gollum", "Witch-king"]
- Romance in LOTR: relationshipTypes: ["LOVES"]

NODE TYPES: Character, Location, Race, Item, Event
RELATIONSHIP TYPES: IS_A, LIVES_IN, RULES, MEMBER_OF, FATHER_OF, BROTHER_OF, UNCLE_OF, ADOPTED, LOVES, FRIENDS_WITH, MENTORS, ALLY_OF, ENEMY_OF, SERVES, CORRUPTED_BY, WIELDS, CARRIES, WEARS, FOUND, GAVE, CREATED, FOUGHT_IN, DIED_IN, KILLED, PROTECTS, CONTROLS, CAUSED, CAPITAL_OF, PART_OF, HIDDEN_IN`,
      inputSchema: {
        centerNode: z
          .string()
          .optional()
          .describe(
            "Name of a character/location/item to center the graph around (e.g., 'Frodo', 'Gandalf', 'The Shire')",
          ),
        depth: z
          .number()
          .optional()
          .describe(
            "How many relationship hops from the center node (1-3, default 1)",
          ),
        nodeTypes: z
          .array(z.enum(["Character", "Location", "Race", "Item", "Event"]))
          .optional()
          .describe("Filter to only show these node types"),
        nodeNames: z
          .array(z.string())
          .optional()
          .describe("Filter to nodes whose names contain these strings"),
        relationshipTypes: z
          .array(z.string())
          .optional()
          .describe("Filter to only show these relationship types"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async ({ centerNode, depth, nodeTypes, nodeNames, relationshipTypes }) => {
      try {
        const graphData = await queryGraph({
          centerNode,
          depth: depth ? Math.min(Math.max(depth, 1), 3) : 1,
          nodeTypes,
          nodeNames,
          relationshipTypes,
        });

        const nodeCount = graphData.nodes.length;
        const edgeCount = graphData.edges.length;

        if (nodeCount === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No nodes found matching the query. Try different filters.",
              },
            ],
          };
        }

        // Build description of what was queried
        const queryDesc: string[] = [];
        if (centerNode) queryDesc.push(`centered on "${centerNode}"`);
        if (nodeTypes?.length) queryDesc.push(`types: ${nodeTypes.join(", ")}`);
        if (relationshipTypes?.length)
          queryDesc.push(`relationships: ${relationshipTypes.join(", ")}`);
        const queryInfo =
          queryDesc.length > 0 ? ` (${queryDesc.join("; ")})` : "";

        // Group nodes by type for summary
        const types: Record<string, number> = {};
        for (const node of graphData.nodes) {
          types[node.type] = (types[node.type] || 0) + 1;
        }
        const typeSummary = Object.entries(types)
          .map(([type, count]) => `${count} ${type}`)
          .join(", ");

        return {
          structuredContent: graphData,
          content: [
            {
              type: "text",
              text: `Subgraph${queryInfo}: ${nodeCount} nodes (${typeSummary}), ${edgeCount} relationships.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error querying graph: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

export default server;
export type AppType = typeof server;
