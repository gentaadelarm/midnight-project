import { useState } from "react";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState(null);
  const [address, setAddress] = useState("");
  const [direction, setDirection] = useState("cardano-to-midnight");
  const [amount, setAmount] = useState("5");
  const [recipient, setRecipient] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function connectLace() {
    try {
      setError("");

      if (!window.cardano || !window.cardano.lace) {
        throw new Error("Lace Wallet was not detected.");
      }

      const api = await window.cardano.lace.enable();
      const addresses = await api.getUsedAddresses();

      if (!addresses || addresses.length === 0) {
        throw new Error("No Cardano address found in Lace.");
      }

      setWallet(api);
      setAddress(addresses[0]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect Lace Wallet.");
    }
  }

  function disconnectWallet() {
    setWallet(null);
    setAddress("");
    setTxHash("");
    setError("");
  }

  async function handleTransfer(event) {
    event.preventDefault();

    setError("");
    setTxHash("");

    if (!wallet) {
      setError("Please connect Lace Wallet first.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!recipient.trim()) {
      setError("Enter a recipient address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3000/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction: direction,
          amount: String(amount),
          recipient: recipient.trim(),
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Transfer failed.");
      }

      setTxHash(data.txHash);
    } catch (err) {
      console.error(err);
      setError(err.message || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <section className="card">
        <div className="header">
          <div className="badge">MIDNIGHT × VIA LABS</div>

          <h1>USDM Transfer</h1>

          <p>Move USDM between Cardano and Midnight.</p>
        </div>

        {!wallet ? (
          <button
            type="button"
            className="wallet-button"
            onClick={connectLace}
          >
            Connect Lace Wallet
          </button>
        ) : (
          <div className="connected">
            <div>
              <small>Connected</small>
              <strong>Lace Wallet</strong>
            </div>

            <button
              type="button"
              className="disconnect"
              onClick={disconnectWallet}
            >
              Disconnect
            </button>

            <code>
              {address.slice(0, 18)}
              ...
              {address.slice(-12)}
            </code>
          </div>
        )}

        <form onSubmit={handleTransfer}>
          <label htmlFor="direction">Transfer Direction</label>

          <select
            id="direction"
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
          >
            <option value="cardano-to-midnight">
              Cardano → Midnight
            </option>

            <option value="midnight-to-cardano">
              Midnight → Cardano
            </option>
          </select>

          <label htmlFor="amount">Amount</label>

          <div className="amount">
            <input
              id="amount"
              type="number"
              min="0.000001"
              step="0.000001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <span>USDM</span>
          </div>

          <label htmlFor="recipient">Recipient</label>

          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder={
              direction === "cardano-to-midnight"
                ? "mn_addr..."
                : "addr_test..."
            }
          />

          <button
            type="submit"
            className="transfer-button"
            disabled={!wallet || loading}
          >
            {loading ? "Processing..." : "Transfer USDM"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {txHash && (
          <div className="success">
            <div className="success-title">
              Transfer Successful
            </div>

            <small>Transaction Hash</small>

            <code>{txHash}</code>

            <a
              href={"https://scan.vialabs.tech/tx/" + txHash}
              target="_blank"
              rel="noreferrer"
            >
              Open in VIA Scan
            </a>
          </div>
        )}

        <footer>
          Powered by VIA Labs USDM Bridge SDK × Midnight
        </footer>
      </section>
    </main>
  );
}

export default App;
