import React from "react";
import { useWeb3Context } from "../contexts/Web3Context";

const ConnectButton = () => {
    const { connectWallet, isLoading } = useWeb3Context();

    const connecting = typeof isLoading === 'string' && isLoading.includes('Connecting');

    return(
        <button
            className="connect-button"
            onClick={connectWallet}
            disabled={connecting}
        >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
    );
};

export default ConnectButton;