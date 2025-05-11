import { formatBalance } from "@polkadot/util";
import React, { useEffect } from "react";

const TransactionHistory = ({ api, account }) => {
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
      } catch (error) {
        console.error("Error fetching transaction history:", error);
      }
    };
    getTransactionHistory();
  });

  return (
    <>
      <h2>TransactionHistory</h2>
    </>
  );
};

export default TransactionHistory;
