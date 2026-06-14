import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Relative paths to repository files
const DOCS_DIR = path.join(__dirname, "../docs/src/en/guide");
const APP_JSON_PATH = path.join(__dirname, "../app.json");

/**
 * Helper to dynamically load all markdown files from the docs folder
 */
function loadGuideDocuments() {
  const documents = new Map();
  try {
    if (fs.existsSync(DOCS_DIR)) {
      const files = fs.readdirSync(DOCS_DIR);
      for (const file of files) {
        if (file.endsWith(".md")) {
          const filePath = path.join(DOCS_DIR, file);
          const content = fs.readFileSync(filePath, "utf8");
          const name = file.replace(".md", "");
          documents.set(name, content);
        }
      }
    }
  } catch (err) {
    console.error("Error loading markdown guides:", err);
  }
  return documents;
}

/**
 * Helper to parse app.json flow cards
 */
function parseAppJson() {
  try {
    if (fs.existsSync(APP_JSON_PATH)) {
      const data = JSON.parse(fs.readFileSync(APP_JSON_PATH, "utf8"));
      const flow = data.flow || {};
      
      const formatCard = (card) => {
        const titleEn = card.title?.en || card.title || card.id;
        const titleNl = card.title?.nl || "";
        const hintEn = card.hint?.en || "";
        const hintNl = card.hint?.nl || "";
        
        return {
          id: card.id,
          title: { en: titleEn, nl: titleNl },
          hint: { en: hintEn, nl: hintNl },
          args: (card.args || []).map(a => ({
            name: a.name,
            type: a.type,
            title: a.title?.en || a.title?.nl || a.name
          }))
        };
      };

      return {
        triggers: (flow.triggers || []).map(formatCard),
        conditions: (flow.conditions || []).map(formatCard),
        actions: (flow.actions || []).map(formatCard),
      };
    }
  } catch (err) {
    console.error("Error parsing app.json:", err);
  }
  return { triggers: [], conditions: [], actions: [] };
}

