import { useEffect, useState } from "react";
import "./App.css";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";

function App() {
  const [api, setApi] = useState(null);

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
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  return (
    <>
      <button onClick={connectWallet}>Connect Wallet</button>
    </>
  );
}

export default App;
