const ALGO = "AES-GCM";

// generateKey produces a random base64-encoded 256 bit key
// note that the base64 string is therefore 352 bits
export async function generateKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGO,
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  return uint8ArrayToBase64(new Uint8Array(exportedKey));
}

// prepareKey expects a base64-encoded 256 bit secret key, decodes it
// and returns it as a CryptoKey ready for encryption or decryption
export async function prepareKey(secret: string): Promise<CryptoKey> {
  // decode key and check key length
  let key: Uint8Array;
  try {
    key = base64ToUint8Array(secret);
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "InvalidCharacterError"
    ) {
      throw new Error(
        "Encryption secret contains invalid characters - it must be base64-encoded",
      );
    }
    throw error;
  }
  if (key.length !== 32) {
    throw new Error("Invalid secret key length - must be 256 bits (32 bytes)");
  }
  return crypto.subtle.importKey("raw", key, { name: ALGO }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// encrypt expects a base64-encoded 256 bit secret key and plaintext, then
// generates a random 96-bit value for the Initalization Vector (IV),
// and uses AES-GCM to encrypt the plaintext, then return a base64 encoded IV
// and ciphertext as a string in the format: iv.ciphertext
export async function encrypt(
  secret: string,
  plaintext: string,
): Promise<string> {
  const key = await prepareKey(secret);
  // generate a random 96 bit (12 byte) initilization vector
  // important: iv must never be reused with a given key.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // encrypt plaintext to ciphertext
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGO,
      iv: iv,
    },
    key,
    enc.encode(plaintext),
  );
  // convert iv and ciphertext to base64-encoded strings
  const ivString = uint8ArrayToBase64(iv);
  const ciphertextString = uint8ArrayToBase64(new Uint8Array(ciphertext));
  return ivString + "." + ciphertextString;
}

// decrypt expects a base64-encoded 256 bit secret key and a string in the
// format: iv.ciphertext
// where iv is a base64-encoded 96-bit Initialization Vector (IV) randomly
// generated (and only used once) by the encode function,
// and ciphertext is base64 encoded AES-GCM encrypted plaintext.
// it then decrypts this ciphertext and returns the plaintext string.
export async function decrypt(secret: string, data: string): Promise<string> {
  const key = await prepareKey(secret);
  // get iv and ciphertext
  const parts = data.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid input");
  }
  const iv = base64ToUint8Array(parts[0]);
  if (iv.length != 12) {
    throw new Error("Invalid IV length - must be 96 bits (12 bytes)");
  }
  const ciphertext = base64ToUint8Array(parts[1]);
  if (ciphertext.length == 0) {
    throw new Error("Invalid ciphertext length - cannot be empty");
  }
  // decrypt ciphertext to plaintext
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGO,
      iv: iv,
    },
    key,
    ciphertext,
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

// convert Uint8Array from/to base64

function base64ToUint8Array(base64: string): Uint8Array {
  // Decode the Base64 string to a regular string
  const binaryString = atob(base64);

  // Create a Uint8Array with the same length as the decoded string
  const bytes = new Uint8Array(binaryString.length);

  // Convert each character to its ASCII value
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Convert Uint8Array to a string using fromCharCode
  const binaryString = String.fromCharCode.apply(null, Array.from(bytes));

  // Encode the binary string to a Base64 string
  const base64 = btoa(binaryString);

  return base64;
}
