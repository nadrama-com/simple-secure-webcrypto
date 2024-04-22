import { generateKey, encrypt, decrypt } from "./index";
import { expect, test } from "bun:test";

test("Test encrypt/decrypt", async () => {
  const secret1 = await generateKey(192);
  console.log("generated key: " + secret1);
  const data1 = "hello world";
  console.log("data: " + data1);
  const encrypted1 = await encrypt(secret1, data1);
  console.log("encrypted: " + encrypted1);
  const decrypted1 = await decrypt(secret1, encrypted1);
  console.log("decrypted: " + decrypted1);
  expect(encrypted1).not.toEqual(data1);
  expect(decrypted1).toEqual(data1);
});

test("Test decrypt throws on invalid input", async () => {
  const secret = await generateKey(192);
  expect(decrypt(secret, "invalid.input")).rejects.toThrow();
});
