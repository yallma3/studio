
import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, MessageCircle, Send, Bot, ChevronDown, ChevronUp } from "lucide-react";

interface UserPromptDialogProps {
  isOpen: boolean;
  promptId: string;
  nodeId: number;
  nodeTitle: string;
  message: string;
  onSubmit: (promptId: string, response: string) => void;
  onClose: () => void;
  onCancel?: (promptId: string) => void;
}

const COLLAPSED_MAX_HEIGHT = 140;

const UserPromptDialog: React.FC<UserPromptDialogProps> = ({
  isOpen,
  promptId,
  nodeTitle,
  message,
  onSubmit,
  onClose,
  onCancel,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const messageRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureOverflow = useCallback(() => {
    const el = messageRef.current;
    if (!el) return;
    el.style.maxHeight = "none";
    const fullHeight = el.scrollHeight;
    el.style.maxHeight = "";
    setNeedsExpand(fullHeight > COLLAPSED_MAX_HEIGHT);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUserInput("");
      setIsSubmitting(false);
      setIsExpanded(false);
      setNeedsExpand(false);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        requestAnimationFrame(measureOverflow);
      });
    }
  }, [isOpen, message, measureOverflow]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(promptId, userInput.trim());
      onClose();
    } catch (error) {
      console.error("Error submitting user prompt:", error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel(promptId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  const hasMessage = Boolean(message?.trim());
  const senderLabel = (() => {
    if (!nodeTitle) return "AI Response";
    const lower = nodeTitle.toLowerCase();
    if (lower.includes("gemini"))                          return "Gemini";
    if (lower.includes("claude"))                          return "Claude";
    if (lower.includes("openai") || lower.includes("gpt")) return "OpenAI";
    if (lower.includes("groq"))                            return "Groq";
    if (lower.includes("openrouter"))                      return "OpenRouter";
    return "AI Response";
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div
        className="relative flex flex-col w-full"
        style={{
          maxWidth: "580px",
          maxHeight: "calc(100vh - 2rem)",
          background: "#161616",
          border: "1px solid rgba(255,199,44,0.22)",
          borderRadius: "14px",
          boxShadow:
            "0 0 0 1px rgba(255,199,44,0.06), 0 32px 64px rgba(0,0,0,0.75)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
              style={{ background: "rgba(255,199,44,0.13)" }}
            >
              <MessageCircle size={18} className="text-[#FFC72C]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white leading-tight">
                User Input Required
              </h2>
              <p
                className="text-xs text-[#888] truncate"
                style={{ maxWidth: 280 }}
                title={nodeTitle}
              >
                {nodeTitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#555] hover:text-white transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-5">

          {/* AI message bubble */}
          {hasMessage && (
            <div
              style={{
                background: "rgba(255,199,44,0.055)",
                border: "1px solid rgba(255,199,44,0.16)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* Bubble header — uses derived model name */}
              <div
                className="flex items-center gap-2 px-4 pt-3 pb-2"
                style={{ borderBottom: "1px solid rgba(255,199,44,0.1)" }}
              >
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                  style={{ background: "rgba(255,199,44,0.2)" }}
                >
                  <Bot size={11} className="text-[#FFC72C]" />
                </div>
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: "rgba(255,199,44,0.75)", letterSpacing: "0.1em" }}
                >
                  {senderLabel}
                </span>
              </div>

              {/* Message text with collapse */}
              <div className="relative px-4 pt-3 pb-1">
                <div
                  ref={messageRef}
                  className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden"
                  style={{
                    color: "#ccc",
                    maxHeight: isExpanded ? "none" : `${COLLAPSED_MAX_HEIGHT}px`,
                  }}
                >
                  {message}
                </div>

                {/* Gradient fade — only when collapsed and overflowing */}
                {needsExpand && !isExpanded && (
                  <div
                    className="absolute left-0 right-0 bottom-0 pointer-events-none"
                    style={{
                      height: 52,
                      background:
                        "linear-gradient(to bottom, transparent, rgba(18,15,5,0.97))",
                    }}
                  />
                )}
              </div>

              {/* Expand / collapse button */}
              {needsExpand && (
                <button
                  type="button"
                  onClick={() => setIsExpanded((v) => !v)}
                  className="flex items-center gap-1.5 mx-4 mb-3 mt-1 text-xs transition-colors"
                  style={{ color: "rgba(255,199,44,0.7)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#FFC72C")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(255,199,44,0.7)")
                  }
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={13} />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Input area */}
          <div>
            <label
              className="block mb-2 text-[11px] font-semibold uppercase"
              style={{ color: "#555", letterSpacing: "0.1em" }}
            >
              {hasMessage ? "Your reply" : "Please provide your input"}
            </label>
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here…"
              disabled={isSubmitting}
              rows={3}
              className="w-full text-sm text-white placeholder-[#3a3a3a] resize-none focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "8px",
                padding: "12px 14px",
                minHeight: 96,
                maxHeight: 220,
                transition: "border 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border =
                  "1px solid rgba(255,199,44,0.55)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(255,199,44,0.07)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border =
                  "1px solid rgba(255,255,255,0.09)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <p className="mt-1.5 text-[11px]" style={{ color: "#444" }}>
              <kbd
                className="px-1 py-0.5 rounded text-[10px]"
                style={{
                  background: "#222",
                  color: "#FFC72C",
                  border: "1px solid rgba(255,199,44,0.2)",
                }}
              >
                Ctrl
              </kbd>{" "}
              +{" "}
              <kbd
                className="px-1 py-0.5 rounded text-[10px]"
                style={{
                  background: "#222",
                  color: "#FFC72C",
                  border: "1px solid rgba(255,199,44,0.2)",
                }}
              >
                Enter
              </kbd>{" "}
              to send
            </p>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-end gap-3 px-5 py-4 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-lg transition-all"
            style={{ color: "#666", background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#bbb";
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#666";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!userInput.trim() || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={
              !userInput.trim() || isSubmitting
                ? {
                    background: "rgba(255,255,255,0.06)",
                    color: "#444",
                    cursor: "not-allowed",
                  }
                : {
                    background: "#FFC72C",
                    color: "#000",
                    boxShadow: "0 0 18px rgba(255,199,44,0.28)",
                    cursor: "pointer",
                  }
            }
            onMouseEnter={(e) => {
              if (userInput.trim() && !isSubmitting)
                (e.currentTarget as HTMLElement).style.background = "#FFD84D";
            }}
            onMouseLeave={(e) => {
              if (userInput.trim() && !isSubmitting)
                (e.currentTarget as HTMLElement).style.background = "#FFC72C";
            }}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={13} />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPromptDialog;