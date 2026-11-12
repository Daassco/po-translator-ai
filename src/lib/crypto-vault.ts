// Web Crypto API Vault: SubtleCrypto dengan AES-GCM 256-bit + PBKDF2
// Menyediakan enkripsi tingkat militer di sisi browser (Zero Server Liability & XSS Protected)

export interface EncryptedVaultData {
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes AES-GCM)
  salt: string;       // Base64 (16 bytes PBKDF2)
  maskedKey: string;  // e.g. "AIzaSy••••••••3aB8"
  createdAt: string;
}

const PBKDF2_ITERATIONS = 100_000; // Standar OWASP rekomendasi untuk derivasi kunci
const KEY_LENGTH_BITS = 256;

// Helper: ArrayBuffer ke Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Base64 ke Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Masking UI: AIzaSy...3aB8 (Mencegah intipan layar / shoulder surfing)
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) return "••••••••••••••••";
  const prefix = apiKey.slice(0, 6);
  const suffix = apiKey.slice(-4);
  return `${prefix}••••••••••••${suffix}`;
}

// Derivasi kunci AES-GCM dari PIN/Passphrase menggunakan PBKDF2
async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const pinKeyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    pinKeyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Enkripsi API Key menggunakan PIN/Passphrase lokal pengguna
 */
export async function encryptApiKey(apiKey: string, pin: string): Promise<EncryptedVaultData> {
  const enc = new TextEncoder();
  const plainTextBuffer = enc.encode(apiKey.trim());

  // Buat random salt (16 bytes) dan IV (12 bytes untuk AES-GCM)
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derivasi kunci kriptografi
  const aesKey = await deriveKeyFromPin(pin, salt);

  // Enkripsi dengan AES-GCM (menyertakan authentication tag anti-tamper)
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    aesKey,
    plainTextBuffer
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    maskedKey: maskApiKey(apiKey),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Dekripsi API Key menggunakan PIN pengguna
 * Akan melempar error jika PIN salah (verifikasi tag autentikasi gagal)
 */
export async function decryptApiKey(vaultData: EncryptedVaultData, pin: string): Promise<string> {
  try {
    const salt = base64ToBuffer(vaultData.salt);
    const iv = base64ToBuffer(vaultData.iv);
    const ciphertext = base64ToBuffer(vaultData.ciphertext);

    // Derivasi kunci yang sama
    const aesKey = await deriveKeyFromPin(pin, salt);

    // Dekripsi data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource,
      },
      aesKey,
      ciphertext as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error("PIN / Passphrase salah! Verifikasi dekripsi AES-GCM gagal.");
  }
}
