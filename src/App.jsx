import { useEffect, useState } from "react";
import "./App.css";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import BalanceChecker from "./BalanceChecker";
import TransactionHistory from "./TransactionHistory";
import SendToken from "./SendToken";

function App() {
  const [api, setApi] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkName, setNetworkName] = useState("");

  useEffect(() => {
    const connectToNetwork = async () => {
      try {
        // Connect to Westend testnet
        const wsProvider = new WsProvider("wss://westend-rpc.polkadot.io");
        const api = await ApiPromise.create({ provider: wsProvider });

        setApi(api);
        await api.isReady;

        // Get network information
        const chain = await api.rpc.system.chain();
        setNetworkName(chain.toString());

        console.log("Connected to the network:", chain.toString());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWallet = async () => {
    try {
      const extension = await web3Enable("polkadot-dapp");

      if (extension.length === 0) {
        alert(
          "No extension found. Please install the Polkadot.js extension and try again."
        );
        return;
      }

      const accounts = await web3Accounts();

      if (accounts.length === 0) {
        alert(
          "No accounts found. Please create an account in the Polkadot.js extension."
        );
        return;
      }

      setAccounts(accounts);
      setSelectedAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Failed to connect to wallet: " + error.message);
    }
  };

  return (
    <div className="main">
      <header>
        <h1>Polkadot DApp</h1>
        {networkName && <div className="network-badge">{networkName}</div>}
      </header>

      <div className="connect">
        <button onClick={connectWallet} disabled={loading}>
          {loading ? (
            <>
              <span className="loading">
                <div></div>
                <div></div>
                <div></div>
              </span>
              <span>Connecting to network...</span>
            </>
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>

      {accounts.length > 0 ? (
        <div className="dashboard">
          <div className="accounts">
            <h2>Accounts</h2>
            <div className="accounts-list">
              {accounts.map((account, index) => (
                <div
                  key={index}
                  className={`account ${
                    selectedAccount?.address === account.address
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <p className="account-name">{account.meta.name}</p>
                  <p className="account-address">{account.address}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="balance">
            {selectedAccount && api ? (
              <BalanceChecker api={api} account={selectedAccount} />
            ) : null}
          </div>

          <div className="transaction-history">
            <TransactionHistory api={api} account={selectedAccount} />
          </div>

          {selectedAccount && api ? (
            <div className="send-tokens">
              <h2>Send Tokens</h2>
              <SendToken api={api} account={selectedAccount} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="no-accounts">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M20 12V22H4V12"></path>
            <path d="M22 7H2V12H22V7Z"></path>
            <path d="M12 22V7"></path>
            <path d="M12 7H16.2C17.8802 7 18.7202 7 19.362 6.673C19.9265 6.3854 20.3854 5.92648 20.673 5.362C21 4.71997 21 3.88003 21 2.2V2H3V2.2C3 3.88003 3 4.71997 3.32698 5.362C3.61456 5.92648 4.07348 6.3854 4.63803 6.673C5.27976 7 6.11984 7 7.8 7H12Z"></path>
          </svg>
          <p>No accounts found. Please connect your wallet.</p>
          <p className="hint">
            Make sure you have the Polkadot.js extension installed and set up.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
