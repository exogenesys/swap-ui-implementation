import * as React from "react";
import { AppBar, Toolbar, Typography } from "@material-ui/core";
import { WalletButton } from "../WalletButton";

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          align="left"
          color="inherit"
          style={{ flexGrow: 1 }}
        >
          Swap
        </Typography>
        <WalletButton />
      </Toolbar>
    </AppBar>
  );
}
