import { useEffect, useState } from "react";
import "./App.css";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import BalanceChecker from "./BalanceChecker";
import TransactionHistory from "./TransactionHistory";

function App() {
  const [api, setApi] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const connectToNetwork = async () => {
      try {
        const wsProvider = new WsProvider("wss://westend-rpc.polkadot.io");
        const api = await ApiPromise.create({ provider: wsProvider });

        setApi(api);

        await api.isReady;

        console.log("Connected to the network");

        setLoading(false);
      } catch (error) {
        console.error("Error connecting to the network:", error);
        setLoading(false);
      }
    };

    connectToNetwork();

    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      const extension = await web3Enable("polkadot-dapp");

      console.log("Extension enabled:", extension);

      const accounts = await web3Accounts();

      console.log("Accounts:", accounts);

      setAccounts(accounts);
      setSelectedAccount(accounts[0]);
      console.log("Selected account:", accounts[0]);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  return (
    <div className="main">
      <h1>Polkadot DApp</h1>
      <div className="connect">
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>

      {accounts.length != 0 ? (
        <>
          {" "}
          <div className="accounts">
            <h2>Accounts</h2>
            {accounts.map((account, index) => {
              return (
                <div
                  key={index}
                  className={`account ${
                    selectedAccount?.address === account.address
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <p>{account.meta.name}</p>
                  <p>{account.address}</p>
                </div>
              );
            })}
          </div>
          <div className="balance">
            {selectedAccount && api ? (
              <BalanceChecker api={api} account={selectedAccount} />
            ) : null}
          </div>
          <div className="transaction-history">
            <TransactionHistory api={api} account={selectedAccount} />
          </div>
        </>
      ) : (
        <div className="no-accounts">
          <p>No accounts found. Please connect your wallet.</p>
        </div>
      )}
    </div>
  );
}

export default App;
