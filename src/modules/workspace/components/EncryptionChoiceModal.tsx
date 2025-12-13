import React from 'react';
import { Lock, Unlock, Key, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EncryptionChoiceModalProps {
  onChooseEncrypted: () => void;
  onChooseUnencrypted: () => void;
  onChooseSensitiveDataOnly: () => void;
  onCancel: () => void;
}

export const EncryptionChoiceModal: React.FC<EncryptionChoiceModalProps> = ({
  onChooseEncrypted,
  onChooseUnencrypted,
  onChooseSensitiveDataOnly,
  onCancel
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t('encryption.shareWorkspace', 'Share Workspace')}
          </h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-6">
          {t('encryption.chooseProtection', 'How would you like to protect this workspace?')}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {/* Unencrypted Option */}
          <button
            onClick={onChooseUnencrypted}
            className="w-full p-4 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-zinc-600 rounded-lg text-left transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-zinc-700 rounded group-hover:bg-zinc-600 transition-colors">
                <Unlock className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">
                  {t('encryption.noEncryption', 'No Encryption')}
                </h3>
                <p className="text-sm text-zinc-400">
                  {t('encryption.noEncryptionDesc', 'Anyone can open this file and view all data')}
                </p>
              </div>
            </div>
          </button>

          {/* Sensitive Data Only Option */}
          <button
            onClick={onChooseSensitiveDataOnly}
            className="w-full p-4 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-blue-500 rounded-lg text-left transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded group-hover:bg-blue-500/20 transition-colors">
                <Key className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1 flex items-center gap-2">
                  {t('encryption.sensitiveDataOnly', 'Encrypt Sensitive Data Only')}
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    {t('encryption.balanced', 'Balanced')}
                  </span>
                </h3>
                <p className="text-sm text-zinc-400">
                  {t('encryption.sensitiveDataOnlyDesc', 'Workspace data is readable, but API keys and sensitive environment variables require password')}
                </p>
              </div>
            </div>
          </button>

          {/* Full Encryption Option */}
          <button
            onClick={onChooseEncrypted}
            className="w-full p-4 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 hover:border-[#FFC72C] rounded-lg text-left transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FFC72C]/10 rounded group-hover:bg-[#FFC72C]/20 transition-colors">
                <Lock className="h-5 w-5 text-[#FFC72C]" />
              </div>
              <div>
                <h3 className="font-medium text-white mb-1 flex items-center gap-2">
                  {t('encryption.fullEncryption', 'Full Encryption')}
                  <span className="text-xs bg-[#FFC72C]/20 text-[#FFC72C] px-2 py-0.5 rounded">
                    {t('encryption.mostSecure', 'Most Secure')}
                  </span>
                </h3>
                <p className="text-sm text-zinc-400">
                  {t('encryption.fullEncryptionDesc', 'Entire workspace requires password - maximum security')}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
        >
          {t('common.cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );
};