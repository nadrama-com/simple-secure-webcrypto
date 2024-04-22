import { generateKey, encrypt, decrypt } from "./index";
import { expect, test } from "bun:test";

test("generateKey: keys must be unique", async () => {
  const key1 = await generateKey();
  const key2 = await generateKey();
  expect(key1).not.toEqual(key2);
});

test("generateKey: key must be 32 bits (44 bits as base64)", async () => {
  const key1 = await generateKey();
  expect(key1.length).toEqual(44);
});

test("encrypt & decrypt: test encrypt then decrypt", async () => {
  const secret1 = await generateKey();
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

test("decrypt: should throw on invalid input", async () => {
  const secret = await generateKey();
  expect(decrypt(secret, "invalid.input")).rejects.toThrow();
});
