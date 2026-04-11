/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useEffect, MouseEvent, useRef, useCallback } from "react";
import {
  BaseNode,
  ConfigParameterType,
  NodeValue,
  Socket,
} from "../types/NodeTypes";
import { X, Upload, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getConfigParameters,
  setConfigParameter,
  SourceListOption,
} from "../types/NodeTypes";
import { sidecarClient } from "../../api/SidecarClient";

type JMOperationType = "extract_field" | "template_substitute";
type JMOutputFormat  = "string" | "array" | "object" | "count";

interface JMOperationConfig {
  id: string;
  type: JMOperationType;
  label: string;
  fieldPath?: string;
  outputFormat?: JMOutputFormat;
  template?: string;
}

const JM_DEFAULT_OPERATIONS: JMOperationConfig[] = [
  {
    id: "op_1",
    type: "extract_field",
    label: "Field Output",
    fieldPath: "title",
    outputFormat: "string",
  },
];

const JM_MAX_OPERATIONS = 7;

let _jmOpCounter = 2;

function jmParseOps(raw: string): JMOperationConfig[] {
  try {
    const parsed = JSON.parse(raw) as JMOperationConfig[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { /* fall through */ }
  return JM_DEFAULT_OPERATIONS.map((o) => ({ ...o }));
}

function jmBuildSockets(nodeId: number, ops: JMOperationConfig[]): Socket[] {
  const sockets: Socket[] = [
    {
      id: nodeId * 100 + 1,
      title: "JSON Input",
      type: "input",
      nodeId,
      dataType: "string",
    } as Socket,
  ];
  ops.forEach((op, idx) => {
    sockets.push({
      id: nodeId * 100 + 10 + idx,
      title: op.label || `Output ${idx + 1}`,
      type: "output",
      nodeId,
      dataType: "string",
    } as Socket);
  });
  sockets.push({
    id: nodeId * 100 + 2,
    title: "Status",
    type: "output",
    nodeId,
    dataType: "string",
  } as Socket);
  return sockets;
}

function jmComputeHeight(opCount: number): number {
  const totalSockets = opCount + 2;
  return Math.max(220, 100 + totalSockets * 50);
}

interface IfElseOperatorMeta {
  labelA: string; labelB: string; labelC: string;
  needsB: boolean; needsC: boolean; needsRegex: boolean;
  description: string;
}

const IFELSE_OPERATOR_META: Record<string, IfElseOperatorMeta> = {
  is_not_empty: { labelA: "Value to Check",   labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is not null, empty string, empty array, or empty object." },
  is_empty:     { labelA: "Value to Check",   labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is null, undefined, empty string, empty array, or empty object." },
  is_null:      { labelA: "Value to Check",   labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is exactly null or undefined." },
  is_number:    { labelA: "Value to Check",   labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is a valid number." },
  is_string:    { labelA: "Value to Check",   labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is a string." },
  is_boolean:   { labelA: "Value to Check",   labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is true or false." },
  is_array:     { labelA: "Value to Check",   labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is an array." },
  eq:           { labelA: "Left Side (A)",    labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A equals B with type coercion (e.g. '1' == 1)." },
  neq:          { labelA: "Left Side (A)",    labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A does not equal B (loose)." },
  seq:          { labelA: "Left Side (A)",    labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A equals B with the same type (strict, no coercion)." },
  sneq:         { labelA: "Left Side (A)",    labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A does not equal B (strict)." },
  gt:           { labelA: "Number (A)",       labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is greater than B." },
  gte:          { labelA: "Number (A)",       labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is greater than or equal to B." },
  lt:           { labelA: "Number (A)",       labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is less than B." },
  lte:          { labelA: "Number (A)",       labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is less than or equal to B." },
  between:      { labelA: "Number (A)",       labelB: "Min (B)",        labelC: "Max (C)",     needsB: true,  needsC: true,  needsRegex: false, description: "True if A is between B and C inclusive." },
  contains:     { labelA: "Text / Array (A)", labelB: "Search For (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A contains B. Works on strings and arrays." },
  not_contains: { labelA: "Text / Array (A)", labelB: "Search For (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A does not contain B." },
  starts_with:  { labelA: "Text (A)",         labelB: "Prefix (B)",     labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A starts with B." },
  ends_with:    { labelA: "Text (A)",         labelB: "Suffix (B)",     labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A ends with B." },
  regex:        { labelA: "Text to Test (A)", labelB: "Pattern (B)",    labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: true,  description: "True if A matches the regex pattern in B." },
};

function getIfElseOperatorMeta(op: string): IfElseOperatorMeta {
  return IFELSE_OPERATOR_META[op] ?? IFELSE_OPERATOR_META["is_not_empty"];
}

function isIfElseParamVisible(paramName: string, currentOperator: string): boolean {
  if (paramName === "Operator" || paramName === "Negate Result") return true;
  const meta = getIfElseOperatorMeta(currentOperator);
  if (paramName === "Compare B (literal)") return meta.needsB;
  if (paramName === "Compare C (literal)") return meta.needsC;
  if (paramName === "Regex Flags")         return meta.needsRegex;
  return true;
}

function buildJoinSockets(nodeId: number, inputCount: number): Socket[] {
  const sockets: Socket[] = [];
  for (let i = 1; i <= inputCount; i++) {
    sockets.push({
      id: nodeId * 100 + i, title: `Input ${i}`,
      type: "input", nodeId, dataType: "unknown",
    } as Socket);
  }
  sockets.push({
    id: nodeId * 100 + 111, title: "Output",
    type: "output", nodeId, dataType: "string",
  } as Socket);
  return sockets;
}

function computeJoinHeight(inputCount: number): number {
  return 180 + inputCount * 40;
}

const inputCls =
  "w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none";
const selectCls =
  "w-full bg-[#1e1e1e] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none cursor-pointer";
const labelCls  = "block text-xs font-medium text-gray-400 mb-1";
const sectionCls = "border border-[#FFC72C]/20 rounded-md p-3 bg-[#0f0f0f] space-y-3";
const btnCls =
  "text-xs px-3 py-1.5 rounded border border-[#FFC72C]/40 text-[#FFC72C] hover:bg-[#FFC72C]/10 transition-colors disabled:opacity-40 cursor-pointer font-mono";

interface DiscoveredTool     { name: string; description?: string }
interface DiscoveredResource { name: string; uri: string; description?: string }
interface DiscoveredPrompt   { name: string; description?: string; arguments?: { name?: string }[] }

interface McpClientPanelProps {
  node: BaseNode;
  formValues: Record<string, string | number | boolean>;
  onParamChange: (name: string, value: string | number | boolean) => void;
}

const McpClientPanel: React.FC<McpClientPanelProps> = ({ node, formValues, onParamChange }) => {
  const get = (k: string) => {
    const raw = formValues[k];
    if (raw !== undefined && raw !== "") return String(raw);
    const param = (node.configParameters ?? []).find((p) => p.parameterName === k);
    return String(param?.defaultValue ?? "");
  };

  const transport      = (get("Transport Type")  || "http").toLowerCase();
  const selectionMode  = (get("Selection Mode")  || "manual").toLowerCase();
  const capabilityType = (get("Capability Type") || "tool").toLowerCase();

  const [discovering,    setDiscovering]    = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveredTools,     setDiscoveredTools]     = useState<DiscoveredTool[]>([]);
  const [discoveredResources, setDiscoveredResources] = useState<DiscoveredResource[]>([]);
  const [discoveredPrompts,   setDiscoveredPrompts]   = useState<DiscoveredPrompt[]>([]);

  const buildPayload = () => {
    if (transport === "stdio") {
      const argsStr = get("Args");
      let envVars: Record<string, string> = {};
      try { envVars = JSON.parse(get("Env Variables") || "{}"); } catch { /* ignore */ }
      return {
        type:    "STDIO",
        command: get("Command"),
        args:    argsStr ? argsStr.split(" ").filter(Boolean) : [],
        env:     envVars,
      };
    }
    return {
      type:  "HTTP",
      url:   get("MCP Server URL"),
      token: get("Authentication Token"),
    };
  };

  const applyParam = (name: string, value: string) => {
    onParamChange(name, value);
    setConfigParameter(node, name, value);
  };

  const handleDiscover = async () => {
    if (transport === "http" && !get("MCP Server URL").trim()) {
      setDiscoveryError("Please enter the MCP Server URL before connecting.");
      return;
    }
    if (transport === "stdio" && !get("Command").trim()) {
      setDiscoveryError("Please enter the Command before connecting.");
      return;
    }
    setDiscovering(true);
    setDiscoveryError(null);
    try {
      const baseUrl = import.meta.env.VITE_CORE_URL ?? "http://localhost:3001";
      const instanceId = sidecarClient.getInstanceId();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (instanceId) headers["x-api-key"] = instanceId;
      const res = await fetch(`${baseUrl}/mcp/connect`, {
        method:  "POST",
        headers,
        body:    JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Server returned ${res.status}`);
      }
      const data = await res.json() as {
        tools?:     DiscoveredTool[];
        resources?: DiscoveredResource[];
        prompts?:   DiscoveredPrompt[];
      };

      const tools     = data.tools     ?? [];
      const resources = data.resources ?? [];
      const prompts   = data.prompts   ?? [];

      setDiscoveredTools(tools);
      setDiscoveredResources(resources);
      setDiscoveredPrompts(prompts);

      if (capabilityType === "tool"     && tools.length     > 0 && !get("Tool Name"))
        applyParam("Tool Name",    tools[0].name);
      if (capabilityType === "resource" && resources.length > 0 && !get("Resource URI"))
        applyParam("Resource URI", resources[0].uri);
      if (capabilityType === "prompt"   && prompts.length   > 0 && !get("Prompt Name"))
        applyParam("Prompt Name",  prompts[0].name);

      if (tools.length + resources.length + prompts.length === 0) {
        setDiscoveryError("No capabilities found on this server.");
      }
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : String(err));
    } finally {
      setDiscovering(false);
    }
  };

  const selectedTool     = get("Tool Name");
  const selectedResource = get("Resource URI");
  const selectedPrompt   = get("Prompt Name");

  const selectedToolMeta     = discoveredTools.find((t) => t.name === selectedTool);
  const selectedResourceMeta = discoveredResources.find((r) => r.uri === selectedResource);
  const selectedPromptMeta   = discoveredPrompts.find((p) => p.name === selectedPrompt);

  const capTabs = [
    { key: "tool",     label: "Tool",     emoji: "🔧" },
    { key: "resource", label: "Resource", emoji: "📄" },
    { key: "prompt",   label: "Prompt",   emoji: "💬" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Selection Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "manual",  label: "Manual",      sub: "You pick the capability"  },
            { key: "dynamic", label: "Dynamic (AI)", sub: "Agent decides at runtime" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => onParamChange("Selection Mode", m.key)}
              className={`flex flex-col items-start p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                selectionMode === m.key
                  ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                  : "border-[#FFC72C]/20 bg-[#111] text-gray-400 hover:border-[#FFC72C]/40"
              }`}
            >
              <span className="text-xs font-bold">{m.label}</span>
              <span className="text-[10px] opacity-60 mt-0.5 leading-snug">{m.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Server Transport</label>
        <div className="grid grid-cols-2 gap-2">
          {[{ key: "http", label: "HTTP" }, { key: "stdio", label: "Stdio" }].map((t) => (
            <button
              key={t.key}
              onClick={() => onParamChange("Transport Type", t.key)}
              className={`p-2 rounded-md border text-xs font-bold cursor-pointer transition-all ${
                transport === t.key
                  ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                  : "border-[#FFC72C]/20 bg-[#111] text-gray-400 hover:border-[#FFC72C]/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {transport === "http" && (
        <>
          <div>
            <label className={labelCls}>MCP Endpoint URL</label>
            <input type="text" className={inputCls}
              value={get("MCP Server URL")}
              placeholder="https://my-mcp-server.ai/mcp"
              onChange={(e) => onParamChange("MCP Server URL", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>
              Authentication{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <input type="password" className={inputCls}
              value={get("Authentication Token")}
              placeholder="Bearer token..."
              onChange={(e) => onParamChange("Authentication Token", e.target.value)} />
          </div>
        </>
      )}

      {transport === "stdio" && (
        <>
          <div>
            <label className={labelCls}>Command</label>
            <input type="text" className={inputCls}
              value={get("Command")}
              placeholder="npx"
              onChange={(e) => onParamChange("Command", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>
              Args{" "}
              <span className="text-gray-600 font-normal">(space-separated)</span>
            </label>
            <input type="text" className={inputCls}
              value={get("Args")}
              placeholder="-y @modelcontextprotocol/server-filesystem"
              onChange={(e) => onParamChange("Args", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>
              Env Variables{" "}
              <span className="text-gray-600 font-normal">(JSON)</span>
            </label>
            <textarea className={`${inputCls} h-20 resize-none`}
              value={get("Env Variables")}
              placeholder='{"API_KEY": "secret"}'
              onChange={(e) => onParamChange("Env Variables", e.target.value)} />
          </div>
        </>
      )}

      {selectionMode === "dynamic" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={labelCls} style={{ marginBottom: 0 }}>
              Discover capabilities
            </label>
            <button onClick={handleDiscover} disabled={discovering} className={btnCls}>
              {discovering ? "Loading..." : "Connect & Discover"}
            </button>
          </div>

          {discoveryError && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded p-2">{discoveryError}</p>
          )}

          {(discoveredTools.length + discoveredResources.length + discoveredPrompts.length) > 0 && (
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "🔧 Tools",     count: discoveredTools.length     },
                { label: "📄 Resources", count: discoveredResources.length },
                { label: "💬 Prompts",   count: discoveredPrompts.length   },
              ].map((b) => (
                <span key={b.label}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-[#FFC72C]/30 text-[#FFC72C]/70 bg-[#FFC72C]/5 font-mono">
                  {b.label} ({b.count})
                </span>
              ))}
            </div>
          )}

          <div>
            <label className={labelCls}>
              AI Instructions{" "}
              <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea className={`${inputCls} h-28 resize-none`}
              value={get("Dynamic Instructions")}
              placeholder={"Describe what the agent should prioritise or avoid.\ne.g. 'Prefer tools over resources. Only use prompts if the input asks for a template.'"}
              onChange={(e) => onParamChange("Dynamic Instructions", e.target.value)} />
            <p className="text-[11px] text-gray-600 mt-1 px-1 italic">
              The AI will pick the best capability at runtime based on the node's input and these instructions.
            </p>
          </div>
        </div>
      )}

      {selectionMode === "manual" && (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Capability Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {capTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onParamChange("Capability Type", tab.key)}
                  className={`flex flex-col items-center p-2 rounded-md border text-center transition-all cursor-pointer ${
                    capabilityType === tab.key
                      ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                      : "border-[#FFC72C]/20 bg-[#111] text-gray-400 hover:border-[#FFC72C]/40"
                  }`}
                >
                  <span className="text-base leading-none mb-0.5">{tab.emoji}</span>
                  <span className="text-[11px] font-bold">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className={labelCls} style={{ marginBottom: 0 }}>
              {capabilityType === "tool" ? "Tool" : capabilityType === "resource" ? "Resource" : "Prompt"}
            </label>
            <button onClick={handleDiscover} disabled={discovering} className={btnCls}>
              {discovering ? "Loading..." : "Choose..."}
            </button>
          </div>

          {discoveryError && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded p-2 mb-1">{discoveryError}</p>
          )}

          {capabilityType === "tool" && (
            <>
              <select className={selectCls} value={selectedTool}
                onChange={(e) => applyParam("Tool Name", e.target.value)}>
                <option value="">— choose a tool —</option>
                {discoveredTools.map((t) => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
                {selectedTool && !discoveredTools.find((t) => t.name === selectedTool) && (
                  <option value={selectedTool}>{selectedTool}</option>
                )}
              </select>
              {selectedToolMeta?.description && (
                <p className="text-[11px] text-[#FFC72C]/50 mt-1 px-1 italic">
                  {selectedToolMeta.description}
                </p>
              )}
            </>
          )}

          {capabilityType === "resource" && (
            <>
              <select className={selectCls} value={selectedResource}
                onChange={(e) => applyParam("Resource URI", e.target.value)}>
                <option value="">— choose a resource —</option>
                {discoveredResources.map((r) => (
                  <option key={r.uri} value={r.uri}>
                    {r.name} ({r.uri})
                  </option>
                ))}
                {selectedResource && !discoveredResources.find((r) => r.uri === selectedResource) && (
                  <option value={selectedResource}>{selectedResource}</option>
                )}
              </select>
              {selectedResourceMeta?.description && (
                <p className="text-[11px] text-[#FFC72C]/50 mt-1 px-1 italic">
                  {selectedResourceMeta.description}
                </p>
              )}
              {!discoveredResources.length && (
                <div>
                  <label className={labelCls}>Or enter URI manually</label>
                  <input type="text" className={inputCls}
                    value={selectedResource}
                    placeholder="file:///path/to/resource  or  myresource://…"
                    onChange={(e) => applyParam("Resource URI", e.target.value)} />
                </div>
              )}
            </>
          )}

          {capabilityType === "prompt" && (
            <>
              <select className={selectCls} value={selectedPrompt}
                onChange={(e) => applyParam("Prompt Name", e.target.value)}>
                <option value="">— choose a prompt —</option>
                {discoveredPrompts.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
                {selectedPrompt && !discoveredPrompts.find((p) => p.name === selectedPrompt) && (
                  <option value={selectedPrompt}>{selectedPrompt}</option>
                )}
              </select>
              {selectedPromptMeta?.description && (
                <p className="text-[11px] text-[#FFC72C]/50 mt-1 px-1 italic">
                  {selectedPromptMeta.description}
                </p>
              )}
              {selectedPromptMeta?.arguments && selectedPromptMeta.arguments.length > 0 && (
                <p className="text-[11px] text-[#FFC72C]/40 px-1 font-mono">
                  Expected args:{" "}
                  {selectedPromptMeta.arguments.map((a) => a.name ?? "?").join(", ")}
                </p>
              )}
            </>
          )}

          {capabilityType !== "resource" && (
            <div>
              <label className={labelCls}>
                {capabilityType === "prompt" ? "Prompt Arguments" : "Input JSON"}{" "}
                <span className="text-gray-600 font-normal">
                  {capabilityType === "prompt" ? "(JSON)" : "tool arguments"}
                </span>
              </label>
              <textarea className={`${inputCls} h-28 resize-none`}
                value={get("Input JSON")}
                placeholder={
                  capabilityType === "prompt"
                    ? '{\n  "language": "English"\n}'
                    : '{\n  "url": "https://example.com"\n}'
                }
                onChange={(e) => onParamChange("Input JSON", e.target.value)} />
              <p className="text-[11px] text-gray-600 mt-1 px-1 italic">
                Can also be provided via the Input socket at runtime.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const JM_OUTPUT_FORMAT_OPTIONS: { key: JMOutputFormat; label: string }[] = [
  { key: "string",  label: "String"        },
  { key: "array",   label: "Array (JSON)"  },
  { key: "object",  label: "Object (JSON)" },
  { key: "count",   label: "Count"         },
];

interface OperationCardProps {
  op: JMOperationConfig;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<JMOperationConfig>) => void;
  onRemove: () => void;
}

const OperationCard: React.FC<OperationCardProps> = ({
  op, canRemove, onChange, onRemove,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-[#FFC72C]/25 rounded-md overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-[#FFC72C]/10 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {expanded
            ? <ChevronDown  size={13} className="text-[#FFC72C]/60" />
            : <ChevronRight size={13} className="text-[#FFC72C]/60" />}
          <span className="text-[#FFC72C] text-xs font-bold font-mono truncate max-w-[200px]">
            {op.label || "—"}
          </span>
        </div>
        {canRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-red-400/60 hover:text-red-400 transition-colors p-0.5 rounded"
            title="Remove this output"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="p-3 space-y-3 bg-[#0f0f0f]">
          <div>
            <label className={labelCls}>Output Socket Label</label>
            <input
              type="text"
              className={inputCls}
              value={op.label}
              placeholder="e.g. Caption"
              onChange={(e) => onChange({ label: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Operation Type</label>
            <select
              className={selectCls}
              value={op.type}
              onChange={(e) => onChange({ type: e.target.value as JMOperationType })}
            >
              <option value="extract_field">Extract Field</option>
              <option value="template_substitute">Template Substitute</option>
            </select>
          </div>
          {op.type === "extract_field" && (
            <>
              <div>
                <label className={labelCls}>Field Path</label>
                <input
                  type="text"
                  className={inputCls}
                  value={op.fieldPath ?? ""}
                  placeholder="e.g. json_input.caption"
                  onChange={(e) => onChange({ fieldPath: e.target.value })}
                />
                <p className="text-[10px] text-[#FFC72C]/40 mt-1 px-1 italic">
                  Dot-notation. Supports index notation e.g. items[0].name
                </p>
              </div>
              <div>
                <label className={labelCls}>Output Format</label>
                <select
                  className={selectCls}
                  value={op.outputFormat ?? "string"}
                  onChange={(e) => onChange({ outputFormat: e.target.value as JMOutputFormat })}
                >
                  {JM_OUTPUT_FORMAT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {op.type === "template_substitute" && (
            <div>
              <label className={labelCls}>Template</label>
              <textarea
                className={`${inputCls} h-28 resize-none`}
                value={op.template ?? ""}
                placeholder={"Hello {{json_input.from.first_name}},\nyou wrote: {{json_input.text}}"}
                onChange={(e) => onChange({ template: e.target.value })}
              />
              <p className="text-[10px] text-[#FFC72C]/40 mt-1 px-1 italic">
                {"Use {{json_input.field}} to insert values."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface JSONManipulatorSectionProps {
  node: BaseNode;
  onSave: (updatedNode: Partial<BaseNode>) => void;
}

const JSONManipulatorSection: React.FC<JSONManipulatorSectionProps> = ({
  node, onSave,
}) => {
  const readOpsFromNode = (): JMOperationConfig[] => {
    const param = (node.configParameters ?? []).find(
      (p) => p.parameterName === "Operations"
    );
    const raw = String(param?.paramValue ?? param?.defaultValue ?? "");
    return jmParseOps(raw);
  };

  const [ops, setOps] = useState<JMOperationConfig[]>(readOpsFromNode);

  const persistOps = useCallback(
    (nextOps: JMOperationConfig[]) => {
      const json = JSON.stringify(nextOps);
      setConfigParameter(node, "Operations", json);
      onSave({
        sockets: jmBuildSockets(node.id, nextOps),
        height:  jmComputeHeight(nextOps.length),
      });
    },
    [node, onSave]
  );

  const handleChange = (opId: string, patch: Partial<JMOperationConfig>) => {
    let next = ops.map((o) => (o.id === opId ? { ...o, ...patch } : o));
    if (patch.type === "template_substitute") {
      next = [next.find((o) => o.id === opId)!];
    }
    setOps(next);
    persistOps(next);
  };

  const handleAdd = () => {
    if (ops.length >= JM_MAX_OPERATIONS) return;
    const newOp: JMOperationConfig = {
      id: `op_${_jmOpCounter++}`,
      type: "extract_field",
      label: `Output ${ops.length + 1}`,
      fieldPath: "",
      outputFormat: "string",
    };
    const next = [...ops, newOp];
    setOps(next);
    persistOps(next);
  };

  const handleRemove = (opId: string) => {
    if (ops.length <= 1) return;
    const next = ops.filter((o) => o.id !== opId);
    setOps(next);
    persistOps(next);
  };

  const anySubstitute = ops.some((o) => o.type === "template_substitute");
  const canAddMore = !anySubstitute && ops.length < JM_MAX_OPERATIONS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-gray-300">
          Output Operations
          {!anySubstitute && (
            <span className="ml-2 text-xs text-[#FFC72C]/50 font-mono">
              {ops.length}/{JM_MAX_OPERATIONS}
            </span>
          )}
        </span>
        {canAddMore && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 text-xs border rounded px-2 py-1 transition-colors text-[#FFC72C] border-[#FFC72C]/30 hover:bg-[#FFC72C]/10 cursor-pointer"
          >
            <Plus size={12} />
            Add Output
          </button>
        )}
      </div>
      <div className="space-y-2">
        {ops.map((op, idx) => (
          <OperationCard
            key={op.id}
            op={op}
            index={idx}
            canRemove={ops.length > 1}
            onChange={(patch) => handleChange(op.id, patch)}
            onRemove={() => handleRemove(op.id)}
          />
        ))}
      </div>
      <p className="text-[10px] text-[#FFC72C]/30 italic px-1">
        All outputs share the same JSON input. Each operation runs independently.
      </p>
    </div>
  );
};

interface LoopSectionProps {
  node: BaseNode;
  formValues: { [key: string]: string | number | boolean };
  onParamChange: (paramName: string, value: string | number | boolean) => void;
}

const LoopSection: React.FC<LoopSectionProps> = ({ node, formValues, onParamChange }) => {
  const runMode   = String(formValues["Run Mode"]                   ?? "single");
  const fieldPath = String(formValues["Field Path"]                 ?? "");
  const itemIndex = Number(formValues["Item Index"]                 ?? 0);
  const delayMs   = Number(formValues["Delay Between Items (ms)"]   ?? 0);
  const stopOnErr = Boolean(formValues["Stop On Error"]             ?? false);
  const maxItems  = Number(formValues["Max Items"]                  ?? 0);
  const outputFmt = String(formValues["Output Format"]              ?? "json");

  const [previewInfo, setPreviewInfo] = useState<{
    arraySize: number;
    currentItem: string;
    error: string | null;
  } | null>(null);

  void node;

  useEffect(() => {
    try {
      const raw = node.nodeValue ? String(node.nodeValue) : null;
      if (!raw) { setPreviewInfo(null); return; }
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { setPreviewInfo(null); return; }

      const resolveNestedValue = (obj: unknown, path: string): unknown => {
        if (!path.trim()) return obj;
        const tokens = path.match(/[^.[\]]+|\[\d+\]/g) ?? [];
        return tokens.reduce((current: unknown, token) => {
          if (current === null || current === undefined) return undefined;
          const indexMatch = token.match(/^\[(\d+)\]$/);
          if (indexMatch && indexMatch[1]) {
            return Array.isArray(current) ? current[parseInt(indexMatch[1], 10)] : undefined;
          }
          if (typeof current === "object" && !Array.isArray(current)) {
            return (current as Record<string, unknown>)[token];
          }
          return undefined;
        }, obj);
      };

      const extracted = fieldPath ? resolveNestedValue(parsed, fieldPath) : parsed;
      if (!Array.isArray(extracted)) { setPreviewInfo(null); return; }

      const arr = extracted as unknown[];
      const idx = Math.max(0, Math.min(itemIndex, arr.length - 1));
      const item = arr[idx];
      const itemStr = typeof item === "string" ? item : JSON.stringify(item, null, 2);

      setPreviewInfo({ arraySize: arr.length, currentItem: itemStr.substring(0, 300), error: null });
    } catch {
      setPreviewInfo(null);
    }
  }, [node.nodeValue, fieldPath, itemIndex]);

  return (
    <div className="space-y-4">
      {previewInfo && (
        <div className="border border-[#FFC72C]/30 rounded-md p-3 bg-[#0a0a0a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FFC72C]">Live Preview</span>
            <span className="text-[10px] text-[#FFC72C]/60 font-mono">
              {runMode === "single"
                ? `Item ${itemIndex + 1} of ${previewInfo.arraySize}`
                : `${previewInfo.arraySize} items total`}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Array size</span>
              <span className="text-[#FFC72C]/70 font-mono">{previewInfo.arraySize} items</span>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
              <div
                className="bg-[#FFC72C] h-1.5 rounded-full transition-all"
                style={{
                  width: runMode === "single"
                    ? `${Math.round(((itemIndex + 1) / previewInfo.arraySize) * 100)}%`
                    : "100%",
                }}
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">
              {runMode === "single" ? `Item at index ${itemIndex}:` : "First item preview:"}
            </p>
            <pre className="text-[10px] text-[#FFC72C]/70 bg-[#111] rounded p-2 overflow-auto max-h-24 font-mono leading-relaxed">
              {previewInfo.currentItem}
            </pre>
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Run Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "single", title: "Single Item",  desc: "Output one item by index." },
            { key: "all",    title: "All Items",     desc: "Run downstream for every item." },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => onParamChange("Run Mode", mode.key)}
              className={`flex flex-col items-start p-3 rounded-md border text-left transition-all cursor-pointer ${
                runMode === mode.key
                  ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                  : "border-[#FFC72C]/20 bg-[#111] text-gray-400 hover:border-[#FFC72C]/40"
              }`}
            >
              <span className="text-xs font-bold">{mode.title}</span>
              <span className="text-[10px] opacity-70 mt-0.5 leading-relaxed">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={sectionCls}>
        <div>
          <label className={labelCls}>
            Field Path
            <span className="ml-2 text-[10px] text-[#FFC72C]/40 font-normal">path to array inside JSON</span>
          </label>
          <input
            type="text"
            className={inputCls}
            value={fieldPath}
            placeholder="e.g. entries   or   data.items"
            onChange={(e) => onParamChange("Field Path", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Output Format</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "json",   label: "JSON String"  },
              { key: "string", label: "Plain String"  },
            ].map((fmt) => (
              <button
                key={fmt.key}
                onClick={() => onParamChange("Output Format", fmt.key)}
                className={`flex flex-col items-start p-2 rounded-md border text-left transition-all cursor-pointer ${
                  outputFmt === fmt.key
                    ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                    : "border-[#FFC72C]/20 bg-[#161616] text-gray-400 hover:border-[#FFC72C]/40"
                }`}
              >
                <span className="text-xs font-bold">{fmt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {runMode === "single" && (
        <div className={sectionCls}>
          <label className={labelCls}>
            Item Index
            <span className="ml-2 text-[10px] text-[#FFC72C]/40 font-normal">0 = first item</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onParamChange("Item Index", Math.max(0, itemIndex - 1))}
              className="w-9 h-9 rounded border border-[#FFC72C]/30 text-[#FFC72C] hover:bg-[#FFC72C]/10 flex items-center justify-center text-xl font-bold cursor-pointer flex-shrink-0"
            >−</button>
            <input
              type="number"
              className={`${inputCls} text-center`}
              value={itemIndex}
              min={0}
              onChange={(e) => onParamChange("Item Index", Math.max(0, Number(e.target.value)))}
            />
            <button
              onClick={() => onParamChange("Item Index", itemIndex + 1)}
              className="w-9 h-9 rounded border border-[#FFC72C]/30 text-[#FFC72C] hover:bg-[#FFC72C]/10 flex items-center justify-center text-xl font-bold cursor-pointer flex-shrink-0"
            >+</button>
          </div>
        </div>
      )}

      {runMode === "all" && (
        <div className="space-y-3">
          <div className={sectionCls}>
            <label className={labelCls}>
              Max Items
              <span className="ml-2 text-[10px] text-[#FFC72C]/40 font-normal">0 = process all</span>
            </label>
            <div className="grid grid-cols-5 gap-1 mb-2">
              {[0, 1, 3, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() => onParamChange("Max Items", v)}
                  className={`py-1.5 rounded text-xs border transition-all cursor-pointer font-mono ${
                    maxItems === v
                      ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                      : "border-[#FFC72C]/20 text-gray-400 hover:border-[#FFC72C]/40"
                  }`}
                >
                  {v === 0 ? "All" : v}
                </button>
              ))}
            </div>
            <input
              type="number"
              className={inputCls}
              value={maxItems}
              min={0}
              onChange={(e) => onParamChange("Max Items", Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>
              Delay Between Items
              <span className="ml-2 text-[10px] text-[#FFC72C]/40 font-normal">milliseconds</span>
            </label>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {[0, 500, 1000, 2000].map((v) => (
                <button
                  key={v}
                  onClick={() => onParamChange("Delay Between Items (ms)", v)}
                  className={`py-1.5 rounded text-xs border transition-all cursor-pointer font-mono ${
                    delayMs === v
                      ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                      : "border-[#FFC72C]/20 text-gray-400 hover:border-[#FFC72C]/40"
                  }`}
                >
                  {v === 0 ? "None" : `${v}ms`}
                </button>
              ))}
            </div>
            <input
              type="number"
              className={inputCls}
              value={delayMs}
              min={0}
              onChange={(e) => onParamChange("Delay Between Items (ms)", Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>Error Handling</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: false, label: "Skip & Continue" },
                { val: true,  label: "Stop On Error"   },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => onParamChange("Stop On Error", opt.val)}
                  className={`flex flex-col items-start p-2 rounded-md border text-left transition-all cursor-pointer ${
                    stopOnErr === opt.val
                      ? "border-[#FFC72C] bg-[#FFC72C]/10 text-[#FFC72C]"
                      : "border-[#FFC72C]/20 bg-[#161616] text-gray-400 hover:border-[#FFC72C]/40"
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface NodeEditPanelProps {
  node: BaseNode | null;
  onClose: () => void;
  onSave: (updatedNode: Partial<BaseNode>) => void;
}

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({ node, onClose, onSave }) => {
  const [title, setTitle]           = useState<string>("");
  const [nodeValue, setValue]       = useState<NodeValue | undefined>(undefined);
  const [isVisible, setIsVisible]   = useState<boolean>(false);
  const [formValues, setFormValues] = useState<{ [key: string]: string | number | boolean }>({});
  const [currentOperator, setCurrentOperator] = useState<string>("is_not_empty");

  const panelRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setValue(node.nodeValue);
      console.log(nodeValue);
      setIsVisible(true);
    }
  }, [node, nodeValue]);

  useEffect(() => {
    if (!node) { setFormValues({}); return; }
    const initialValues = getConfigParameters(node).reduce((acc, param) => {
      acc[param.parameterName] =
        param.paramValue !== undefined ? param.paramValue : param.defaultValue;
      return acc;
    }, {} as { [key: string]: string | number | boolean });
    setFormValues(initialValues);
    if (node.nodeType === "IfElse") {
      setCurrentOperator((initialValues["Operator"] as string) ?? "is_not_empty");
    }
  }, [node]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  useEffect(() => {
    const handler = (event: globalThis.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Element)) {
        if (isVisible) handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isVisible, handleClose]);

  const getValueLabel = (param: ConfigParameterType) => {
    if (!node) return t("nodeEditPanel.valueLabels.default");
    let _label = "";
    const _local = param.i18n?.[i18n.language]?.[param.parameterName];
    if (_local) _label = _local.Name;
    else _label = t(param.parameterName);
    if (i18n.language !== "en" && _label === param.parameterName)
      _label = t("nodeEditPanel.valueLabels." + param.parameterType);
    return _label;
  };

  const getDynamicLabel = (param: ConfigParameterType): string => {
    if (node?.nodeType !== "IfElse") return getValueLabel(param);
    const meta = getIfElseOperatorMeta(currentOperator);
    if (param.parameterName === "Compare B (literal)") return meta.labelB;
    if (param.parameterName === "Compare C (literal)") return meta.labelC;
    return getValueLabel(param);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    param: ConfigParameterType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(t("nodeEditPanel.fileTooLarge", "File is too large. Maximum size is 5MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setFormValues((prev) => ({ ...prev, [param.parameterName]: b64 }));
      if (node) setConfigParameter(node, param.parameterName, b64);
      if (param.isNodeBodyContent) { setValue(b64); onSave({ title, nodeValue: b64 }); }
    };
    reader.onerror = () =>
      alert(t("nodeEditPanel.fileReadError", "Failed to read file. Please try again."));
    reader.readAsDataURL(file);
  };

  const shouldShowParameter = (param: ConfigParameterType): boolean => {
    if (!node) return true;

    const currentProvider = (formValues["Provider"] as string) || "openai";
    if (param.parameterName === "API Key")
      return currentProvider.toLowerCase() !== "ollama";
    if (param.parameterName === "Ollama Base URL")
      return currentProvider.toLowerCase() === "ollama";

    const LEGACY_MCP_NODE_TYPES = ["McpDiscovery", "McpToolCall", "McpGetPrompt", "McpGetResource"];
    if (LEGACY_MCP_NODE_TYPES.includes(node.nodeType)) {
      const transport = ((formValues["Transport Type"] as string) || "http").toLowerCase();
      if (param.parameterName === "Command" || param.parameterName === "Args" || param.parameterName === "Env Variables")
        return transport === "stdio";
      if (param.parameterName === "MCP Server URL" || param.parameterName === "Authentication Token")
        return transport === "http";
      if (param.parameterName === "Selected Tool" && node.nodeType === "McpDiscovery")
        return false;
    }

    if (node.nodeType === "Chunking") {
      const strategy = ((formValues["Strategy"] as string) || "token");
      if (param.parameterName === "Strategy") return true;
      if (param.parameterName === "Max Tokens")
        return strategy === "token" || strategy === "word";
      if (param.parameterName === "Overlap")
        return ["token", "word", "fixed_char", "recursive"].includes(strategy);
      if (param.parameterName === "Char Limit")
        return strategy === "fixed_char" || strategy === "recursive";
      if (param.parameterName === "Max Sentences")
        return strategy === "sentence";
      if (param.parameterName === "Max Paragraphs")
        return strategy === "paragraph";
      if (param.parameterName === "Max Lines")
        return strategy === "newline";
    }

    return true;
  };

  const getFilteredModelOptions = (param: ConfigParameterType): SourceListOption[] => {
    if (!param.sourceList || param.parameterName !== "Model")
      return (param.sourceList as SourceListOption[]) || [];
    const currentProvider = (formValues["Provider"] as string) || "openai";
    return (param.sourceList as SourceListOption[]).filter((o: SourceListOption) =>
      o.provider ? o.provider.toLowerCase() === currentProvider.toLowerCase() : true
    );
  };

  const renderApiKeyOrOllamaUrl = () => {
    if (!node) return null;
    const currentProvider = (formValues["Provider"] as string) || "openai";
    const isOllama  = currentProvider.toLowerCase() === "ollama";
    const paramName = isOllama ? "Ollama Base URL" : "API Key";
    const paramObj  = getConfigParameters(node).find((p) => p.parameterName === paramName);
    if (!paramObj?.UIConfigurable) return null;
    return (
      <div key={paramName} className="space-y-2">
        <label htmlFor={paramName}
          className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>
          {getValueLabel(paramObj)}
        </label>
        {renderInputControl(paramObj)}
      </div>
    );
  };

  const renderInputControl = (param: ConfigParameterType) => {
    if (!param) return null;
    const renderValue = formValues[param.parameterName] ?? "";

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      let newValue: unknown;
      if (param.parameterType === "number")
        newValue = Number((e.target as HTMLInputElement).value);
      else if (param.parameterType === "boolean")
        newValue = (e.target as HTMLInputElement).checked;
      else
        newValue = (e.target as HTMLInputElement).value;

      setFormValues((prev) => ({
        ...prev,
        [param.parameterName]: newValue as string | number | boolean,
      }));

      if (node) setConfigParameter(node, param.parameterName, newValue);
      else return;

      if (param.parameterName === "Operator")
        setCurrentOperator(newValue as string);

      if (param.parameterName === "Input Count" && node.nodeType === "Join") {
        const newCount = Math.min(7, Math.max(1, Number(newValue)));
        onSave({
          title,
          sockets: buildJoinSockets(node.id, newCount),
          height: computeJoinHeight(newCount),
        });
      }

      if (param.parameterName === "Provider") {
        const modelParam = getConfigParameters(node).find((p) => p.parameterName === "Model");
        if (modelParam?.sourceList) {
          const filtered = (modelParam.sourceList as SourceListOption[]).filter(
            (o: SourceListOption) =>
              o.provider && o.provider.toLowerCase() === (newValue as string).toLowerCase()
          );
          if (filtered.length > 0) {
            const first = filtered[0].key;
            setFormValues((prev) => ({ ...prev, Model: first }));
            setConfigParameter(node, "Model", first);
            if (modelParam.isNodeBodyContent) {
              setValue(first as unknown as NodeValue);
              onSave({ title, nodeValue: first as unknown as NodeValue });
            }
          }
        }
      }

      if (param.isNodeBodyContent) {
        setValue(newValue as unknown as NodeValue);
        onSave({ title, nodeValue: newValue as unknown as NodeValue });
      }
    };

    switch (param.parameterType) {
      case "string":
        if (param.acceptedFileTypes) {
          return (
            <div className="space-y-2">
              <div className="relative">
                <input type="file" id={param.parameterName}
                  accept={param.acceptedFileTypes}
                  onChange={(e) => handleFileUpload(e, param)}
                  className="hidden" />
                <label htmlFor={param.parameterName}
                  className="flex items-center justify-center w-full bg-[#FFC72C]/10 hover:bg-[#FFC72C]/20 text-[#FFC72C] border border-[#FFC72C]/30 rounded-md p-3 cursor-pointer transition-colors">
                  <Upload size={18} className="mr-2" />
                  <span className="text-sm font-medium">
                    {renderValue
                      ? t("nodeEditPanel.fileUploaded", "File uploaded ✓")
                      : t("nodeEditPanel.chooseFile", "Choose File")}
                  </span>
                </label>
              </div>
              {renderValue && (
                <div className="text-xs text-gray-400 truncate">
                  {String(renderValue).substring(0, 50)}...
                </div>
              )}
            </div>
          );
        }
        if (param.sourceList) {
          const filteredOptions = getFilteredModelOptions(param);
          return (
            <div className="space-y-2">
              <select id={param.parameterName}
                className={`w-full bg-[#1e1e1e] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none cursor-pointer ${textAlignClass}`}
                value={String(renderValue)}
                onChange={handleChange}>
                {filteredOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
              {param.parameterName === "Operator" && node?.nodeType === "IfElse" && (
                <p className="text-xs text-[#FFC72C]/60 italic px-1">
                  {getIfElseOperatorMeta(currentOperator).description}
                </p>
              )}
              {param.parameterName === "Strategy" && node?.nodeType === "Chunking" && (
                <p className="text-xs text-[#FFC72C]/60 italic px-1">
                  {({
                    token:      "Sliding window of N tokens with optional overlap.",
                    sentence:   "Groups N sentences per chunk (splits on . ! ?).",
                    paragraph:  "Groups N paragraphs per chunk (splits on blank lines).",
                    newline:    "Groups N lines per chunk (splits on \\n).",
                    fixed_char: "Sliding window of N characters with optional overlap.",
                    recursive:  "LangChain-style recursive: \\n\\n → \\n → sentence → space.",
                    word:       "Sliding window of N words with optional overlap.",
                  } as Record<string, string>)[String(renderValue)] ?? ""}
                </p>
              )}
              {param.parameterName === "Mode" && node?.nodeType === "Join" && (
                <p className="text-xs text-[#FFC72C]/60 italic px-1">
                  {String(renderValue) === "substitute"
                    ? "Use {{input1}}, {{input2}}, … as placeholders in the template below."
                    : "All inputs will be joined using the separator below."}
                </p>
              )}
            </div>
          );
        }
        return (
          <input type="text" id={param.parameterName}
            value={String(renderValue)} onChange={handleChange}
            className="w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none" />
        );

      case "text":
        return (
          <textarea id={param.parameterName}
            className={`w-full h-32 bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none resize-none ${textAlignClass}`}
            value={String(renderValue)} onChange={handleChange}
            placeholder={
              node?.nodeType === "Join" && param.parameterName === "Separator"
                ? formValues["Mode"] === "substitute"
                  ? "e.g. Hello {{input1}}, you said: {{input2}}"
                  : "Separator (e.g. space, comma, (new line))"
                : t("nodeEditPanel.textValuePlaceholder", "Text value...")
            } />
        );

      case "number":
        return (
          <input type="number" id={param.parameterName}
            value={String(renderValue)} onChange={handleChange}
            min={param.parameterName === "Input Count" ? 1 : undefined}
            max={param.parameterName === "Input Count" ? 7 : undefined}
            className="w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none" />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <label className={`text-white cursor-pointer ${textAlignClass}`}>
              <input id={param.parameterName} type="checkbox"
                className="mr-2 accent-[#FFC72C]"
                checked={Boolean(formValues[param.parameterName])}
                onChange={handleChange} />
              {formValues[param.parameterName]
                ? t("nodeEditPanel.true", "TRUE")
                : t("nodeEditPanel.false", "FALSE")}
            </label>
          </div>
        );
    }
  };

  if (!node) return null;

  const textAlignClass = i18n.language === "ar" ? "text-right" : "text-left";

  const isJSONManipulator = node.nodeType === "JSONManipulator";
  const isLoop            = node.nodeType === "Loop";
  const isMcpClient =
    node.nodeType === "McpClient" ||
    node.nodeType?.replace(/\s+/g, "") === "McpClient";

  const LEGACY_MCP_NODE_TYPES = ["McpDiscovery", "McpToolCall", "McpGetPrompt", "McpGetResource"];

  const shouldRenderParam = (param: ConfigParameterType): boolean => {
    if (isMcpClient) return false;
    if (param.parameterName === "API Key" || param.parameterName === "Ollama Base URL")
      return false;
    if (node.nodeType === "IfElse")
      return isIfElseParamVisible(param.parameterName, currentOperator);
    return !!param.UIConfigurable && shouldShowParameter(param);
  };

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 h-full w-[370px] bg-[#0D0D0D] text-white shadow-[-5px_0_15px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-auto border-l border-[#FFC72C]/20 transition-transform duration-300 ease-in-out"
      style={{ zIndex: 9999, transform: isVisible ? "translateX(0)" : "translateX(100%)" }}
      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseDown={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseMove={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseUp={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      dir="ltr"
    >
      <div className="sticky top-0 bg-[#0D0D0D] z-10">
        <div className="flex items-center justify-between p-4 border-b border-[#FFC72C]/20">
          <h2 className={`text-[#FFC72C] text-lg font-bold ${textAlignClass}`}>
            {t("nodeEditPanel.title")}
          </h2>
          <button onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
            aria-label={t("common.close", "Close")}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4 bg-[#121212] border-b border-[#FFC72C]/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-[#FFC72C] shadow-[0_0_10px_rgba(255,199,44,0.7)]" />
            <span className="text-sm font-medium">{node.nodeType}</span>
            <span className="bg-[#FFC72C]/10 text-[#FFC72C] text-xs px-2 py-1 rounded">
              {t("nodeEditPanel.id", "ID")}: {node.id}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-grow">
        <div className="space-y-2">
          <label htmlFor="node-title-input"
            className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>
            {t("nodeEditPanel.nodeTitle")}
          </label>
          <input id="node-title-input" type="text" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`} />
        </div>

        {isMcpClient ? (
          <McpClientPanel
            node={node}
            formValues={formValues}
            onParamChange={(paramName, value) => {
              setFormValues((prev) => ({ ...prev, [paramName]: value }));
              if (node) setConfigParameter(node, paramName, value);
            }}
          />
        ) : isJSONManipulator ? (
          <JSONManipulatorSection node={node} onSave={onSave} />
        ) : isLoop ? (
          <LoopSection
            node={node}
            formValues={formValues}
            onParamChange={(paramName, value) => {
              setFormValues((prev) => ({ ...prev, [paramName]: value }));
              if (node) setConfigParameter(node, paramName, value);
            }}
          />
        ) : (
          <div className="space-y-4">
            {LEGACY_MCP_NODE_TYPES.includes(node.nodeType) && node.nodeType === "McpDiscovery" && (
              <div className="space-y-2 border border-[#FFC72C]/20 rounded-md p-3 bg-[#111]">
                <p className="text-xs text-[#FFC72C]/60 italic">
                  ⚠ This node is deprecated. Use the new MCP Client node instead.
                </p>
              </div>
            )}
            {node &&
              getConfigParameters(node)
                .filter(shouldRenderParam)
                .map((param) => (
                  <div key={param.parameterName} className="space-y-2">
                    <label htmlFor={param.parameterName}
                      className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>
                      {getDynamicLabel(param)}
                    </label>
                    {renderInputControl(param)}
                  </div>
                ))}
            {renderApiKeyOrOllamaUrl()}
          </div>
        )}

        <div className="space-y-2">
          <label className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>
            {t("nodeEditPanel.socketInfo")}
          </label>
          <div className="bg-[#161616] border border-[#FFC72C]/20 rounded-md p-3">
            <ul className="space-y-2">
              {node.sockets.map((socket: Socket) => (
                <li key={socket.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${socket.type === "input" ? "bg-blue-400" : "bg-[#FFC72C]"}`} />
                    <span>{socket.title}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="uppercase">{t(`nodeEditPanel.${socket.type}`)}</span>
                    {socket.dataType && <span className="ml-1">- {socket.dataType}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeEditPanel;