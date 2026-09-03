# Midnight USDM Private Invoice

A privacy-oriented invoice DApp built on **Midnight Network Preview** using **Compact** smart contracts and **USDM** as the payment asset.

The application combines:

* A Compact invoice smart contract deployed on Midnight Preview.
* An application-layer **unshielded USDM transfer** for invoice settlement.
* A CLI interface for creating, paying, and reading invoice state.
* A real USDM payment followed by a successful `payInvoice()` contract interaction.

> **Built on Midnight Network using Compact.**

---

## Overview

**Midnight USDM Private Invoice** demonstrates an invoice payment workflow on Midnight.

The workflow is:

```text
Create Invoice
      │
      ▼
Midnight Compact Contract
      │
      │ pay invoice
      ▼
Application-layer USDM transfer
      │
      ▼
Unshielded USDM payment on Midnight Preview
      │
      ▼
payInvoice() contract interaction
      │
      ▼
Invoice marked as paid
```

The project uses USDM as the actual payment asset. The USDM transfer is performed by the application layer, while the Compact contract maintains the invoice payment state.

Because Preview USDM is an **unshielded token**, the USDM settlement itself is public on-chain. The Midnight contract remains responsible for the invoice state transition.

---

## Deployed Contract

The invoice contract is deployed on **Midnight Preview**.

**Contract Address:**

```text
a4dff7789033a495a60a256d8ee95c13a84dd29c3b3d1cf4d7b7195dae915cfd
```

The contract contains the original `private-invoice.compact` implementation created for this project and is not forked from another invoice application.

### Successful Preview interaction

A successful payment flow was executed against the deployed contract.

| Item                       | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Network                    | Midnight Preview                                                     |
| Contract                   | `a4dff7789033a495a60a256d8ee95c13a84dd29c3b3d1cf4d7b7195dae915cfd`   |
| USDM payment               | `0.000001 USDM`                                                      |
| USDM transaction           | `004b87ebc532f0aa29f2e2719e9ed9be57cad4a33e19a372284f1587c9b4b6b3cb` |
| Contract transaction       | `00b7b5abb93cde89fc67e0ed8c9b4a79c2a9b6da94bb7a0726a211cc1879c17d0c` |
| Contract interaction block | `699525`                                                             |
| Result                     | Successful                                                           |

The USDM transaction and the subsequent `payInvoice()` contract interaction were both submitted successfully.

---

## USDM Payment Architecture

### USDM is handled at the application layer

USDM is intentionally handled outside the Compact contract as an **application-layer unshielded token transfer**.

The Compact contract does not attempt to directly hold or transfer the USDM token. Instead, the CLI performs the USDM settlement first and then calls `payInvoice()` on the deployed invoice contract.

The payment flow is implemented in:

```text
src/cli.ts
```

The main USDM transfer function is:

```text
transferUsdm()
```

The function:

1. Parses and validates the recipient's Midnight Preview unshielded address.
2. Reads the wallet's current USDM balance.
3. Builds an unshielded USDM transfer.
4. Uses the Preview USDM token color.
5. Signs the transfer using the wallet's unshielded keystore.
6. Finalizes the transaction.
7. Submits the USDM payment to Midnight Preview.
8. Returns the USDM transaction ID.

After the USDM transaction is successfully submitted, the CLI calls:

```text
payInvoice()
```

on the Compact contract.

This means the application has a real USDM payment path rather than simply changing an invoice status.

---

## Preview USDM Asset

The application uses the Midnight Preview USDM token color:

```text
003bacd9a361ba0d425e408776020e40271375e8b8de42d73eec046a44947d73
```

USDM uses **6 decimal places**.

Therefore:

```text
1 USDM = 1,000,000 base units
```

For example:

```text
1000000 = 1 USDM
100000  = 0.1 USDM
1       = 0.000001 USDM
```

The token configuration is defined in:

```text
src/cli.ts
```

as:

