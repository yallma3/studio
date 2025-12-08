import React, { useState } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';
import { validatePasswordStrength } from '../utils/encryptionUtils';
import { useTranslation } from 'react-i18next';

interface PasswordModalProps {
  mode: 'encrypt' | 'decrypt';
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  mode,
  onConfirm,
  onCancel,
  error
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = mode === 'encrypt' 
    ? validatePasswordStrength(password)
    : null;

  const canSubmit = mode === 'decrypt'
    ? password.length > 0
    : password.length >= 6 && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onConfirm(password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#FFC72C]" />
            <h2 className="text-lg font-semibold text-white">
              {mode === 'encrypt' 
                ? t('encryption.setPassword', 'Set Password')
                : t('encryption.enterPassword', 'Enter Password')
              }
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-400 mb-4">
          {mode === 'encrypt'
            ? t('encryption.encryptDescription', 'Choose a strong password to protect your workspace. Keep it safe - it cannot be recovered.')
            : t('encryption.decryptDescription', 'Enter the password to decrypt and open this workspace.')
          }
        </p>

        <form onSubmit={handleSubmit}>
          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {t('encryption.password', 'Password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white pr-10 focus:outline-none focus:border-[#FFC72C]"
                placeholder={t('encryption.enterPassword', 'Enter password')}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator (encrypt mode only) */}
            {mode === 'encrypt' && password.length > 0 && passwordStrength && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  <div className={`h-1 flex-1 rounded transition-colors ${
                    passwordStrength.strength === 'weak' ? 'bg-red-500' :
                    passwordStrength.strength === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className={`h-1 flex-1 rounded transition-colors ${
                    passwordStrength.strength === 'medium' || passwordStrength.strength === 'strong'
                      ? passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      : 'bg-zinc-700'
                  }`} />
                  <div className={`h-1 flex-1 rounded transition-colors ${
                    passwordStrength.strength === 'strong' ? 'bg-green-500' : 'bg-zinc-700'
                  }`} />
                </div>
                <p className="text-xs text-zinc-400">{passwordStrength.message}</p>
              </div>
            )}
          </div>

          {/* Confirm Password (encrypt mode only) */}
          {mode === 'encrypt' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('encryption.confirmPassword', 'Confirm Password')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white pr-10 focus:outline-none focus:border-[#FFC72C]"
                  placeholder={t('encryption.confirmPassword', 'Confirm password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">
                  {t('encryption.passwordMismatch', 'Passwords do not match')}
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-1 px-4 py-2 rounded transition-colors ${
                canSubmit
                  ? 'bg-[#FFC72C] hover:bg-[#FFD700] text-black'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {mode === 'encrypt'
                ? t('encryption.encrypt', 'Encrypt & Export')
                : t('encryption.decrypt', 'Decrypt & Open')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};