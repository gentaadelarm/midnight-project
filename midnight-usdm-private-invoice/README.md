# Midnight USDM Private Invoice

A private invoice DApp built on **Midnight Network Preview** using **Compact** smart contracts.

The project demonstrates a privacy-oriented invoice workflow where an invoice can be created, paid, and read from the Midnight blockchain through a command-line interface.

> **Network:** Midnight Preview
> **Contract:** `private-invoice`
> **Interface:** Interactive CLI
> **Status:** Deployed and tested on Midnight Preview

---

## Overview

**Midnight USDM Private Invoice** is a Compact-based invoice application designed around a simple payment workflow:

1. Create an invoice with an amount.
2. Store the invoice state on Midnight.
3. Pay the invoice.
4. Verify the payment state directly from the blockchain.

The application uses Midnight's smart-contract infrastructure and ZK-enabled transaction flow while keeping the application architecture simple enough to run locally or against Midnight Preview.

---

## Deployed Contract

The original `private-invoice.compact` contract has been deployed successfully to **Midnight Preview**.

**Contract Address:**

```text
c3e2cf06deb371c064dad59fda36a878933736b0331e2eed9baf1e782abff2ba
```

### Successful on-chain interactions

The deployed contract has been tested with successful transactions after deployment.

| Action              |    Block |
| ------------------- | -------: |
| Contract deployment | `633009` |
| Create invoice      | `633009` |
| Pay invoice         | `633028` |

### Example transaction IDs

**Create Invoice**

```text
00fe7022c77a84b78f8811fb2c3561e0d9784821c41ef0d311f67ddc85b412a04c
```

**Pay Invoice**

```text
009fd56c8aaa99a7d9b9e08c5d9310dfb9f1c7e53aecfa5eb8f19c488df8dcfadb
```

The invoice was subsequently read from the blockchain with:

```text
Invoice Amount: 100
Invoice Paid:   YES
```

---

## Smart Contract

The main Compact contract is:

```text
contracts/private-invoice.compact
```

It defines two public ledger values:

```compact
export ledger invoiceAmount: Uint<64>;
export ledger invoicePaid: Boolean;
```

And two circuits:

```compact
export circuit createInvoice(amount: Uint<64>): [] {
  invoiceAmount = disclose(amount);
  invoicePaid = false;
}

export circuit payInvoice(): [] {
  assert(!invoicePaid, "Invoice has already been paid");
  invoicePaid = true;
}
```

The contract is an original implementation for this project and is not a fork of an existing invoice contract.

---

## USDM Payment Architecture

The invoice application is designed around a USDM payment workflow.

The current contract stores the invoice amount and payment status on Midnight. The current `payInvoice()` circuit records the invoice as paid but **does not itself perform a USDM token transfer**.

Therefore, USDM handling is currently separated from the invoice state machine at the application level.

Relevant contract code:

```text
contracts/private-invoice.compact
```

Relevant application code:

```text
src/cli.ts
```

The CLI is responsible for interacting with the deployed invoice contract and displaying the resulting invoice state.

> **Important:** The current implementation should be considered an invoice/payment-state prototype rather than a completed on-chain USDM transfer implementation. A future version can connect the payment circuit to an actual USDM asset transfer or application-layer USDM settlement flow.

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

Then enter the invoice amount:

```text
Enter invoice amount: 100
```

The CLI submits the transaction and displays the transaction ID and block height.

### Pay an invoice

Select:

```text
2
```

The payment circuit is submitted to the deployed contract.

### Read invoice state

Select:

```text
3
```

Example:

```text
─── Invoice State ─────────────────────────
Invoice Amount: 100
Invoice Paid:   YES
```

### Check wallet balance

Select:

```text
4
```

The CLI displays the wallet's tNIGHT and DUST balances.

---

## Requirements

* Node.js 22+
* Docker
* Docker Compose v2
* Compact compiler
* Midnight Preview access
* A funded Preview wallet for transaction execution

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

The compiled contract is generated under:

```text
contracts/managed/private-invoice/
```

---

## Local Proof Server

Start the local Midnight services:

```bash
docker compose up -d
```

Check the services:

```bash
docker compose ps
```

The project uses:

| Service      |   Port | Purpose                 |
| ------------ | -----: | ----------------------- |
| Node         | `9944` | Midnight node           |
| Indexer      | `8088` | Blockchain/indexer data |
| Proof Server | `6300` | ZK proof generation     |

Stop the services with:

```bash
docker compose down
```

---

## Deploy to Midnight Preview

The application supports the Midnight Preview network.

Deploy with:

```bash
npm run deploy -- --network preview
```

After deployment, the contract address is saved locally in:

```text
.midnight-state.json
```

The state file is intentionally ignored by Git because it contains wallet information.

---

## Run the CLI Against Preview

After deployment:

```bash
npm run cli -- --network preview
```

The CLI reconnects to the deployed contract and synchronizes the wallet with Midnight Preview.

---

## Network Configuration

The project supports:

* `undeployed` — local Midnight development network
* `preview` — Midnight Preview
* `preprod` — Midnight Preprod

Examples:

```bash
npm run deploy -- --network preview
```

```bash
npm run cli -- --network preview
```

Check the active network:

```bash
npm run network
```

Switch networks:

```bash
npm run network preview
```

---

## Wallet and DUST

Transactions on Midnight require the appropriate network resources.

For Preview, the project uses a generated wallet and tNIGHT obtained from the Midnight Preview faucet.

The wallet synchronization state is cached locally in:

```text
.midnight-wallet-state/
```

This directory is ignored by Git.

The project also monitors the wallet's DUST balance because DUST is required for transaction execution.

Check the wallet balance with:

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
├── tsconfig.json
└── README.md
```

### Important files

**`contracts/private-invoice.compact`**

Original Compact invoice smart contract.

**`src/deploy.ts`**

Deploys the compiled contract to the selected Midnight network.

**`src/cli.ts`**

Interactive interface for creating, paying, and reading invoices.

**`src/network.ts`**

Handles network configuration and deployment state.

**`src/wallet.ts`**

Creates and synchronizes the Midnight wallet.

---

## Available Commands

| Command                      | Description                                |
| ---------------------------- | ------------------------------------------ |
| `npm run compile`            | Compile the Compact invoice contract       |
| `npm run deploy`             | Deploy the contract                        |
| `npm run cli`                | Open the interactive invoice CLI           |
| `npm run check-balance`      | Check tNIGHT and DUST balances             |
| `npm run network`            | Show or change the active network          |
| `npm run proof-server:start` | Start the local proof server/services      |
| `npm run proof-server:stop`  | Stop the local services                    |
| `npm run clean`              | Remove generated contract and wallet state |

For Preview:

```bash
npm run deploy -- --network preview
```

```bash
npm run cli -- --network preview
```

---

## Development Notes

This project was built on **Midnight Network** using the **Compact** smart-contract language and Midnight SDK.

The application intentionally keeps the invoice contract small so the payment-state workflow can be easily inspected and reproduced.

The `private-invoice.compact` contract is the original contract created for this project.

---

## Security

Never commit wallet recovery phrases, private keys, seeds, or generated wallet state to the repository.

The following files contain local wallet/deployment state and should remain private:

```text
.midnight-state.json
.midnight-wallet-state/
```

Use testnet funds only when working on Midnight Preview.

---

## License

MIT
