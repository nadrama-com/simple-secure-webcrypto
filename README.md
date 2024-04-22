# simple-secure-webcrypto

This __Simple Secure WebCrypto__ library was created to make it easy to do symmetric encryption and decryption of strings using the Web Crypto API, which provides the SubtleCrypto interface with low-level cryptographic functions.

## Features

✅ Zero package dependencies - exclusively uses WebCrypto API.

✅ Works on browser platforms like Cloudflare Workers.

✅ Secure defaults; uses AES-GCM (authenticated encryption) with a 256 bit key.

✅ Written in TypeScript.

## Who is this library for?

If you're a developer building on platforms such as Cloudflare Pages or Cloudflare Workers and want to easily encrypt and decrypt some data with just an secret from an environment variable, this library provides a simple interface to do so.

## Usage

Install via your package manager:

```
bun install simple-secure-webcrypto
```

Then invoke the async `encrypt` and `decrypt` functions:

```
import { encrypt, decrypt } from "simple-secure-webcrypto";

const someData = "hello world";
try {
    const encrypted = await encrypt(env.ENCRYPTION_SECRET, someData);
    const decrypted = await decrypt(env.ENCRYPTION_SECRET, encrypted);
} catch (error) {
    console.log(error);
}
```

Note: the `decrypt` function will throw an error if the encrypted data is in an invalid format.

To generate a new random encryption secret key, we created the `genkey.ts` helper:

```
import { generateKey } from "./src/index";
console.log(await generateKey());
```

which you can run from this repository root with:

```bash
bun run ./genkey.ts
```

## How does it work?

Under the hood the SubtleCrypto interface provides encryption and decryption functions which support multiple algorithms.

The encrypted string returns from our `encrypt` function will be encoded as `iv.ciphertext` where:

* IV is the base64 encoded Initialization Vector (IV) aka nonce, randomly generated on each `encrypt` function invocation.

* Ciphertext is the base64 encoded AES-GCM encrypted value.

The returned string can safely be stored in a database or cookie; AES-GCM uses authenticated encryption, which will fail if either the ciphertext or IV cannot be verified, per `Appendix B: Authentication Assurance` in [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final).

## License

MIT

## Credit

Thank you to [Nadrama.com](https://nadrama.com) for sponsoring this work! Nadrama enables you to run a Kubernetes PaaS in your cloud account, in minutes.

## References

* [MDN Web Crypto API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

* [MDN Example AES-GCM implementation](https://github.com/mdn/dom-examples/blob/main/web-crypto/encrypt-decrypt/aes-gcm.js)

* [MDN SubtleCrypto supported algorithms](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#supported_algorithms)

* [Cloudflare Web Crypto supported algorithms](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#supported-algorithms)

* [NIST SP 800-38D: AES in Galois/Counter Mode](https://csrc.nist.gov/pubs/sp/800/38/d/final)

## Development

We're using TypeScript, Bun, Bun test, Prettier, and ESLint.

To install dev dependencies:

```bash
bun install
```

To run prettier and eslint:

```bash
bun run pretty
bun run lint
```

To run tests:

```bash
bun test
```

To build:

```
bun run build
```

## Security

Please reach out to [Nadrama](https://nadrama.com) or [@ryan0x44](https://ryan0x44.com) if you have any security related questions or concerns.
