import React from "react";
import { WalletKitProvider } from "@gokiprotocol/walletkit";
import { useSnackbar } from "notistack";
import { RPC } from "../../utils";
import AppIcon from "../AppIcon";

function WalletKitProviderHOC(props: any) {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <WalletKitProvider
      networkConfigs={{
        devnet: {
          name: RPC.name,
          endpoint: RPC.url,
        },
      }}
      app={{
        name: "Swap",
        icon: <AppIcon />,
      }}
      commitment="recent"
      onConnect={() => {
        enqueueSnackbar("Wallet successfully connected!", {
          variant: "success",
        });
      }}
      onDisconnect={() => {
        enqueueSnackbar("Wallet disconnected!", { variant: "info" });
      }}
      onError={() => {
        enqueueSnackbar("Some error occured!", { variant: "error" });
      }}
      onWalletKitError={() => {
        enqueueSnackbar("Some error occured", { variant: "error" });
      }}
    >
      {props.children}
    </WalletKitProvider>
  );
}

export default WalletKitProviderHOC;
