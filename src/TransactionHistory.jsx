import { formatBalance } from "@polkadot/util";
import { useEffect, useState } from "react";

const TransactionHistory = ({ api, account }) => {
  const [transactionHistory, setTransactionHistory] = useState([]);

  useEffect(() => {
    const getTransactionHistory = async () => {
      try {
        const chainDecimals = await api.registry.chainDecimals[0];
        const chainTokens = await api.registry.chainTokens[0];

        formatBalance.setDefaults({
          decimals: chainDecimals,
          unit: chainTokens,
        });

        console.log("Chain Decimals:", chainDecimals);
        console.log("Chain Tokens:", chainTokens);

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
                });
              }
            }
          });
        }

        setTransactionHistory(history);
      } catch (error) {
        console.error("Error fetching transaction history:", error);
      }
    };
    getTransactionHistory();
  });

  return (
    <>
      <h2>TransactionHistory</h2>

      {transactionHistory.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Block Number</th>
              <th>Hash</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactionHistory.map((tx, index) => (
              <tr key={index}>
                <td>{tx.blockNumber}</td>
                <td>{tx.hash}</td>
                <td>{tx.type}</td>
                <td>{tx.from}</td>
                <td>{tx.to}</td>
                <td>{tx.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transactions found.</p>
      )}
    </>
  );
};

export default TransactionHistory;
