import React from "react";
import { useWalletKit } from "@gokiprotocol/walletkit";
import { useConnectedWallet, useSolana } from "@saberhq/use-solana";
import styles from "./WalletButton.module.css";
import { Button } from "@material-ui/core";

export function shortenAddress(addr: string) {
  let newString = "";

  if (addr && addr.length >= 8) {
    newString += addr.substring(0, 3);
    newString += "...";
    newString += addr.substr(addr.length - 3);
  }

  return newString;
}

export function WalletButton() {
  const wallet = useConnectedWallet();
  const { connect } = useWalletKit();
  const { disconnect } = useSolana();

  // const utils = fetchSolanaWalletUtils();

  function handleDisconnectButton() {
    disconnect();
  }

  function handleConnectButton() {
    connect();
  }

  let button;

  const isConnected = wallet?.publicKey;

  if (isConnected) {
    button = (
      <Button
        className={styles.walletDisconnectButton}
        color="primary"
        variant="contained"
        onClick={() => handleDisconnectButton()}
      >
        {`${shortenAddress(isConnected.toString())} | Disconnect`}
      </Button>
    );
  } else {
    button = (
      <Button
        className={styles.walletConnectButton}
        color="primary"
        variant="contained"
        onClick={() => handleConnectButton()}
      >
        {"Connect Wallet"}
      </Button>
    );
  }

  return <div className="d-grid gap-2">{button}</div>;
}
