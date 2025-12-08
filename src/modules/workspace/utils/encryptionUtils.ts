import CryptoJS from 'crypto-js';
import { WorkspaceData, Agent, EnvironmentVariable } from '../types/Types';

export interface EncryptedWorkspace {
  version: "1.0";
  encrypted: true;
  algorithm: "AES";
  encryptionType: "full";
  workspaceName: string;
  data: string; // Only used for full encryption
}

/**
 * Encrypt entire workspace data with password using AES encryption
 */
export const encryptWorkspaceData = (
  workspaceData: WorkspaceData,
  password: string
): EncryptedWorkspace => {
  try {
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const jsonString = JSON.stringify(workspaceData);
    const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
    
    return {
      version: "1.0",
      encrypted: true,
      algorithm: "AES",
      encryptionType: "full",
      workspaceName: workspaceData.name || workspaceData.id,
      data: encrypted
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to encrypt workspace"
    );
  }
};

/**
 * Encrypt only API keys in workspace data - returns plain workspace JSON with encrypted keys
 * This returns the workspace as-is with only apiKey fields encrypted (with enc_ prefix)
 */
export const encryptWorkspaceApiKeys = (
  workspaceData: WorkspaceData,
  password: string
): WorkspaceData => {
  try {
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Deep clone to avoid mutations
    const clonedData = JSON.parse(JSON.stringify(workspaceData)) as WorkspaceData;

    // Encrypt main workspace API key if it exists
    if (clonedData.apiKey) {
      const apiKeyString = typeof clonedData.apiKey === 'string' 
        ? clonedData.apiKey 
        : JSON.stringify(clonedData.apiKey);
      const encryptedKey = CryptoJS.AES.encrypt(apiKeyString, password).toString();
      clonedData.apiKey = `enc_${encryptedKey}`;
    }

    // Encrypt API keys in agents array
    if (Array.isArray(clonedData.agents)) {
      clonedData.agents.forEach((agent: Agent) => {
        if (agent.apiKey) {
          const apiKeyString = typeof agent.apiKey === 'string'
            ? agent.apiKey
            : JSON.stringify(agent.apiKey);
          const encryptedKey = CryptoJS.AES.encrypt(apiKeyString, password).toString();
          agent.apiKey = `enc_${encryptedKey}`;
        }
      });
    }

    // Encrypt sensitive environment variables
    if (Array.isArray(clonedData.environmentVariables)) {
      clonedData.environmentVariables.forEach((envVar: EnvironmentVariable) => {
        if (envVar.sensitive && envVar.value && !envVar.value.startsWith('enc_')) {
          const encryptedValue = CryptoJS.AES.encrypt(envVar.value, password).toString();
          envVar.value = `enc_${encryptedValue}`;
        }
      });
    }

    // Return the modified workspace (not wrapped in encryption envelope)
    return clonedData;
  } catch (error) {
    console.error("API key encryption error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to encrypt API keys"
    );
  }
};

/**
 * Check if a string value is an encrypted API key (starts with enc_)
 */
export const isEncryptedApiKey = (value: unknown): boolean => {
  return typeof value === 'string' && value.startsWith('enc_');
};

/**
 * Decrypt workspace data with password
 * For full encryption: decrypts the entire workspace
 * For API keys: decrypts only enc_ prefixed fields
 */
export const decryptWorkspaceData = (
  encryptedData: EncryptedWorkspace | WorkspaceData,
  password: string
): WorkspaceData => {
  try {
    if (!password) {
      throw new Error("Password is required");
    }

    // Check if it's a fully encrypted workspace (has wrapper)
    if ('encrypted' in encryptedData && encryptedData.encrypted === true) {
      if (encryptedData.algorithm !== "AES") {
        throw new Error("Invalid encrypted workspace format");
      }

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData.data, password);
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error("Invalid password");
      }
      
      const workspaceData = JSON.parse(decryptedString) as WorkspaceData;
      
      if (!workspaceData.id) {
        throw new Error("Decrypted data is not a valid workspace");
      }
      
      return workspaceData;
    }

    // Otherwise, it's a workspace with encrypted API keys
    // Deep clone to avoid mutations
    const workspaceData = JSON.parse(JSON.stringify(encryptedData)) as WorkspaceData;

    // Decrypt main workspace API key if encrypted
    if (isEncryptedApiKey(workspaceData.apiKey)) {
      try {
        const encryptedKey = workspaceData.apiKey.substring(4); // Remove enc_ prefix
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedKey, password);
        const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedString) {
          throw new Error("Invalid password");
        }
        
        workspaceData.apiKey = decryptedString;
      } catch {
        throw new Error("Invalid password");
      }
    }

    // Decrypt API keys in agents array
    if (Array.isArray(workspaceData.agents)) {
      workspaceData.agents.forEach((agent: Agent) => {
        if (isEncryptedApiKey(agent.apiKey)) {
          try {
            const encryptedKey = agent.apiKey.substring(4); // Remove enc_ prefix
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedKey, password);
            const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedString) {
              throw new Error("Invalid password");
            }
            
            agent.apiKey = decryptedString;
          } catch {
            throw new Error("Invalid password");
          }
        }
      });
    }

    // Decrypt sensitive environment variables
    if (Array.isArray(workspaceData.environmentVariables)) {
      workspaceData.environmentVariables.forEach((envVar: EnvironmentVariable) => {
        if (envVar.sensitive && isEncryptedApiKey(envVar.value)) {
          try {
            const encryptedValue = envVar.value.substring(4); // Remove enc_ prefix
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, password);
            const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedString) {
              throw new Error("Invalid password");
            }
            
            envVar.value = decryptedString;
          } catch {
            throw new Error("Invalid password");
          }
        }
      });
    }

    if (!workspaceData.id) {
      throw new Error("Invalid workspace data");
    }

    return workspaceData;
  } catch (error) {
    console.error("Decryption error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Invalid password") {
        throw new Error("Invalid password - please try again");
      }
      if (error.message.includes("JSON")) {
        throw new Error("Corrupted encrypted file");
      }
      throw error;
    }
    
    throw new Error("Failed to decrypt workspace");
  }
};

/**
 * Check if workspace has any encrypted API keys
 */
export const hasEncryptedApiKeys = (workspaceData: WorkspaceData): boolean => {
  // Check main API key
  if (isEncryptedApiKey(workspaceData.apiKey)) {
    return true;
  }

  // Check agents
  if (Array.isArray(workspaceData.agents)) {
    if (workspaceData.agents.some((agent: Agent) => isEncryptedApiKey(agent.apiKey))) {
      return true;
    }
  }

  // Check environment variables
  if (Array.isArray(workspaceData.environmentVariables)) {
    if (workspaceData.environmentVariables.some((envVar: EnvironmentVariable) => 
      envVar.sensitive && isEncryptedApiKey(envVar.value)
    )) {
      return true;
    }
  }

  return false;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'Password must be at least 6 characters'
    };
  }
  
  if (password.length < 10) {
    return {
      isValid: true,
      strength: 'medium',
      message: 'Medium strength password'
    };
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  const complexity = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (complexity >= 3) {
    return {
      isValid: true,
      strength: 'strong',
      message: 'Strong password'
    };
  }
  
  return {
    isValid: true,
    strength: 'medium',
    message: 'Consider adding numbers and special characters'
  };
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
};