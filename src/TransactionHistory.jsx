import { formatBalance } from "@polkadot/util";
import { useEffect, useState } from "react";

const TransactionHistory = ({ api, account }) => {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTransactionHistory = async () => {
      try {
        setLoading(true);
        const chainDecimals = await api.registry.chainDecimals[0];
        const chainTokens = await api.registry.chainTokens[0];

        formatBalance.setDefaults({
          decimals: chainDecimals,
          unit: chainTokens,
        });

        // Fetch the blockchain for the last 10 blocks
        const lastHeader = await api.rpc.chain.getHeader();
        const blockNumber = lastHeader.number.toNumber();

        const history = [];

        // we'll check the last 50 blocks for transactions
        const startBlock = Math.max(blockNumber - 50, 0);

        for (let i = startBlock; i <= blockNumber; i++) {
          const blockHash = await api.rpc.chain.getBlockHash(i);
          const block = await api.rpc.chain.getBlock(blockHash);

          block.block.extrinsics.forEach((extrinsic) => {
            if (
              (extrinsic.method.section === "balances" &&
                extrinsic.method.method === "transfer") ||
              extrinsic.method.method === "transferKeepAlive"
            ) {
              const { signer, method } = extrinsic;
              const sender = signer.toString();
              const recipient = method.args[0].toString();
              const amount = formatBalance(method.args[1].toString(), {
                withSi: true,
                forceUnit: "-",
              });

              if (sender === account.address || recipient === account.address) {
                const isSent = sender === account.address;

                history.push({
                  blockNumber: i,
                  hash: extrinsic.hash.toString(),
                  type: isSent ? "sent" : "received",
                  from: sender,
                  to: recipient,
                  amount,
                  timestamp: new Date().toISOString(), // Using current time as placeholder
                });
              }
            }
          });
        }

        setTransactionHistory(history);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
        setLoading(false);
      }
    };

    if (api && account) {
      getTransactionHistory();
    }

    // Missing dependency array - add it to prevent infinite re-renders
  }, [api, account]);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className="transaction-history-container">
      <h2>Transaction History</h2>

      {loading ? (
        <div className="loading">
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : transactionHistory.length > 0 ? (
        <div className="transactions-list">
          {transactionHistory.map((tx, index) => (
            <div
              key={index}
              className={`transaction ${
                tx.type === "sent" ? "sent" : "received"
              }`}
            >
              <div className="transaction-header">
                <span className={`transaction-type ${tx.type}`}>
                  {tx.type === "sent" ? "↑ Sent" : "↓ Received"}
                </span>
                <span className="transaction-block">
                  Block: {tx.blockNumber}
                </span>
              </div>

              <div className="transaction-details">
                <div className="transaction-amount">
                  {tx.type === "sent" ? "-" : "+"}
                  {tx.amount}
                </div>

                <div className="transaction-addresses">
                  <div className="transaction-from">
                    <span className="label">From:</span>
                    <span className="address" title={tx.from}>
                      {formatAddress(tx.from)}
                    </span>
                  </div>
                  <div className="transaction-to">
                    <span className="label">To:</span>
                    <span className="address" title={tx.to}>
                      {formatAddress(tx.to)}
                    </span>
                  </div>
                </div>

                <div className="transaction-hash">
                  <span className="label">Hash:</span>
                  <span className="hash" title={tx.hash}>
                    {formatAddress(tx.hash)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-transactions">
          <p>No transactions found in recent blocks.</p>
          <p className="no-tx-hint">
            Transactions will appear here once you send or receive tokens.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
