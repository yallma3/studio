import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { Trigger, WebhookTrigger } from "../../types/types";

interface WebhookTriggerConfigProps {
  onSave: (trigger: Trigger) => void;
  onBack: () => void;
  existingTrigger?: Trigger | null;
}

const WebhookTriggerConfig: React.FC<WebhookTriggerConfigProps> = ({
  onSave,
  onBack,
  existingTrigger,
}) => {
  const [method, setMethod] = useState<"POST" | "GET">("POST");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (existingTrigger && existingTrigger.type === "webhook") {
      setMethod(existingTrigger.config.method || "POST");
      setWebhookUrl(existingTrigger.config.webhookUrl || "");
      setSecret(existingTrigger.config.secret || "");
    }
  }, [existingTrigger]);

  const handleCopyUrl = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (err) {
      console.error("Failed to copy secret", err);
    }
  };

  const handleGenerateSecret = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let newSecret = "";
    const array = new Uint8Array(32);
    // browser crypto
    window.crypto.getRandomValues(array);

    for (let i = 0; i < array.length; i++) {
      newSecret += chars[array[i] % chars.length];
    }

    setSecret(newSecret);
  };

  const handleSave = () => {
    const trigger: WebhookTrigger = {
      id: existingTrigger?.id || `trigger-${Date.now()}`,
      type: "webhook",
      enabled: true,
      createdAt: existingTrigger?.createdAt || Date.now(),
      updatedAt: Date.now(),
      config: {
        webhookUrl: webhookUrl || "",
        secret: secret || undefined,
        method,
      },
    };

    onSave(trigger);
  };

  const isValid = Boolean(method);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to trigger selection</span>
      </button>

      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">📡 Webhook Trigger</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Configure a webhook endpoint that will trigger your workspace when
              called. A fixed URL will be generated after saving based on your
              workspace.
            </p>
          </div>
        </div>
      </div>

      {/* HTTP Method */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          HTTP Method <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMethod("POST")}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              method === "POST"
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <div className="font-mono font-bold text-lg">POST</div>
            <div className="text-xs mt-1 opacity-80">Recommended for data</div>
          </button>
          <button
            onClick={() => setMethod("GET")}
            className={`px-4 py-3 rounded-lg border-2 transition-all ${
              method === "GET"
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <div className="font-mono font-bold text-lg">GET</div>
            <div className="text-xs mt-1 opacity-80">Simple triggers</div>
          </button>
        </div>
      </div>

      {/* Secret Key */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Secret Key <span className="text-zinc-500">(Optional)</span>
        </label>
        <p className="text-xs text-zinc-500 mb-3">
          Add authentication to prevent unauthorized access. Include this in the{" "}
          <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-yellow-400">
            X-Webhook-Secret
          </code>{" "}
          header when calling the webhook.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showSecret ? "text" : "password"}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Leave empty for no authentication"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-yellow-500/50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            onClick={handleGenerateSecret}
            type="button"
            title="Generate random secret"
            className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Generate</span>
          </button>
          {secret && (
            <button
              onClick={handleCopySecret}
              type="button"
              title="Copy secret"
              className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              {copiedSecret ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Webhook URL Preview (shown after backend registration) */}
      {webhookUrl && (
        <div>
          <label className="block text-sm font-medium text-green-400 mb-2">
             Webhook URL (Active)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-zinc-900 border border-green-500/30 rounded-lg text-green-400 font-mono text-sm cursor-default"
            />
            <button
              onClick={handleCopyUrl}
              type="button"
              title="Copy webhook URL"
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {copiedUrl ? (
                <Check size={18} className="text-white" />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Use this URL to trigger your workspace from external services.
          </p>
        </div>
      )}

      {/* Example Request */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
          <span>📋 Example Request</span>
          {!webhookUrl && (
            <span className="text-xs text-zinc-500">
              (URL will be generated after saving)
            </span>
          )}
        </h4>
        <pre className="bg-black p-3 rounded text-xs text-zinc-400 overflow-x-auto font-mono leading-relaxed">
{`curl -X ${method} \\
  ${webhookUrl || "https://your-server.com/webhook/<workspaceId>"} \\${
  secret
    ? `
  -H "X-Webhook-Secret: ${secret}" \\`
    : ""
}
  -H "Content-Type: application/json" \\
  -d '{"event": "test", "data": "hello world"}'`}
        </pre>
      </div>

      {/* Example Response */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-zinc-300 mb-3">
          📥 Expected Response
        </h4>
        <pre className="bg-black p-3 rounded text-xs text-green-400 overflow-x-auto font-mono leading-relaxed">
{`{
  "success": true,
  "message": "Webhook enqueued",
  "timestamp": "2026-02-01T20:18:00.000Z"
}`}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
            isValid
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {existingTrigger ? "Update Webhook" : "Create Webhook"}
        </button>
      </div>
    </div>
  );
};

export default WebhookTriggerConfig;
