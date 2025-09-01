import { NodeRegistry } from "../NodeRegistry";
import {
  BaseNode,
  NodeValue,
  NodeExecutionContext,
  Position,
} from "../NodeTypes";
import { parseFromString } from "../../utils/domParserUtils";

export interface ArxivNewPapersNode extends BaseNode {
  nodeType: "ArxivPapers";
  nodeValue?: NodeValue;
  process: (
    context: NodeExecutionContext
  ) => Promise<NodeValue | string[] | undefined>;
}

// arxivApi.ts
export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  link: string;
}

export async function fetchArxivPdfUrls(maxResults = 10): Promise<string[]> {
  const limit = Math.max(1, Math.min(50, Number(maxResults) || 10));
  const url = `https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=${limit}`;

  const res = await fetch(url, { headers: { Accept: "application/atom+xml" } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ArXiv: ${res.status}`);
  }

  const xmlText = await res.text();
  const xmlDoc = parseFromString(xmlText, "application/xml");

  const entries = Array.from(xmlDoc.getElementsByTagName("entry"));
  const urls: string[] = [];
  for (const entry of entries) {
    const links = Array.from((entry as Element).getElementsByTagName("link"));
    const pdfHref =
      links
        .find((l) => {
          const element = l as Element;
          return (
            element.getAttribute("type") === "application/pdf" ||
            element.getAttribute("title")?.toLowerCase() === "pdf"
          );
        })
        ?.getAttribute("href") || "";

    if (pdfHref) {
      urls.push(
        pdfHref.startsWith("http") ? pdfHref : `https://arxiv.org${pdfHref}`
      );
      continue;
    }
    const idText =
      (entry as Element).getElementsByTagName("id")[0]?.textContent ?? "";
    const m = idText.match(/\/abs\/([^/]+)/);
    if (m?.[1]) {
      urls.push(`https://arxiv.org/pdf/${m[1]}.pdf`);
    }
  }
  return urls;
}

//function register(nodeRegistry: NodeRegistry): void {
export const createArxivNewPapersNode = (
  id: number,
  type: Position,
  nodeValue: number = 10
): ArxivNewPapersNode => ({
  id,
  title: "Arxiv Papers",
  nodeValue: nodeValue,
  nodeType: "ArxivPapers",
  sockets: [
    {
      id: id * 100 + 1,
      title: "Input",
      type: "input",
      nodeId: id,
      dataType: "number",
    },
    {
      id: id * 100 + 2,
      title: "Output",
      type: "output",
      nodeId: id,
      dataType: "string",
    },
  ],
  x: type.x,
  y: type.y,
  width: 280,
  height: 200,
  selected: false,
  processing: false,
  process: async (context: NodeExecutionContext) => {
    try {
      const n = context.node;
      console.log("NODE VALUE", n.nodeValue);
      const inputVal = await context.getInputValue(n.id * 100 + 1);
      const desired = Number(inputVal ?? n.nodeValue ?? 10);
      const limit = Math.max(
        1,
        Math.min(50, Number.isFinite(desired) ? desired : 10)
      );
      const pdfUrls = await fetchArxivPdfUrls(limit);
      console.log("PDF URLs:", pdfUrls);
      return pdfUrls;
    } catch (error) {
      console.error(
        "Error in ArxivNewPapersNode process:",
        error instanceof Error ? error.message : error
      );
      return `Error in ArxivNewPapersNode process: ${
        error instanceof Error ? error.message : error
      }`;
    }
  },
  // process: async ({ node }) => {
  //   return {
  //     [node.id * 100 + 1]: ur,// ✅ constant output
  //   };
  // },

  configParameters: [
    {
      parameterName: "Max Results",
      parameterType: "number",
      defaultValue: 10,
      valueSource: "UserInput",
      UIConfigurable: true,
      description: "Max number of results to return",
      isNodeBodyContent: true,
    },
  ],
  getConfigParameters() {
    return this.configParameters || [];
  },
  getConfigParameter(parameterName) {
    return (this.configParameters ?? []).find(
      (param) => param.parameterName === parameterName
    );
  },
  setConfigParameter(parameterName, value) {
    const parameter = (this.configParameters ?? []).find(
      (param) => param.parameterName === parameterName
    );
    if (parameter) parameter.paramValue = value;
  },
});

export function register(nodeRegistry: NodeRegistry): void {
  console.log("Registering Arxiv New Papers Node");
  nodeRegistry.registerNodeType("ArxivPapers", createArxivNewPapersNode);
}
