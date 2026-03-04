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
import { X, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getConfigParameters, setConfigParameter,SourceListOption } from "../types/NodeTypes";
interface IfElseOperatorMeta {
  labelA: string;
  labelB: string;
  labelC: string;
  needsB: boolean;
  needsC: boolean;
  needsRegex: boolean;
  description: string;
}

const IFELSE_OPERATOR_META: Record<string, IfElseOperatorMeta> = {
  is_not_empty:  { labelA: "Value to Check",    labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is not null, empty string, empty array, or empty object." },
  is_empty:      { labelA: "Value to Check",    labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is null, undefined, empty string, empty array, or empty object." },
  is_null:       { labelA: "Value to Check",    labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is exactly null or undefined." },
  is_number:     { labelA: "Value to Check",    labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is a valid number." },
  is_string:     { labelA: "Value to Check",    labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is a string." },
  is_boolean:    { labelA: "Value to Check",    labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is true or false." },
  is_array:      { labelA: "Value to Check",    labelB: "Compare (B)",    labelC: "Compare (C)", needsB: false, needsC: false, needsRegex: false, description: "True when the value is an array." },
  eq:            { labelA: "Left Side (A)",     labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A equals B with type coercion (e.g. '1' == 1)." },
  neq:           { labelA: "Left Side (A)",     labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A does not equal B (loose)." },
  seq:           { labelA: "Left Side (A)",     labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A equals B with the same type (strict, no coercion)." },
  sneq:          { labelA: "Left Side (A)",     labelB: "Right Side (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A does not equal B (strict)." },
  gt:            { labelA: "Number (A)",        labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is greater than B." },
  gte:           { labelA: "Number (A)",        labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is greater than or equal to B." },
  lt:            { labelA: "Number (A)",        labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is less than B." },
  lte:           { labelA: "Number (A)",        labelB: "Compare To (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A is less than or equal to B." },
  between:       { labelA: "Number (A)",        labelB: "Min (B)",        labelC: "Max (C)",     needsB: true,  needsC: true,  needsRegex: false, description: "True if A is between B and C inclusive." },
  contains:      { labelA: "Text / Array (A)",  labelB: "Search For (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A contains B. Works on strings and arrays." },
  not_contains:  { labelA: "Text / Array (A)",  labelB: "Search For (B)", labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A does not contain B." },
  starts_with:   { labelA: "Text (A)",          labelB: "Prefix (B)",     labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A starts with B." },
  ends_with:     { labelA: "Text (A)",          labelB: "Suffix (B)",     labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: false, description: "True if A ends with B." },
  regex:         { labelA: "Text to Test (A)",  labelB: "Pattern (B)",    labelC: "Compare (C)", needsB: true,  needsC: false, needsRegex: true,  description: "True if A matches the regex pattern in B." },
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
      id: nodeId * 100 + i,
      title: `Input ${i}`,
      type: "input",
      nodeId,
      dataType: "unknown",
    } as Socket);
  }
  sockets.push({
    id: nodeId * 100 + 111,
    title: "Output",
    type: "output",
    nodeId,
    dataType: "string",
  } as Socket);
  return sockets;
}

function computeJoinHeight(inputCount: number): number {
  return 180 + inputCount * 40;
}


interface NodeEditPanelProps {
  node: BaseNode | null;
  onClose: () => void;
  onSave: (updatedNode: Partial<BaseNode>) => void;
}

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  node,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState<string>("");
  const [nodeValue, setValue] = useState<NodeValue | undefined>(undefined);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<{
    [key: string]: string | number | boolean;
  }>({});
  const [currentOperator, setCurrentOperator] = useState<string>("is_not_empty");

  const panelRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  // Initialize form values when node changes
  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setValue(node.nodeValue);
      // No use for nodevalue logging to pass lint error
      console.log(nodeValue);

      // Trigger slide-in animation
      setIsVisible(true);
    }
  }, [node, nodeValue]);

  useEffect(() => {
    if (!node) {
      setFormValues({});
      return;
    }
    const initialValues = getConfigParameters(node).reduce((acc, param) => {
      acc[param.parameterName] =
        param.paramValue !== undefined ? param.paramValue : param.defaultValue;
      return acc;
    }, {} as { [key: string]: string | number | boolean });

    setFormValues(initialValues);
    if (node.nodeType === "IfElse") {
      const op = initialValues["Operator"] as string | undefined;
      setCurrentOperator(op ?? "is_not_empty");
    }
  }, [node]);
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Element)
      ) {
        if (isVisible) handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, handleClose]);

  // ── Label helpers ─────────────────────────────────────────────────────────
  const getValueLabel = (param: ConfigParameterType) => {
    if (!node) return t("nodeEditPanel.valueLabels.default");
    let _label = "";
    const _local_Label = param.i18n?.[i18n.language]?.[param.parameterName];
    if (_local_Label) _label = _local_Label.Name;
    else _label = t(param.parameterName);
    if (i18n.language !== "en" && _label === param.parameterName)
      _label = t("nodeEditPanel.valueLabels." + param.parameterType);
    return _label;
  };

  // For IfElse, override B / C labels to match the selected operator
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

    // Validate file size (e.g., 5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert(t("nodeEditPanel.fileTooLarge", "File is too large. Maximum size is 5MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setFormValues((prev) => ({ ...prev, [param.parameterName]: base64String }));
      if (node) setConfigParameter(node, param.parameterName, base64String);
      if (param.isNodeBodyContent) {
        setValue(base64String);
        onSave({ title, nodeValue: base64String });
      }
    };
    reader.onerror = () =>
      alert(t("nodeEditPanel.fileReadError", "Failed to read file. Please try again."));
    reader.readAsDataURL(file);
  };

  const shouldShowParameter = (param: ConfigParameterType): boolean => {
    if (!node) return true;
    const currentProvider = formValues["Provider"] as string || "openai";
    if (param.parameterName === "API Key")         return currentProvider.toLowerCase() !== "ollama";
    if (param.parameterName === "Ollama Base URL") return currentProvider.toLowerCase() === "ollama";
    return true;
  };

  const getFilteredModelOptions = (param: ConfigParameterType): SourceListOption[] => {
    if (!param.sourceList || param.parameterName !== "Model")
      return (param.sourceList as SourceListOption[]) || [];
    const currentProvider = formValues["Provider"] as string || "openai";
    return (param.sourceList as SourceListOption[]).filter((option: SourceListOption) =>
      option.provider
        ? option.provider.toLowerCase() === currentProvider.toLowerCase()
        : true
    );
  };

  const renderApiKeyOrOllamaUrl = () => {
    if (!node) return null;
    const currentProvider = formValues["Provider"] as string || "openai";
    const isOllama = currentProvider.toLowerCase() === "ollama";
    if (isOllama) {
      const ollamaParam = getConfigParameters(node).find(
        (p) => p.parameterName === "Ollama Base URL"
      );
      if (ollamaParam?.UIConfigurable)
        return (
          <div key="ollama-base-url" className="space-y-2">
            <label htmlFor="Ollama Base URL"
              className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>
              {getValueLabel(ollamaParam)}
            </label>
            {renderInputControl(ollamaParam)}
          </div>
        );
    } else {
      const apiKeyParam = getConfigParameters(node).find(
        (p) => p.parameterName === "API Key"
      );
      if (apiKeyParam?.UIConfigurable)
        return (
          <div key="api-key" className="space-y-2">
            <label htmlFor="API Key"
              className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>
              {getValueLabel(apiKeyParam)}
            </label>
            {renderInputControl(apiKeyParam)}
          </div>
        );
    }
    return null;
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
      if (node) {
        setConfigParameter(node, param.parameterName, newValue);
      } else {
        return;
      }
      if (param.parameterName === "Operator") {
        setCurrentOperator(newValue as string);
      }

      if (param.parameterName === "Input Count" && node.nodeType === "Join") {
        const newCount = Math.min(7, Math.max(1, Number(newValue)));
        onSave({
          title,
          sockets: buildJoinSockets(node.id, newCount),
          height: computeJoinHeight(newCount),
        });
      }

      if (param.parameterName === "Provider") {
        const modelParam = getConfigParameters(node).find(
          (p) => p.parameterName === "Model"
        );
        if (modelParam?.sourceList) {
          const filteredModels = (modelParam.sourceList as SourceListOption[]).filter(
            (option: SourceListOption) =>
              option.provider &&
              option.provider.toLowerCase() === (newValue as string).toLowerCase()
          );
          if (filteredModels.length > 0) {
            const firstModel = filteredModels[0].key;
            setFormValues((prev) => ({ ...prev, Model: firstModel }));
            setConfigParameter(node, "Model", firstModel);
            if (modelParam.isNodeBodyContent) {
              setValue(firstModel as unknown as NodeValue);
              onSave({ title, nodeValue: firstModel as unknown as NodeValue });
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
                <input
                  type="file"
                  id={param.parameterName}
                  accept={param.acceptedFileTypes}
                  onChange={(e) => handleFileUpload(e, param)}
                  className="hidden"
                />
                <label
                  htmlFor={param.parameterName}
                  className="flex items-center justify-center w-full bg-[#FFC72C]/10 hover:bg-[#FFC72C]/20 text-[#FFC72C] border border-[#FFC72C]/30 rounded-md p-3 cursor-pointer transition-colors"
                >
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
              <select
                id={param.parameterName}
                className={`w-full bg-[#ecd6d6] text-black border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
                value={String(renderValue)}
                onChange={handleChange}
              >
                {filteredOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              {/* Show a helpful description below the Operator dropdown */}
              {param.parameterName === "Operator" && node?.nodeType === "IfElse" && (
                <p className="text-xs text-[#FFC72C]/60 italic px-1">
                  {getIfElseOperatorMeta(currentOperator).description}
                </p>
              )}
              {/* Show a hint below the Mode dropdown for Join node */}
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
          <input
            type="text"
            id={param.parameterName}
            value={String(renderValue)}
            onChange={handleChange}
            className="w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none"
          />
        );
      case "text":
        return (
          <textarea
            id={param.parameterName}
            className={`w-full h-32 bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none resize-none ${textAlignClass}`}
            value={String(renderValue)}
            onChange={handleChange}
            placeholder={
              node?.nodeType === "Join" && param.parameterName === "Separator"
                ? formValues["Mode"] === "substitute"
                  ? "e.g. Hello {{input1}}, you said: {{input2}}"
                  : "Separator (e.g. space, comma, (new line))"
                : t("nodeEditPanel.textValuePlaceholder", "Text value...")
            }
          />
        );
      case "number":
        return (
          <input
            type="number"
            id={param.parameterName}
            value={String(renderValue)}
            min={param.parameterName === "Input Count" ? 1 : undefined}
            max={param.parameterName === "Input Count" ? 7 : undefined}
            onChange={handleChange}
            className="w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none"
          />
        );
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <label className={`text-white cursor-pointer ${textAlignClass}`}>
              <input
                id={param.parameterName}
                type="checkbox"
                className="mr-2 accent-[#FFC72C]"
                checked={Boolean(formValues[param.parameterName])}
                onChange={handleChange}
              />
              {formValues[param.parameterName]
                ? t("nodeEditPanel.true", "TRUE")
                : t("nodeEditPanel.false", "FALSE")}
            </label>
          </div>
        );
    }
  };

  if (!node) return null;

  // Get text alignment class based on language direction
  const textAlignClass = i18n.language === "ar" ? "text-right" : "text-left";

  const shouldRenderParam = (param: ConfigParameterType): boolean => {
    if (param.parameterName === "API Key" || param.parameterName === "Ollama Base URL")
      return false; 
    if (node.nodeType === "IfElse")
      return isIfElseParamVisible(param.parameterName, currentOperator);
    return !!param.UIConfigurable && shouldShowParameter(param);
  };

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 h-full w-[350px] bg-[#0D0D0D] text-white shadow-[-5px_0_15px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-auto border-l border-[#FFC72C]/20 transition-transform duration-300 ease-in-out"
      style={{
        zIndex: 9999,
        transform: isVisible ? "translateX(0)" : "translateX(100%)",
      }}
      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseDown={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseMove={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseUp={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      dir="ltr" // Always keep the panel in LTR mode for consistency
    >
      {/* ── Header ── */}
      <div className="sticky top-0 bg-[#0D0D0D] z-10">
        <div className="flex items-center justify-between p-4 border-b border-[#FFC72C]/20">
          <h2 className={`text-[#FFC72C] text-lg font-bold ${textAlignClass}`}>
            {t("nodeEditPanel.title")}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
            aria-label={t("common.close", "Close")}
          >
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

      {/* ── Body ── */}
      <div className="p-4 space-y-6 flex-grow">

        {/* Node title */}
        <div className="space-y-2">
          <label
            htmlFor="node-title-input"
            className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}
          >
            {t("nodeEditPanel.nodeTitle")}
          </label>
          <input
            id="node-title-input"
            type="text"
            className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Config parameters */}
        <div className="space-y-4">
          {node &&
            getConfigParameters(node)
              .filter(shouldRenderParam)
              .map((param) => (
                <div key={param.parameterName} className="space-y-2">
                  <label
                    htmlFor={param.parameterName}
                    className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}
                  >
                    {getDynamicLabel(param)}
                  </label>
                  {renderInputControl(param)}
                </div>
              ))}
          {renderApiKeyOrOllamaUrl()}
        </div>

        {/* Socket information */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>
            {t("nodeEditPanel.socketInfo")}
          </label>
          <div className="bg-[#161616] border border-[#FFC72C]/20 rounded-md p-3">
            <ul className="space-y-2">
              {node.sockets.map((socket: Socket) => (
                <li
                  key={socket.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        socket.type === "input" ? "bg-blue-400" : "bg-[#FFC72C]"
                      }`}
                    />
                    <span>{socket.title}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="uppercase">
                      {t(`nodeEditPanel.${socket.type}`)}
                    </span>
                    {socket.dataType && (
                      <span className="ml-1">- {socket.dataType}</span>
                    )}
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