```ts
const USDM_TOKEN_COLOR =
  '003bacd9a361ba0d425e408776020e40271375e8b8de42d73eec046a44947d73';

const USDM_DECIMALS = 6;
```

---

## Payment Implementation

The application builds an unshielded USDM transfer using the Midnight wallet SDK.

Conceptually, the payment path is:

```text
USDM_TOKEN_COLOR
       │
       ▼
wallet.transferTransaction()
       │
       ▼
wallet.signRecipe()
       │
       ▼
unshieldedKeystore.signData()
       │
       ▼
wallet.finalizeRecipe()
       │
       ▼
wallet.submitTransaction()
```

The relevant implementation is:

```text
src/cli.ts
```

The wallet's unshielded signing keystore is created in:

```text
src/wallet.ts
```

The signing step is important for unshielded transactions because the transaction must contain the required signatures before submission.

---

## Invoice Smart Contract

The main Compact contract is:

```text
contracts/private-invoice.compact
```

The contract maintains the invoice payment state:

```compact
export ledger invoicePaid: Boolean;
```

### Create invoice

```compact
export circuit createInvoice(
  amount: Uint<64>,
  counterparty: Bytes<32>
): [] {
  disclose(amount);
  disclose(counterparty);
  invoicePaid = false;
}
```

### Pay invoice

```compact
export circuit payInvoice(): [] {
  assert(!invoicePaid, "Invoice has already been paid");
  invoicePaid = true;
}
```

The contract's responsibility is to maintain the invoice state. The actual USDM settlement is performed by the application layer.

---

## Privacy Model

The project uses Midnight's Compact smart-contract infrastructure for the invoice workflow.

The **USDM payment itself is unshielded**, meaning the token transfer is publicly observable on-chain.

Therefore:

* Invoice state is managed by a Midnight Compact contract.
* USDM settlement is performed through an application-layer unshielded transfer.
* The USDM transfer should not be considered private.
* DUST and tNIGHT are separate from the USDM payment asset.

This architecture was chosen to provide a simple and reproducible USDM payment path while keeping the invoice contract small.

---

## CLI

The project provides an interactive command-line interface.

Start it with:

```bash
npm run cli -- --network preview
```

The CLI provides:

```text
1. Create Invoice
2. Pay Invoice
3. Read Invoice
4. Check wallet balance
5. Exit
```

### Create an invoice

Select:

```text
1
```

The CLI submits `createInvoice()` to the deployed Compact contract.

### Pay an invoice with USDM

Select:

```text
2
```

Enter the USDM amount in base units:

```text
Enter USDM payment amount (base units, 1 USDM = 1000000):
```

The CLI then:

```text
1/2 Sending USDM payment...
2/2 Marking invoice as paid...
```

The first transaction is the real USDM payment.

The second transaction calls `payInvoice()` on the Midnight contract.

### Read invoice state

Select:

```text
3
```

The CLI reads the invoice state directly from the deployed contract.

Example:

```text
─── Invoice State ─────────────────────────
Payment Status: PAID ✅
USDM Settlement: Application-layer unshielded USDM
```

### Check wallet balance

Select:

```text
4
```

The CLI displays the wallet's tNIGHT, USDM, and DUST balances.

---

## Configuration

The application-layer USDM recipient is configured using:

```text
USDM_RECIPIENT_ADDRESS
```

in the local `.env` file.

Example:

```text
USDM_RECIPIENT_ADDRESS=<MIDNIGHT_PREVIEW_UNSHIELDED_ADDRESS>
```

Do not commit `.env` or wallet credentials to the repository.

---

## Requirements

* Node.js 22+
* Docker
* Docker Compose v2
* Compact compiler
* Midnight Preview access
* A funded Midnight Preview wallet
* Preview USDM for payment testing

---

## Installation

Clone the repository:

```bash
git clone https://github.com/gentaadelarm/midnight-usdm-invoice.git
cd midnight-usdm-private-invoice
```

Install dependencies:

```bash
npm install
```

---

