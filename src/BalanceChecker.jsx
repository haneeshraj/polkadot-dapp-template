import React, { useEffect, useState } from "react";
import { formatBalance } from "@polkadot/util";

const BalanceChecker = ({ api, account }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const getBalance = async () => {
      try {
        setLoading(true);
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
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error formatting balance:", error);
        setLoading(false);
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
      {loading ? (
        <div className="loading">
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : balance ? (
        <div className="balance-display">
          <div className="balance-card">
            <div className="balance-item">
              <span className="balance-label">Free:</span>
              <span className="balance-value">{balance.free}</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">Reserved:</span>
              <span className="balance-value">{balance.reserved}</span>
            </div>
            <div className="balance-item total">
              <span className="balance-label">Total:</span>
              <span className="balance-value">{balance.total}</span>
            </div>
          </div>
          <div className="account-info">
            <div className="account-address">
              <span className="label">Address:</span>
              <span
                className="value"
                title={account.address}
              >{`${account.address.slice(0, 6)}...${account.address.slice(
                -6
              )}`}</span>
              <button
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(account.address);
                  alert("Address copied to clipboard");
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p>Unable to fetch balance</p>
      )}
    </div>
  );
};

export default BalanceChecker;
