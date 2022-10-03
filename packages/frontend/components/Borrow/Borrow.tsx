import { useState } from "react";
import { useMachine } from "@xstate/react";
import {
    Divider,
    Button,
    Container,
    Typography,
    CardContent,
    Card,
    Collapse,
    Grid,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Image from "next/image";

import borrowMachine from "../../machines/borrow.machine";
import { chains } from "../../machines/auth.machine";
import SelectTokenCard from "./SelectTokenCard";
import styles from "../../styles/components/Borrow.module.css";

type Chain = typeof chains[0];

export default function Borrow() {
    const [current, send] = useMachine(borrowMachine, { devTools: true });
    const { collateral } = current.context;
    const tokens = ["ETH", "USDC"]; // TODO: Should be selected depending on ??

    const [collateralChainId, setCollateralChain] = useState(chains[0].id);
    const [collateralValue, setCollateralValue] = useState("");
    const [collateralToken, setCollateralToken] = useState(tokens[0]);

    const [borrowChainId, setBorrowChainId] = useState(chains[1].id);
    const [borrowValue, setBorrowValue] = useState("");
    const [borrowToken, setBorrowToken] = useState(tokens[1]);

    const [showTransactionDetails, setShowTransactionDetails] = useState(false);

    return (
        <Container>
            <p>
                Current state: <code>{current.value as string}</code>
            </p>
            {current.matches("initial") && (
                <button onClick={() => send("initialize")}>Initialize</button>
            )}

            {current.matches("editing") && (
                <Card>
                    <CardContent sx={{ p: "1.5rem 2rem" }}>
                        <Typography variant="body2">Borrow</Typography>

                        <Divider sx={{ mt: "1rem", mb: "0.5rem" }} />

                        <FormControl>
                            <Grid container alignItems="center">
                                <label
                                    id="collateral-chain-label"
                                    className={styles.selectLabel}
                                >
                                    Collateral from
                                </label>
                                <Select
                                    labelId="collateral-chain-label"
                                    id="collateral-chain"
                                    value={collateralChainId}
                                    onChange={(e) =>
                                        setCollateralChain(e.target.value)
                                    }
                                    IconComponent={KeyboardArrowDownIcon}
                                    sx={{
                                        marginBottom: "1rem",
                                        boxShadow: "none",
                                        ".MuiOutlinedInput-notchedOutline": {
                                            border: 0,
                                        },
                                    }}
                                    variant="standard"
                                    disableUnderline
                                >
                                    {chains.map((chain: Chain) => (
                                        <MenuItem
                                            key={chain.id}
                                            value={chain.id}
                                        >
                                            <Grid container>
                                                <Image
                                                    src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                                                    height={18}
                                                    width={18}
                                                    alt={chain.label}
                                                />
                                                <span
                                                    style={{
                                                        marginLeft: "0.5rem",
                                                    }}
                                                >
                                                    <Typography variant="small">
                                                        {chain.label} Network
                                                    </Typography>
                                                </span>
                                            </Grid>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                        </FormControl>

                        <SelectTokenCard
                            value={collateralValue}
                            onChangeValue={(e) =>
                                setCollateralValue(e.target.value)
                            }
                            token={collateralToken}
                            onChangeToken={(e) =>
                                setCollateralToken(e.target.value)
                            }
                            tokens={tokens}
                            type="collateral"
                        />

                        <FormControl>
                            <Grid container alignItems="center">
                                <label
                                    id="borrow-chain-label"
                                    className={styles.selectLabel}
                                >
                                    Borrow to
                                </label>
                                <Select
                                    labelId="borrow-chain-label"
                                    id="borrow-chain"
                                    value={borrowChainId}
                                    onChange={(e) =>
                                        setBorrowChainId(e.target.value)
                                    }
                                    IconComponent={KeyboardArrowDownIcon}
                                    sx={{
                                        marginBottom: "1rem",
                                        boxShadow: "none",
                                        ".MuiOutlinedInput-notchedOutline": {
                                            border: 0,
                                        },
                                    }}
                                    variant="standard"
                                    disableUnderline
                                >
                                    {chains.map((chain: Chain) => (
                                        <MenuItem
                                            key={chain.id}
                                            value={chain.id}
                                        >
                                            <Grid container>
                                                <Image
                                                    src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                                                    height={18}
                                                    width={18}
                                                    alt={chain.label}
                                                />
                                                <span
                                                    style={{
                                                        marginLeft: "0.5rem",
                                                    }}
                                                >
                                                    <Typography
                                                        variant={"small"}
                                                    >
                                                        {chain.label} Network
                                                    </Typography>
                                                </span>
                                            </Grid>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                        </FormControl>

                        <SelectTokenCard
                            value={borrowValue}
                            onChangeValue={(e) =>
                                setBorrowValue(e.target.value)
                            }
                            token={borrowToken}
                            onChangeToken={(e) =>
                                setBorrowToken(e.target.value)
                            }
                            tokens={tokens}
                            type="borrow"
                        />

                        <br />
                        <Card
                            variant="outlined"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                                setShowTransactionDetails(
                                    !showTransactionDetails
                                )
                            }
                        >
                            <div
                                className={styles.cardLine}
                                style={{ height: 0 }}
                            >
                                <Typography variant="small">
                                    Estimated Cost
                                </Typography>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography variant="small">
                                        ~$3.90
                                    </Typography>
                                    {showTransactionDetails ? (
                                        <KeyboardArrowDownIcon />
                                    ) : (
                                        <KeyboardArrowUpIcon />
                                    )}
                                </div>
                            </div>
                            <Collapse
                                in={showTransactionDetails}
                                sx={{ width: "100%" }}
                            >
                                <div
                                    className={styles.cardLine}
                                    style={{ width: "92%", marginTop: "1rem" }}
                                >
                                    <Typography variant="small">
                                        Gas fees
                                    </Typography>
                                    <Typography variant="small">
                                        ~$1.90
                                    </Typography>
                                </div>
                                <br />
                                <div
                                    className={styles.cardLine}
                                    style={{ width: "92%" }}
                                >
                                    <Typography variant="small">
                                        Bridges fees
                                    </Typography>
                                    <Typography variant="small">
                                        ~$2.00
                                    </Typography>
                                </div>
                                <br />
                                <div
                                    className={styles.cardLine}
                                    style={{ width: "92%" }}
                                >
                                    <Typography variant="small">
                                        Est. processing time
                                    </Typography>
                                    <Typography variant="small">
                                        ~2 Minutes
                                    </Typography>
                                </div>
                                <br />
                                <div
                                    className={styles.cardLine}
                                    style={{ width: "92%" }}
                                >
                                    <Typography variant="small">
                                        Route
                                    </Typography>
                                    <Typography variant="small">
                                        <u>{"ETH > Polygon"}</u>
                                    </Typography>
                                </div>
                            </Collapse>
                        </Card>
                        <br />

                        <Button
                            variant="primary"
                            disabled
                            onClick={() => alert("not implemented")}
                            fullWidth
                        >
                            Sign
                        </Button>

                        <br />
                        <br />

                        <Button
                            variant="gradient"
                            disabled
                            onClick={() => alert("not implemented")}
                            fullWidth
                        >
                            Borrow
                        </Button>

                        <br />
                        <br />

                        <Grid container justifyContent="center">
                            <Typography variant="small">
                                Powered by
                                <a
                                    href="https://www.connext.network/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Image
                                        src="/assets/images/logo/connext.svg"
                                        height={16}
                                        width={95}
                                        alt="Connext logo"
                                    />
                                </a>
                            </Typography>
                        </Grid>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
}