## Compile the Compact Contract

Compile the invoice contract:

```bash
npm run compile
```

The generated contract artifacts are placed under:

```text
contracts/managed/private-invoice/
```

---

## Local Midnight Services

Start the local services:

```bash
docker compose up -d
```

Check the services:

```bash
docker compose ps
```

The project uses:

| Service       |   Port | Purpose                 |
| ------------- | -----: | ----------------------- |
| Midnight Node | `9944` | Local Midnight node     |
| Indexer       | `8088` | Blockchain/indexer data |
| Proof Server  | `6300` | ZK proof generation     |

Stop the services:

```bash
docker compose down
```

---

## Deploy to Midnight Preview

The application supports Midnight Preview.

Deploy with:

```bash
npm run deploy -- --network preview
```

The deployment state is saved locally in:

```text
.midnight-state.json
```

Wallet and deployment state files are intentionally ignored by Git.

> The contract address documented in this README is the already deployed Preview contract used for the successful USDM payment test.

---

## Run Against Preview

Start the CLI:

```bash
npm run cli -- --network preview
```

The CLI synchronizes the wallet, connects to the deployed contract, and exposes the invoice/payment workflow.

---

## Network Configuration

Supported networks include:

* `undeployed` — local development
* `preview` — Midnight Preview
* `preprod` — Midnight Preprod

Preview example:

```bash
npm run cli -- --network preview
```

---

## Wallet and DUST

Midnight transactions require the appropriate network resources.

The application synchronizes:

* tNIGHT
* USDM
* DUST

Wallet synchronization state is cached locally in:

```text
.midnight-wallet-state/
```

This directory must not be committed to Git.

Check balances with:

```bash
npm run check-balance -- --network preview
```

---

## Project Structure

```text
midnight-usdm-private-invoice/
├── contracts/
│   ├── hello-world.compact
│   └── private-invoice.compact
│
├── src/
│   ├── cli.ts
│   ├── deploy.ts
│   ├── network.ts
│   ├── wallet.ts
│   ├── wallet-state.ts
│   ├── setup.ts
│   ├── check-balance.ts
│   ├── check-current-dust.ts
│   └── check-dust-available.ts
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

### Important files

**`contracts/private-invoice.compact`**

Original Compact invoice smart contract.

**`src/cli.ts`**

Interactive invoice interface and application-layer USDM settlement implementation.

**`src/wallet.ts`**

Creates and synchronizes the Midnight wallet, including the unshielded wallet used for USDM payments.

**`src/deploy.ts`**

Deploys the Compact contract to the selected Midnight network.

**`src/network.ts`**

Handles network configuration and deployment state.

---

## Available Commands

| Command                      | Description                                |
| ---------------------------- | ------------------------------------------ |
| `npm run compile`            | Compile the Compact invoice contract       |
| `npm run deploy`             | Deploy the contract                        |
| `npm run cli`                | Open the interactive invoice CLI           |
| `npm run check-balance`      | Check wallet balances                      |
| `npm run network`            | Show or change the active network          |
| `npm run proof-server:start` | Start local Midnight services              |
| `npm run proof-server:stop`  | Stop local Midnight services               |
| `npm run clean`              | Remove generated contract and wallet state |

---

## Development Notes

This project was built on **Midnight Network** using the **Compact** smart-contract language and Midnight SDK.

The invoice contract is an original implementation created for this project.

The USDM payment path is implemented at the application layer using Midnight's unshielded token transaction flow.

The successful Preview test demonstrated both:

1. A real USDM transfer.
2. A subsequent successful `payInvoice()` interaction with the deployed Compact contract.

---

## Security

Never commit:

* Wallet recovery phrases
* Private keys
* Seeds
* `.env`
* Generated wallet state
* Deployment state containing sensitive wallet information

The following local files/directories should remain private:

```text
.env
.midnight-state.json
.midnight-wallet-state/
```

Use testnet assets only when working on Midnight Preview.

---

## License

MIT
