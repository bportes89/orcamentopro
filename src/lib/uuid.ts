import { randomUUID } from "expo-crypto";

type GlobalCrypto = {
  randomUUID?: () => string;
};

if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {},
    writable: true,
  });
}

const globalCrypto = globalThis.crypto as GlobalCrypto;

if (typeof globalCrypto.randomUUID !== "function") {
  globalCrypto.randomUUID = () => randomUUID();
}