// Create the MCP server
const server = new Server(
  {
    name: "flowbits-documentation-server",
    version: "1.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Register resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const guides = loadGuideDocuments();
  const resources = [
    {
      uri: "flowbits://app/manifest",
      name: "FlowBits App Manifest Info",
      mimeType: "application/json",
      description: "Available flow cards parsed directly from app.json",
    }
  ];

  for (const name of guides.keys()) {
    resources.push({
      uri: `flowbits://docs/guide/${name}`,
      name: `FlowBits Guide: ${name}`,
      mimeType: "text/markdown",
      description: `Documentation section for ${name}`,
    });
  }

  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri === "flowbits://app/manifest") {
    const cardInfo = parseAppJson();
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(cardInfo, null, 2),
        },
      ],
    };
  }

  if (uri.startsWith("flowbits://docs/guide/")) {
    const name = uri.replace("flowbits://docs/guide/", "");
    const guides = loadGuideDocuments();
    const content = guides.get(name);
    if (content) {
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  }

  throw new Error(`Resource not found: ${uri}`);
});

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_feature_guide",
        description: "Get the specific documentation/guide for a FlowBits feature (e.g. Flags, Modes, Sets, Timers, Step Sequences, Events, Labels, No-Repeat Windows, Sliders, Signals).",
        inputSchema: {
          type: "object",
          properties: {
            featureName: {
              type: "string",
              description: "The name of the FlowBits feature (e.g., 'flags', 'modes', 'timers', 'sets', 'step-sequences', 'events', 'labels', 'no-repeat-windows', 'sliders', 'signals')"
            }
          },
          required: ["featureName"],
        },
      },
      {
        name: "search_documentation",
        description: "Search the FlowBits documentation files and app manifest for keywords or card names.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query (e.g. 'timer_start', 'holiday', 'calculate percentage', 'flag_activate')"
            }
          },
          required: ["query"],
        },
      },
      {
        name: "list_flow_cards",
        description: "List all FlowBits trigger, condition, and action cards directly from the app.json manifest.",
        inputSchema: {
          type: "object",
          properties: {
            cardType: {
              type: "string",
              enum: ["triggers", "conditions", "actions", "all"],
              description: "The type of cards to list (default: 'all')"
            }
          }
        }
      },
      {
        name: "get_flow_template",
        description: "Retrieve recommended IDO (Input-Decision-Output) flow patterns and template logic using FlowBits.",
        inputSchema: {
          type: "object",
          properties: {
            patternName: {
              type: "string",
              enum: ["toilet_motion_timeout", "room_time_based_dimmer", "presence_tracking_set", "debounced_sensor"],
              description: "The name of the design pattern template to fetch"
            }
          },
          required: ["patternName"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "get_feature_guide": {
      const feature = String(request.params.arguments.featureName).toLowerCase().trim();
      const guides = loadGuideDocuments();
      
      // Try exact or alias mapping
      let targetKey = feature;
      if (feature.includes("cycle") || feature.includes("sequence")) targetKey = "step-sequences";
      if (feature.includes("no-repeat") || feature.includes("cooldown")) targetKey = "no-repeat-windows";
      if (feature.includes("miscellaneous") || feature.includes("math") || feature.includes("formula")) targetKey = "miscellaneous-cards";

      let content = guides.get(targetKey);
      
      // Try substring lookup if not found
      if (!content) {
        for (const [key, val] of guides.entries()) {
          if (key.includes(feature)) {
            content = val;
            targetKey = key;
            break;
          }
        }
      }

      if (content) {
        return {
          content: [
            {
              type: "text",
              text: `## Guide: ${targetKey}\n\n${content}`,
            },
          ],
        };
      } else {
        const available = Array.from(guides.keys()).map(k => `* ${k}`).join("\n");
        return {
          content: [
            {
              type: "text",
              text: `Guide for '${request.params.arguments.featureName}' not found. Available guides:\n${available}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "search_documentation": {
      const query = String(request.params.arguments.query).toLowerCase().trim();
      const guides = loadGuideDocuments();
      const results = [];

      // Search guides
      for (const [name, content] of guides.entries()) {
        if (content.toLowerCase().includes(query)) {
          results.push(`### Guide: ${name}\n\n${content.substring(0, 400)}...\n*(truncated, use get_feature_guide for full text)*`);
        }
      }

      // Search app.json
      const manifest = parseAppJson();
      const matchCards = (cards, typeName) => {
        cards.forEach(c => {
          if (c.id.toLowerCase().includes(query) || 
              c.title.en.toLowerCase().includes(query) || 
              c.title.nl.toLowerCase().includes(query) ||
              c.hint.en.toLowerCase().includes(query)) {
            results.push(`### App Card (${typeName}): ${c.title.en} (ID: ${c.id})\n- Description (EN): ${c.hint.en}\n- Description (NL): ${c.hint.nl}\n- Arguments: ${JSON.stringify(c.args)}`);
          }
        });
      };
      matchCards(manifest.triggers, "Trigger");
      matchCards(manifest.conditions, "Condition");
      matchCards(manifest.actions, "Action");

      if (results.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `Matches found in repository:\n\n${results.join("\n\n---\n\n")}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `No matches found for query: '${request.params.arguments.query}'`,
            },
          ],
        };
      }
    }

    case "list_flow_cards": {
      const type = request.params.arguments.cardType || "all";
      const manifest = parseAppJson();
      let output = "";

      const formatList = (cards, header) => {
        if (cards.length === 0) return "";
        let str = `## ${header} Cards\n\n`;
        cards.forEach(c => {
          str += `* **${c.title.en}** (ID: \`${c.id}\`)\n`;
          if (c.title.nl) str += `  * NL: *${c.title.nl}*\n`;
          if (c.hint.en) str += `  * Hint: ${c.hint.en}\n`;
          if (c.args.length > 0) {
            str += `  * Arguments: ${c.args.map(a => `${a.name} (${a.type})`).join(", ")}\n`;
          }
        });
        return str + "\n";
      };

      if (type === "triggers" || type === "all") output += formatList(manifest.triggers, "Trigger");
      if (type === "conditions" || type === "all") output += formatList(manifest.conditions, "Condition");
      if (type === "actions" || type === "all") output += formatList(manifest.actions, "Action");

      return {
        content: [
          {
            type: "text",
            text: output || "No cards found.",
          },
        ],
      };
    }

    case "get_flow_template": {
      const pattern = request.params.arguments.patternName;
      let template = "";

      if (pattern === "toilet_motion_timeout") {
        template = `
### Pattern: Toilet Motion Timeout (IDO style)
This pattern is ideal for bathrooms and small areas where motion stops but the user is still present.

1. **INPUT - Sensor - Toilet beweging**
   - Trigger: Zone Toilet is active
   - Condition: Flag "beweging.toilet" is inactive (FlowBits)
   - Action: Activate flag "beweging.toilet" (FlowBits)
   - Action: Trigger flow "DECISION - Toilet - Verlichting"
   - OutputTrue: Start timer "toilet licht uit" for 60 seconds (FlowBits) (resets timer if motion repeats)

2. **INPUT - Timer - Toilet licht uit**
   - Trigger: Timer "toilet licht uit" finished (FlowBits)
   - Condition: Sensor PIR "alarm_motion" is active
     - IF true: Start timer "toilet licht uit" for 60 seconds (re-debounce)
     - IF false: Trigger flow "OUTPUT - Toilet - Licht uit"

3. **DECISION - Toilet - Verlichting**
   - Trigger: Triggered programmatically
   - Condition: Mode checks (determine dim value based on current time mode)
   - Action: Trigger flow "OUTPUT - Toilet - Licht aan" with variable "toilet.dim.waarde"

4. **OUTPUT - Toilet - Licht aan**
   - Action: Dim light to variable value

5. **OUTPUT - Toilet - Licht uit**
   - Action: Turn off light
   - Action: Deactivate flag "beweging.toilet"
`;
      } else if (pattern === "presence_tracking_set") {
        template = `
### Pattern: Multi-Room Presence Tracking with Sets
Manage home occupation using FlowBits Sets.

1. **INPUT - Sensor - [Room Name] beweging**
   - Trigger: Zone [Room] is active
   - Action: Activate state "[Room]" in set "Presence" (FlowBits)
   - Action: Trigger flow "DECISION - Huis - Bezetting"

2. **INPUT - Sensor - [Room Name] inactief**
   - Trigger: Zone [Room] is inactive for 5 minutes
   - Action: Deactivate state "[Room]" in set "Presence" (FlowBits)
   - Action: Trigger flow "DECISION - Huis - Bezetting"

3. **DECISION - Huis - Bezetting**
   - Trigger: Triggered programmatically
   - Logic:
     - Check: Set "Presence" is inactive (FlowBits)
       - IF active: stop "huis leeg" timer
       - IF inactive: start "huis leeg" timer for 2 minutes
`;
      } else {
        template = `Template logic for '${pattern}' is under development.`;
      }

      return {
        content: [
          {
            type: "text",
            text: template,
          },
        ],
      };
    }

    default:
      throw new Error(`Tool not found: ${request.params.name}`);
  }
});

// Run the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("FlowBits Documentation MCP Server running on stdio");
