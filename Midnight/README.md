# USDM Transfer Frontend

A web frontend for transferring **USDM between Cardano Preprod and Midnight Preview**, powered by the **VIA Labs USDM Bridge SDK**.

## Overview

This project provides a simple web interface for USDM cross-chain transfers between:

* Cardano Preprod
* Midnight Preview

The frontend connects to a Cardano wallet through **Lace Wallet** and communicates with a local Express backend that uses the VIA Labs USDM Bridge SDK.

## Features

* Connect Lace Wallet
* Display connected Cardano address
* Select transfer direction
* Enter USDM transfer amount
* Enter recipient address
* Submit USDM bridge transactions
* Display transaction hash
* Open completed transactions in VIA Scan

## Architecture

```text
Lace Wallet
     │
     │ CIP-30
     ▼
React + Vite Frontend
     │
     │ HTTP API
     ▼
Express Backend
     │
     │ @via-labs-tech/usdm-bridge
     ▼
VIA Labs USDM Bridge
     │
     ├── Cardano Preprod
     │
     └── Midnight Preview
```

## Project Structure

```text
.
├── server/
│   └── index.mjs
│
├── web/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── package.json
├── package-lock.json
└── README.md
```

## Requirements

* Node.js
* npm
* Lace Wallet
* Cardano Preprod wallet
* Midnight Preview environment
* VIA Labs USDM Bridge SDK

## Installation

Install the backend dependencies:

```bash
npm install
```

Install the frontend dependencies:

```bash
cd web
npm install
cd ..
```

## Environment

The USDM Bridge SDK uses its configured environment for the Cardano Preprod and Midnight Preview networks.

Keep wallet credentials and other secrets in environment files and **never commit them to GitHub**.

## Running the Backend

From the project root:

```bash
node server/index.mjs
```

The backend runs at:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "ok": true,
  "service": "USDM Transfer Frontend"
}
```

## Running the Frontend

Open another terminal:

```bash
cd web
npm run dev
```

Vite will provide the local frontend URL, normally:

```text
http://localhost:5173/
```

Open that URL in a browser with Lace Wallet installed.

## USDM Transfer

1. Open the frontend.
2. Click **Connect Lace Wallet**.
3. Approve the Lace connection request.

> **Important:** The Cardano wallet connected through Lace must be the same wallet configured for the VIA Labs USDM Bridge SDK. The backend verifies the connected Lace address against the configured bridge wallet before submitting a Cardano → Midnight transfer. If the addresses do not match, the transfer is rejected.

4. Select the transfer direction.
5. Enter the USDM amount.
6. Enter the destination address.
7. Click **Transfer USDM**.
8. Wait for the bridge transaction to complete.
9. Use the displayed transaction hash to verify the transaction.

## Verified Transfer

A successful USDM transfer was completed using this frontend.

**Transaction Hash:**

```text
eba5876e7a10efcd2b91f5a74d3a7127dc91b3aa0ef386170d6be5b6ec43dbe1
```

**VIA Scan:**

https://scan.vialabs.tech/tx/eba5876e7a10efcd2b91f5a74d3a7127dc91b3aa0ef386170d6be5b6ec43dbe1

## Attribution

This project uses the **VIA Labs USDM Bridge SDK** for USDM cross-chain transfer functionality.

The project targets the **Midnight** Preview network and Cardano Preprod environment.

* VIA Labs — USDM cross-chain bridge infrastructure
* Midnight — privacy-focused blockchain network

## Network

| Network  | Environment |
| -------- | ----------- |
| Cardano  | Preprod     |
| Midnight | Preview     |
| Asset    | USDM        |

## Security

Do not commit:

* Wallet mnemonics
* Private keys
* `.env` files
* Wallet state
* Local database/state files
* Other credentials or secrets

The repository `.gitignore` is configured to exclude sensitive local files.

## License

This project is provided for demonstration and integration purposes.

