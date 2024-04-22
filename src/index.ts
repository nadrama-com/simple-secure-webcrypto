const ALGO = "AES-GCM";
const HMAC_ALGO = "SHA-256";

export async function generateKey(keyLength = 256): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGO,
      length: keyLength, // Can be 128, 192, or 256 bits
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  return uint8ArrayToBase64(new Uint8Array(exportedKey));
}

export async function encrypt(key: string, plaintext: string): Promise<string> {
  const enc = new TextEncoder();
  // generate initilization vector
  // important: iv must never be reused with a given key.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // prepare key
  const cryptokeyAlgo = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: ALGO },
    false,
    ["encrypt"]
  );
  const cryptokeyHmac = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    {
      name: "HMAC",
      hash: { name: HMAC_ALGO },
    },
    false,
    ["sign"]
  );
  // encrypt plaintext to ciphertext
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGO,
      iv: iv,
    },
    cryptokeyAlgo,
    enc.encode(plaintext)
  );
  // convert iv and ciphertext to base64-encoded strings
  const ivString = uint8ArrayToBase64(iv);
  const ciphertextString = uint8ArrayToBase64(new Uint8Array(ciphertext));
  // sign ciphertextString.ivString
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptokeyHmac,
    enc.encode(ivString + "." + ciphertextString)
  );
  const signatureString = uint8ArrayToBase64(new Uint8Array(signature));
  return combine(ivString, ciphertextString, signatureString);
}

export async function decrypt(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  // decode ciphertext, iv, and signature
  const { ivString, ciphertextString, signatureString } = split(data);
  const iv = base64ToUint8Array(ivString);
  const ciphertext = base64ToUint8Array(ciphertextString);
  const signature = base64ToUint8Array(signatureString);
  // prepare key
  const cryptokeyAlgo = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: ALGO },
    false,
    ["decrypt"]
  );
  const cryptokeyHmac = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    {
      name: "HMAC",
      hash: { name: HMAC_ALGO },
    },
    false,
    ["verify"]
  );
  // verify signature for iv.ciphertext
  const isValid = await crypto.subtle.verify(
    "HMAC",
    cryptokeyHmac,
    signature,
    enc.encode(ivString + "." + ciphertextString)
  );
  if (!isValid) {
    throw new Error("Invalid signature");
  }
  // decrypt ciphertext to plaintext
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGO,
      iv: iv,
    },
    cryptokeyAlgo,
    ciphertext
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

// combine/split iv.ciphertext.signature

function combine(iv: string, ciphertext: string, signature: string) {
  return iv + "." + ciphertext + "." + signature;
}

function split(data: string) {
  const parts = data.split(".");
  if (parts.length !== 3) {
    throw new Error("invalid input");
  }
  return {
    ivString: parts[0],
    ciphertextString: parts[1],
    signatureString: parts[2],
  };
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
