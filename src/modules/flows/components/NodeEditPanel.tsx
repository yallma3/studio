import React, { useState, useEffect, MouseEvent, useRef } from "react";
import {
  ConfigParameterType,
  NodeType,
  NodeValue,
  Socket,
} from "../types/NodeTypes";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NodeEditPanelProps {
  node: NodeType | null;
  onClose: () => void;
  onSave: (updatedNode: Partial<NodeType>) => void;
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
  const panelRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  // Initialize form values when node changes
  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setValue(node.nodeValue);
      // Trigger slide-in animation after component mounts
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [node]);

  useEffect(() => {
    const initialValues = node?.getConfigParameters?.().reduce((acc, param) => {
      acc[param.parameterName] =
        param.paramValue !== undefined ? param.paramValue : param.defaultValue;
      return acc;
    }, {} as { [key: string]: string | number | boolean });

    setFormValues(initialValues || {});
  }, []);

  // Add global click listener to close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Element)
      ) {
        // Only handle clicks outside when panel is visible
        if (isVisible) {
          handleClose();
        }
      }
    };

    // Add the event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match this duration with the CSS transition
  };

  // Handle submit with animation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation explicitly
    console.log("Form submitted", { title, value: nodeValue });

    if (!node) return;

    setIsVisible(false);
    // Wait for animation to complete before saving
    setTimeout(() => {
      onSave({
        title,
        nodeValue: nodeValue,
      });
    }, 300); // Match this duration with the CSS transition
  };

  const getValueLabel = (param: ConfigParameterType) => {
    if (!node) return t("nodeEdit.valueLabels.default");

    let _label = "";
    //attempt parameter i18n resource
    let _local_Lable = param.i18n?.[i18n.language]?.[param.parameterName];
    if (_local_Lable) _label = _local_Lable.Name;
    else _label = t(param.parameterName); // fallback to default trnaslation

    // if there seems to be no exact translation use general translation for the type
    if (i18n.language !== "en" && _label === param.parameterName) {
      _label = t("nodeEdit.valueLabels." + param.parameterType);
    }
    return _label;
  };

  const renderInputControl = (param: ConfigParameterType) => {
    if (!param) return null;

    const renderValue = formValues[param.parameterName] ?? "";

    const handleChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setFormValues((prev) => ({
        ...prev,
        [param.parameterName]:
          param.parameterType === "number"
            ? Number(e.target.value)
            : e.target.value,
      }));
      node?.setConfigParameter?.(param.parameterName, e.target.value);
      if (param.isNodeBodyContent) {
        setValue(e.target.value);
        onSave({
          title,
          nodeValue: e.target.value,
        });
      }
    };

    switch (param.parameterType) {
      case "string":
        if (param.sourceList) {
          return (
            <div className="space-y-4">
              <select
                id={param.parameterName}
                className={`w-full bg-[#ecd6d6] text-black border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
                value={String(renderValue)}
                onChange={handleChange}
              >
                {param.sourceList.map((option) => (
                  <option key={option.key}>{option.label}</option>
                ))}
              </select>
            </div>
          );
        } else
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
            placeholder="Text value..."
          />
        );
      case "number":
        return (
          <input
            type="number"
            id={param.parameterName}
            value={String(renderValue)}
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
                checked={nodeValue === true}
                onChange={handleChange}
              />
              {nodeValue === true ? "TRUE" : "FALSE"}
            </label>
          </div>
        );
    }
  };

  if (!node) return null;

  // Get text alignment class based on language direction
  const textAlignClass = i18n.language === "ar" ? "text-right" : "text-left";

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
      <div className="sticky top-0 bg-[#0D0D0D] z-10">
        <div className="flex items-center justify-between p-4 border-b border-[#FFC72C]/20">
          <h2 className={`text-[#FFC72C] text-lg font-bold ${textAlignClass}`}>
            {t("nodeEdit.title")}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-[#121212] border-b border-[#FFC72C]/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-[#FFC72C] shadow-[0_0_10px_rgba(255,199,44,0.7)]"></div>
            <span className="text-sm font-medium">{node.nodeType}</span>
            <span className="bg-[#FFC72C]/10 text-[#FFC72C] text-xs px-2 py-1 rounded">
              ID: {node.id}
            </span>
          </div>
        </div>
      </div>

      <form
        id="node-edit-form"
        onSubmit={handleSubmit}
        className="p-4 space-y-6 flex-grow"
      >
        <div className="space-y-2">
          <label
            htmlFor="node-title-input"
            className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}
          >
            {t("nodeEdit.nodeTitle")}
          </label>
          <input
            id="node-title-input"
            type="text"
            className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {node.getConfigParameters &&
            node.getConfigParameters().map((param) => {
              if (param.UIConfigurable) {
                return (
                  <div key={param.parameterName} className="space-y-2">
                    <label
                      htmlFor={param.parameterName}
                      className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}
                    >
                      {getValueLabel(param)}
                    </label>
                    {renderInputControl(param)}
                  </div>
                );
              }
              return null;
            })}
        </div>

        <div className="space-y-2">
          <label
            className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}
          >
            {t("nodeEdit.socketInfo")}
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
                    ></div>
                    <span>{socket.title}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="uppercase">
                      {t(`nodeEdit.${socket.type}`)}
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

        <div className="pt-4 mt-auto">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
            >
              {t("nodeEdit.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#FFC72C] text-black font-medium rounded-md hover:bg-[#FFB300] transition-colors"
            >
              {t("nodeEdit.saveChanges")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NodeEditPanel;
