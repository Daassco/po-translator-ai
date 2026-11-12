/**
 * Client-Side URL Security Validator & Sanitizer
 * 
 * Proteksi terhadap:
 * 1. SSRF / Private Probing: Memblokir Cloud Metadata Service (169.254.169.254, metadata.google.internal).
 * 2. Protocol Smuggling & XSS: Hanya mengizinkan 'http:' dan 'https:' (menolak javascript:, file:, data:, blob:).
 * 3. Sensitive Port Scanning: Memblokir port database (3306, 5432, 6379), SSH (22), SMB (445), dan Docker (2375).
 * 4. Plaintext Credential Exposure: Mewajibkan HTTPS untuk endpoint eksternal non-localhost.
 * 5. Credential Stripping: Membuang userinfo (user:pass@) dari URL.
 */

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl: string;
  error?: string;
  isLocal: boolean;
  isSecureHttps: boolean;
}

// Daftar host/IP terlarang (Cloud Metadata & Link-Local)
const BLOCKED_HOSTS = new Set([
  "169.254.169.254", // AWS, GCP, Azure, DigitalOcean Instance Metadata
  "metadata.google.internal", // GCP Internal Metadata
  "100.100.100.200", // Alibaba Cloud Metadata
  "0.0.0.0",
  "::",
  "[::]",
]);

// Daftar port sensitif non-HTTP yang diblokir untuk mencegah eksploitasi internal
const BLOCKED_PORTS = new Set([
  21,   // FTP
  22,   // SSH
  23,   // Telnet
  25,   // SMTP
  53,   // DNS
  110,  // POP3
  135,  // RPC
  139,  // NetBIOS
  143,  // IMAP
  445,  // SMB
  1433, // MSSQL
  1521, // Oracle
  2375, // Docker Plain
  2376, // Docker TLS
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  9200, // Elasticsearch
  27017,// MongoDB
]);

/**
 * Memeriksa apakah host merupakan local loopback
 */
export function isLocalLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1" ||
    host.startsWith("127.")
  );
}

/**
 * Memeriksa apakah host merupakan IP lokal LAN pribadi (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
 */
export function isPrivateLanHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  );
}

/**
 * Validasi dan sanitasi Base URL kustom untuk OpenAI-compatible & Ollama
 */
export function validateAndSanitizeBaseUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || rawUrl.trim() === "") {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: "Base URL tidak boleh kosong.",
      isLocal: false,
      isSecureHttps: false,
    };
  }

  // Bersihkan karakter CRLF / kontrol untuk mencegah header injection
  const cleaned = rawUrl.trim().replace(/[\r\n\t\x00-\x1F\x7F]/g, "");

  let parsed: URL;
  try {
    // Tambahkan protokol default jika pengguna mengetik tanpa protokol
    const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `http://${cleaned}`;
    parsed = new URL(withProtocol);
  } catch {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: "Format URL tidak valid. Contoh yang benar: 'http://localhost:11434/v1' atau 'https://api.openai.com/v1'.",
      isLocal: false,
      isSecureHttps: false,
    };
  }

  // 1. Validasi Protokol: Hanya HTTP dan HTTPS
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: `Protokol '${parsed.protocol}' dilarang demi keamanan. Gunakan 'http:' atau 'https:'.`,
      isLocal: false,
      isSecureHttps: false,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocal = isLocalLoopbackHost(hostname);
  const isLan = isPrivateLanHost(hostname);
  const isSecureHttps = parsed.protocol === "https:";

  // 2. Proteksi Cloud Metadata & Link-Local IP (Anti-SSRF)
  if (BLOCKED_HOSTS.has(hostname) || hostname.startsWith("169.254.")) {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: `Host '${hostname}' terdeteksi sebagai Cloud Metadata / Link-Local IP dan diblokir demi keamanan.`,
      isLocal: false,
      isSecureHttps,
    };
  }

  // 3. Proteksi Port Sensitif
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    if (BLOCKED_PORTS.has(portNum)) {
      return {
        isValid: false,
        sanitizedUrl: "",
        error: `Port ${portNum} merupakan port layanan sensitif dan dilarang untuk endpoint AI.`,
        isLocal,
        isSecureHttps,
      };
    }
  }

  // 4. Aturan Keamanan Jaringan: Non-localhost dan Non-LAN WAJIB HTTPS
  // Mencegah pengiriman API Key dan dokumen PO dalam bentuk teks terang (unencrypted) melalui internet publik
  if (!isSecureHttps && !isLocal && !isLan) {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: "Endpoint internet publik wajib menggunakan HTTPS terenkripsi untuk mencegah penyadapan API Key.",
      isLocal: false,
      isSecureHttps: false,
    };
  }

  // 5. Bersihkan userinfo kredensial (user:pass@host)
  parsed.username = "";
  parsed.password = "";

  // 6. Normalisasi URL: Hapus trailing slash
  const sanitizedUrl = parsed.toString().replace(/\/+$/, "");

  return {
    isValid: true,
    sanitizedUrl,
    isLocal,
    isSecureHttps,
  };
}
