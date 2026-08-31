import * as CSL from "@emurgo/cardano-serialization-lib-browser";

const hex =
  "00bc98bee29d4dd4a3ea8117227c09a60e676cacdebfba1cf4900b7d9d41771df56df2a4510936eba54913ed8295fc41d435919a59e65283b8";

const bytes = Uint8Array.from(
  hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
);

const address = CSL.Address.from_bytes(bytes);

console.log(address.to_bech32());
