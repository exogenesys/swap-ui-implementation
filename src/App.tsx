import React from "react";
import "./App.css";
import { SnackbarProvider } from "notistack";
import WalletKitProviderHOC from "./components/WalletKitProviderHOC";
import HomePage from "./pages/HomePage";

// App illustrating the use of the Swap component.
//
// One needs to just provide an Anchor `Provider` and a `TokenListContainer`
// to the `Swap` component, and then everything else is taken care of.
function App() {
  return (
    <SnackbarProvider maxSnack={5} autoHideDuration={8000}>
      <WalletKitProviderHOC>
        <HomePage />
      </WalletKitProviderHOC>
    </SnackbarProvider>
  );
}

export default App;
