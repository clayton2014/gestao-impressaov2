export async function pbkdf2(password: string, saltB64: string, iterations = 100_000): Promise<string> {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  const bytes = new Uint8Array(bits);
  let b64 = ""; 
  for (const b of bytes) b64 += String.fromCharCode(b);
  return btoa(b64);
}

export function genSalt(len = 16): string {
  const bytes = new Uint8Array(len); 
  crypto.getRandomValues(bytes);
  let b64 = ""; 
  for (const b of bytes) b64 += String.fromCharCode(b);
  return btoa(b64);
}

export async function hashPassword(password: string): Promise<{salt: string; hash: string}> {
  const salt = genSalt(); 
  const hash = await pbkdf2(password, salt); 
  return { salt, hash };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const h = await pbkdf2(password, salt); 
  return h === hash;
}

// Validação de email simples
export function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

// Validação de telefone (10-12 dígitos)
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 12;
}

// Normalizar telefone (apenas dígitos)
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// Validação de senha
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}