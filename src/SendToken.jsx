import React, { useState, useEffect } from "react";
import { web3FromSource } from "@polkadot/extension-dapp";

function SendToken({ api, account }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [supportsTransfer, setSupportsTransfer] = useState(false);

  // Check if the API supports the transfer function
  useEffect(() => {
    if (api) {
      // Check which module and method to use for transfers
      const hasBalancesTransfer =
        api.tx.balances &&
        typeof api.tx.balances.transferKeepAlive === "function";
      const hasBalancesTransferOld =
        api.tx.balances && typeof api.tx.balances.transfer === "function";
      const hasGenericTransfer = typeof api.tx.transfer === "function";

      setSupportsTransfer(
        hasBalancesTransfer || hasBalancesTransferOld || hasGenericTransfer
      );

      if (
        !hasBalancesTransfer &&
        !hasBalancesTransferOld &&
        !hasGenericTransfer
      ) {
        console.warn(
          "Transfer methods not found in API. Available methods:",
          Object.keys(api.tx).map(
            (module) => `${module}: ${Object.keys(api.tx[module]).join(", ")}`
          )
        );
      }
    }
  }, [api]);

  const handleSend = async () => {
    if (!recipient || !amount) {
      setStatus({ error: "Please provide recipient address and amount" });
      return;
    }

    if (!supportsTransfer) {
      setStatus({ error: "Transfer function not supported on this network" });
      return;
    }

    try {
      setSending(true);
      setStatus({ message: "Preparing transaction..." });

      // Validate address
      let isValidAddress = false;
      try {
        api.createType("AccountId", recipient);
        isValidAddress = true;
      } catch {
        isValidAddress = false;
      }

      if (!isValidAddress) {
        throw new Error("Invalid recipient address");
      }

      // Convert to planck units (smallest unit)
      const decimals = api.registry.chainDecimals[0];
      const planckAmount = (
        parseFloat(amount) * Math.pow(10, decimals)
      ).toString();

      // Get signer from extension
      const injector = await web3FromSource(account.meta.source);

      // Determine which transfer function to use
      let transferTx;

      if (typeof api.tx.balances?.transferKeepAlive === "function") {
        // Preferred method - keeps account alive with minimum balance
        transferTx = api.tx.balances.transferKeepAlive(recipient, planckAmount);
      } else if (typeof api.tx.balances?.transfer === "function") {
        // Legacy method
        transferTx = api.tx.balances.transfer(recipient, planckAmount);
      } else if (typeof api.tx.transfer === "function") {
        // Generic transfer (some chains)
        transferTx = api.tx.transfer(recipient, planckAmount);
      } else {
        throw new Error("No compatible transfer method found");
      }

      // Send transaction
      await transferTx.signAndSend(
        account.address,
        { signer: injector.signer },
        (result) => handleTransactionUpdate(result)
      );
    } catch (error) {
      console.error("Transaction failed:", error);
      setStatus({ error: error.message });
      setSending(false);
    }
  };

  const handleTransactionUpdate = (result) => {
    const { status, events, dispatchError } = result;

    if (status.isInBlock) {
      setStatus({
        message: `Transaction included in block: ${status.asInBlock
          .toString()
          .slice(0, 10)}...`,
      });
    } else if (status.isFinalized) {
      if (dispatchError) {
        let errorMessage = dispatchError.toString();
        setStatus({ error: `Transaction failed: ${errorMessage}` });
      } else {
        // Look for successful transfer event
        const transferEvent = events.find(({ event }) =>
          api.events.balances.Transfer?.is(event)
        );

        if (transferEvent) {
          setStatus({ message: "Transfer successful! Tokens have been sent." });
          setRecipient("");
          setAmount("");
        } else {
          setStatus({ message: "Transaction completed" });
        }
      }
      setSending(false);
    }
  };

  return (
    <div className="send-token-container">
      <div className="form-container">
        <div className="form-group">
          <label htmlFor="recipient">Recipient Address</label>
          <input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter recipient address"
            disabled={sending || !supportsTransfer}
          />
        </div>

        <div className="form-group amount-group">
          <label htmlFor="amount">Amount</label>
          <div className="amount-input-container">
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.000001"
              disabled={sending || !supportsTransfer}
            />
            <span className="token-symbol">
              {api?.registry.chainTokens[0] || "WND"}
            </span>
          </div>
        </div>

        <button
          className="send-button"
          onClick={handleSend}
          disabled={sending || !recipient || !amount || !supportsTransfer}
        >
          {sending ? (
            <>
              <span className="sending-text">Sending</span>
              <span className="dot-animation">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </>
          ) : (
            "Send Tokens"
          )}
        </button>

        {!supportsTransfer && (
          <div className="error status-message">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            This network may not support token transfers or the API is still
            initializing.
          </div>
        )}

        {status?.error && (
          <div className="error status-message">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {status.error}
          </div>
        )}

        {status?.message && (
          <div className="success status-message">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {status.message}
          </div>
        )}
      </div>

      <div className="transaction-tips">
        <h3>Tips</h3>
        <ul>
          <li>Double-check the recipient address before sending</li>
          <li>Transaction fees will be deducted from your balance</li>
          <li>Transactions cannot be reversed once confirmed</li>
        </ul>
      </div>
    </div>
  );
}

export default SendToken;
