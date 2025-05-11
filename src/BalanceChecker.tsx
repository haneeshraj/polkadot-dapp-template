import React, { useEffect, useState } from "react";

import { formatBalance } from "@polkadot/util";

const BalanceChecker = ({ api, account }) => {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const getBalance = async () => {
      try {
        const chainDecimals = await api.registry.chainDecimals[0];
        const chainTokens = await api.registry.chainTokens[0];

        formatBalance.setDefaults({
          decimals: chainDecimals,
          unit: chainTokens,
        });

        unsubscribe = await api.query.system.account(
          account.address,
          (accountData) => {
            const free = accountData.data.free.toBigInt();
            const formatted = formatBalance(free, {
              withSi: true,
              forceUnit: "-",
            });
            setBalance({
              free: formatBalance(free, { forceUnit: "-", withSi: true }),
              reserved: formatBalance(accountData.data.reserved.toBigInt(), {
                forceUnit: "-",
                withSi: true,
              }),
              total: formatBalance(
                accountData.data.free.toBigInt() +
                  accountData.data.reserved.toBigInt(),
                { forceUnit: "-", withSi: true }
              ),
            });
          }
        );
      } catch (error) {
        console.error("Error formatting balance:", error);
      }
    };

    getBalance();

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [api, account]);

  return (
    <div className="balance-check">
      <h2>Balance</h2>
      {balance ? (
        <div>
          <p>Free: {balance.free}</p>
          <p>Reserved: {balance.reserved}</p>
          <p>Total: {balance.total}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default BalanceChecker;
