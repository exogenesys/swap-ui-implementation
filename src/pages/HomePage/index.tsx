import { useWalletKit } from "@gokiprotocol/walletkit";
import {
  Button,
  Grid,
  makeStyles,
  CircularProgress,
  Typography,
} from "@material-ui/core";
import { useConnectedWallet, useSolana } from "@saberhq/use-solana";
import {
  TokenListContainer,
  TokenListProvider,
} from "@solana/spl-token-registry";
import {
  PublicKey,
  Signer,
  ConfirmOptions,
  Connection,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { FEE_COLLECTOR, USDC, DEFAULT_TOKEN } from "../../utils";
import Swap from "@project-serum/swap-ui";
import Navbar from "../../components/Navbar";
import { Wallet, Provider } from "@project-serum/anchor";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "70vh",
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  status: {
    minHeight: "5vh",
    marginTop: theme.spacing(10),
    marginBottom: theme.spacing(2),
  },
}));

const STATUS = {
  INITIAL: "INITIAL",
  SENT: "SENT",
  FAILED_TO_SEND: "FAILED_TO_SEND",
  CONFIRMING: "CONFIRMING",
  CONFIRMED: "CONFIRMED",
  FAILED_TO_CONFIRM: "FAILED_TO_CONFIRM",
};

function HomePage() {
  const styles = useStyles();

  const { enqueueSnackbar } = useSnackbar();

  const [isConnected, setIsConnected] = useState(false);
  const [tokenList, setTokenList] = useState<TokenListContainer | null>(null);
  const [swapStatus, setSwapStatus] = useState(STATUS.INITIAL);

  const confirmSwap = async (
    connection: Connection,
    tx: TransactionSignature,
    attempts: number = 0
  ) => {
    if (attempts > 5) {
      setSwapStatus(STATUS.FAILED_TO_CONFIRM);
      setTimeout(() => {
        setSwapStatus(STATUS.INITIAL);
      }, 5000);
      enqueueSnackbar("Failed to confirm transaction", {
        variant: "error",
        action: (
          <Button
            color="inherit"
            component="a"
            target="_blank"
            rel="noopener"
            href={`https://solscan.io/tx/${tx}`}
          >
            View on Solscan
          </Button>
        ),
      });
      return;
    }
    setSwapStatus(STATUS.CONFIRMING);
    const txReceipt = await connection.getConfirmedTransaction(tx, "confirmed");
    if (txReceipt) {
      setSwapStatus(STATUS.CONFIRMED);
      setTimeout(() => {
        setSwapStatus(STATUS.INITIAL);
      }, 5000);
      console.log(txReceipt);
      enqueueSnackbar(`Swap successful!`, {
        variant: "success",
        action: (
          <Button
            color="inherit"
            component="a"
            target="_blank"
            rel="noopener"
            href={`https://solscan.io/tx/${tx}`}
          >
            View on Solscan
          </Button>
        ),
      });
    } else {
      setTimeout(() => {
        confirmSwap(connection, tx, attempts + 1);
      }, 2000);
    }
  };

  const [notifyingProvider, setNotifyingProvider] =
    useState<NotifyingProvider | null>(null);

  const wallet = useConnectedWallet();
  const { providerMut } = useSolana();
  const { connect } = useWalletKit();

  useEffect(() => {
    if (wallet && wallet.publicKey) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (isConnected && providerMut) {
      const provider = new NotifyingProvider(
        providerMut.connection,
        // @ts-ignore
        providerMut.wallet,
        providerMut.opts,
        (tx, err) => {
          if (err) {
            setSwapStatus(STATUS.FAILED_TO_SEND);
            enqueueSnackbar(`Error: ${err.toString()}`, {
              variant: "error",
            });
          } else if (tx) {
            setSwapStatus(STATUS.SENT);
            enqueueSnackbar("Swap request sent", {
              variant: "info",
              action: (
                <Button
                  color="inherit"
                  component="a"
                  target="_blank"
                  rel="noopener"
                  href={`https://solscan.io/tx/${tx}`}
                >
                  View on Solscan
                </Button>
              ),
            });
            confirmSwap(providerMut.connection, tx, 0);
          }
        }
      );
      setNotifyingProvider(provider);
    } else {
      setNotifyingProvider(null);
    }
  }, [isConnected]);

  let commonBases: PublicKey[] = [
    USDC,
    new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    new PublicKey("So11111111111111111111111111111111111111112"),
    new PublicKey("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),
  ];

  useEffect(() => {
    new TokenListProvider().resolve().then(setTokenList);
  }, [setTokenList]);

  const StatusComponent = () => {
    if (isConnected) {
      if (swapStatus === STATUS.SENT || swapStatus === STATUS.CONFIRMING) {
        return (
          <div>
            <CircularProgress />
          </div>
        );
      }
    } else {
      return (
        <div>
          <Typography variant="h6">
            Please connect wallet to use swap
          </Typography>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <Grid>
        <Navbar />
      </Grid>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        className={styles.status}
      >
        <StatusComponent />
      </Grid>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        className={styles.root}
      >
        {isConnected && tokenList && notifyingProvider && (
          <Swap
            //@ts-ignore
            commonBases={commonBases}
            provider={notifyingProvider}
            tokenList={tokenList}
            referral={FEE_COLLECTOR}
            fromMint={USDC}
            toMint={DEFAULT_TOKEN}
            connectWalletCallback={() => connect()}
          />
        )}
      </Grid>
    </div>
  );
}

// Cast wallet to AnchorWallet in order to be compatible with Anchor's Provider class
interface AnchorWallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
}

class NotifyingProvider extends Provider {
  // Function to call whenever the provider sends a transaction;
  private onTransaction: (
    tx: TransactionSignature | undefined,
    err?: Error
  ) => void;

  constructor(
    connection: Connection,
    wallet: Wallet,
    opts: ConfirmOptions,
    onTransaction: (tx: TransactionSignature | undefined, err?: Error) => void
  ) {
    const newWallet = wallet as AnchorWallet;
    super(connection, newWallet, opts);
    this.onTransaction = onTransaction;
  }

  async send(
    tx: Transaction,
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions
  ): Promise<TransactionSignature> {
    try {
      const txSig = await super.send(tx, signers, opts);
      this.onTransaction(txSig);
      return txSig;
    } catch (err) {
      if (err instanceof Error || err === undefined) {
        this.onTransaction(undefined, err);
      }
      return "";
    }
  }

  async sendAll(
    txs: Array<{ tx: Transaction; signers: Array<Signer | undefined> }>,
    opts?: ConfirmOptions
  ): Promise<Array<TransactionSignature>> {
    try {
      const txSigs = await super.sendAll(txs, opts);
      txSigs.forEach((sig: any) => {
        this.onTransaction(sig);
      });
      return txSigs;
    } catch (err) {
      if (err instanceof Error || err === undefined) {
        this.onTransaction(undefined, err);
      }
      return [];
    }
  }
}

export default HomePage;
