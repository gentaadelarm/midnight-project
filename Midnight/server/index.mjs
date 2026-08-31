import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { bridgeUSDM, getLucid } from "@via-labs-tech/usdm-bridge";
import { Address } from "@emurgo/cardano-serialization-lib-nodejs";

import {
  createInvoice,
  payInvoice,
  readInvoice,
} from "./invoice.mjs";

dotenv.config({
  path: ".env",
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "USDM Transfer Frontend",
  });
});

app.get("/api/wallet", async (req, res) => {
  try {
    const lucid = await getLucid();
    const address = await lucid.wallet().address();

    res.json({
      success: true,
      address,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/transfer", async (req, res) => {
  try {
    const {
      direction,
      amount,
      recipient,
      walletAddress,
    } = req.body;

    if (!direction || !amount || !recipient || !walletAddress) {
      return res.status(400).json({
        success: false,
        error:
          "direction, amount, recipient, and walletAddress are required",
      });
    }

    if (
      direction !== "cardano-to-midnight" &&
      direction !== "midnight-to-cardano"
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid transfer direction",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than 0",
      });
    }

    /*
     * For Cardano → Midnight, verify that the connected
     * Lace wallet matches the Cardano wallet used by the SDK.
     *
     * For Midnight → Cardano, the SDK does not expose the
     * browser wallet as a signer, so this check is only
     * required on the Cardano source side.
     */
    if (direction === "cardano-to-midnight") {
  const lucid = await getLucid();
  const sdkAddress = await lucid.wallet().address();

  let connectedAddress;

  try {
    connectedAddress = Address.from_bytes(
      Buffer.from(walletAddress, "hex")
    ).to_bech32();
  } catch (e) {
    return res.status(400).json({
      success: false,
      error: "Invalid Cardano wallet address format.",
    });
  }

  console.log("Lace address:", connectedAddress);
  console.log("SDK address:", sdkAddress);

  if (sdkAddress !== connectedAddress) {
    return res.status(403).json({
      success: false,
      error:
        "Connected wallet does not match the configured USDM bridge wallet.",
      connectedAddress,
      sdkAddress,
    });
  }
}

    const result = await bridgeUSDM({
      direction,
      amount: String(amount),
      recipient,
    });

    res.json({
      success: true,
      txHash: result.txHash,
      txId: result.txId ?? null,
      direction,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/invoice/create", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than 0.",
      });
    }

    const result = await createInvoice(amount);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);

    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

app.post("/api/invoice/pay", async (req, res) => {
  try {
    const result = await payInvoice();

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("PAY INVOICE ERROR:", error);

    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

app.get("/api/invoice", async (req, res) => {
  try {
    const result = await readInvoice();

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("READ INVOICE ERROR:", error);

    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`USDM backend running at http://localhost:${PORT}`);
});
