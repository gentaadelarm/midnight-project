import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WebSocket } from "ws";

import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

import {
  resolveNetwork,
  getOrCreateWallet,
  getDeployment,
} from "../../midnight-usdm-private-invoice/src/network.ts";

import {
  createWallet,
  persistWalletState,
} from "../../midnight-usdm-private-invoice/src/wallet.ts";

globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = "privateInvoicePrivateState";

const { network, config: networkConfig } = resolveNetwork();
const WALLET = getOrCreateWallet(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const zkConfigPath = path.resolve(
  __dirname,
  "../../midnight-usdm-private-invoice/contracts/managed/private-invoice"
);

const contractPath = path.join(
  zkConfigPath,
  "contract",
  "index.js"
);

if (!fs.existsSync(contractPath)) {
  throw new Error(
    "Compiled invoice contract not found. Run npm run compile in midnight-usdm-private-invoice."
  );
}

const PrivateInvoice = await import(
  pathToFileURL(contractPath).href
);

const compiledContract = CompiledContract.make(
  "private-invoice",
  PrivateInvoice.Contract
).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath)
);

let walletCtxPromise;

async function getWalletContext() {
  if (!walletCtxPromise) {
    walletCtxPromise = (async () => {
      const ctx = await createWallet({
        network,
        networkConfig,
        seed: WALLET.seed,
      });

      await ctx.wallet.waitForSyncedState();
      await persistWalletState(network, ctx);

      return ctx;
    })();
  }

  return walletCtxPromise;
}

async function createProviders(walletCtx) {
  const privateStatePassword =
    process.env.PRIVATE_STATE_PASSWORD?.trim() ||
    "Local-Devnet-Development-Placeholder-1";

  const walletProvider = {
    getCoinPublicKey: () =>
      walletCtx.shieldedSecretKeys.coinPublicKey,

    getEncryptionPublicKey: () =>
      walletCtx.shieldedSecretKeys.encryptionPublicKey,

    async balanceTx(tx, ttl) {
      const recipe =
        await walletCtx.wallet.balanceUnboundTransaction(
          tx,
          {
            shieldedSecretKeys:
              walletCtx.shieldedSecretKeys,
            dustSecretKey:
              walletCtx.dustSecretKey,
          },
          {
            ttl:
              ttl ??
              new Date(Date.now() + 30 * 60 * 1000),
          }
        );

      return walletCtx.wallet.finalizeRecipe(recipe);
    },

    submitTx: (tx) =>
      walletCtx.wallet.submitTransaction(tx),
  };

  const accountId =
    walletCtx.unshieldedKeystore
      .getBech32Address()
      .toString();

  const zkConfigProvider =
    new NodeZkConfigProvider(zkConfigPath);

  return {
    privateStateProvider:
      levelPrivateStateProvider({
        privateStateStoreName:
          "private-invoice-state",
        accountId,
        privateStoragePasswordProvider:
          () => privateStatePassword,
      }),

    publicDataProvider:
      indexerPublicDataProvider(
        networkConfig.indexer,
        networkConfig.indexerWS
      ),

    zkConfigProvider,

    proofProvider:
      httpClientProofProvider(
        networkConfig.proofServer,
        zkConfigProvider
      ),

    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function getInvoiceContract() {
  const deployment = getDeployment(network);

  if (!deployment) {
    throw new Error(
      `No deployed invoice contract found for network ${network}.`
    );
  }

  const walletCtx = await getWalletContext();
  const providers = await createProviders(walletCtx);

  const deployed = await findDeployedContract(
    providers,
    {
      compiledContract: compiledContract,
      contractAddress: deployment.address,
    }
  );

  return {
    deployed,
    providers,
    walletCtx,
    contractAddress: deployment.address,
  };
}

export async function createInvoice(amount) {
  const value = BigInt(String(amount));

  if (value <= 0n) {
    throw new Error("Invoice amount must be greater than 0.");
  }

  const {
    deployed,
    walletCtx,
    contractAddress,
  } = await getInvoiceContract();

  const tx =
    await deployed.callTx.createInvoice(value);

  await persistWalletState(network, walletCtx);

  return {
    txId: tx.public?.txId ?? null,
    blockHeight:
      tx.public?.blockHeight ?? null,
    contractAddress,
    amount: value.toString(),
  };
}

export async function payInvoice() {
  const {
    deployed,
    walletCtx,
    contractAddress,
  } = await getInvoiceContract();

  const tx =
    await deployed.callTx.payInvoice();

  await persistWalletState(network, walletCtx);

  return {
    txId: tx.public?.txId ?? null,
    blockHeight:
      tx.public?.blockHeight ?? null,
    contractAddress,
  };
}

export async function readInvoice() {
  const {
    providers,
    contractAddress,
  } = await getInvoiceContract();

  const contractState =
    await providers.publicDataProvider
      .queryContractState(contractAddress);

  if (!contractState) {
    return {
      exists: false,
      contractAddress,
    };
  }

  const ledger =
    PrivateInvoice.ledger(
      contractState.data
    );

  return {
    exists: true,
    contractAddress,
    invoiceAmount:
      ledger.invoiceAmount.toString(),
    invoicePaid:
      Boolean(ledger.invoicePaid),
  };
}
