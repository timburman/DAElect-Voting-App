import React, {createContext, useState, useEffect, useCallback, useContext} from "react";
import Web3 from "web3";
import {contracts, targetNetworkId} from "../config/contracts";

const Web3Context = createContext(null);

export const useWeb3Context = () => useContext(Web3Context);

export const Web3Provider = ({children}) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [networkId, setNetworkId] = useState(null);
    const [error, setError] = useState('');

    const [tokenContractInstance, setTokenContractInstance] = useState(null);
    const [stakingContractInstance, setStakingContractInstance] = useState(null);
    const [votingContractInstance, setVotingContractInstance] = useState(null);
    const [votingOwner, setVotingOwner] = useState('');
    const [isOwner, setIsOwner] = useState(false);

    const clearError = useCallback(() => setError(''), []);
    const setLoading = useCallback((loading, message = '') => setIsLoading(loading ? message || true : false), []);

    const connectWallet = useCallback(async () => {
        clearError();
        setLoading(true, "Connecting Wallet...");
        if(window.ethereum) {
            try {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);

                const accounts = await window.ethereum.request({method: "eth_requestAccounts"});
                if (accounts.length > 0) {
                    const currentAccount = accounts[0];
                    setAccount(currentAccount);
                    setIsConnected(true);

                    const netId = await web3Instance.eth.net.getId();
                    const netIdStr = netId.toString();
                    setNetworkId(netIdStr);

                    if (netIdStr !== targetNetworkId) {
                        setError("Please change the network to Sepolia.");
                    } else {

                        const token = new web3Instance.eth.Contract(contracts.token.abi, contracts.token.address);
                        const staking = new web3Instance.eth.Contract(contracts.staking.abi, contracts.staking.address);
                        const voting = new web3Instance.eth.Contract(contracts.voting.abi, contracts.voting.address);

                        setTokenContractInstance(token);
                        setStakingContractInstance(token);
                        setVotingContractInstance(token);

                        console.log("Wallet Connected: ",currentAccount);
                    }
                } else {
                    setError("No accounts Found. Please unlock your wallet.");
                }
            } catch (error) {
                console.error("Connecetion Error:",error);
                setError(`Connection Failed: ${error.message || 'User rejected connection.'}`);
                setIsConnected(false);
                setAccount(null);
            } finally {
                setLoading(false);
            }
        } else {
            setError("Compatible wallet not detected. Please install a wallet");
            setLoading(false);
        }
    }, [clearError, setLoading]);


    useEffect(() => {
        const handelAccountsChanged = (accounts) => {
            console.log("Accounts Changed", accounts);

            if (accounts.length > 0 && accounts[0] !== account) {
                setAccount(accounts[0]);
                setIsConnected(true);
            } else if (accounts.length === 0) {
                setAccount(null);
                setIsConnected(false);
                setWeb3(null);
                setTokenContractInstance(null);
                setStakingContractInstance(null);
                setVotingContractInstance(null);
                setVotingOwner('');
                setIsOwner(false);
                setError("Wallet disconnected or locked.");
            }
        };

        const handelChainChanged = (chainId) => {
            console.log("Network changed:", chainId);

            window.location.reload();
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handelAccountsChanged);
            window.ethereum.on('chainChanged', handelChainChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handelAccountsChanged);
                window.ethereum.removeListener('chainChanged', handelChainChanged);
            };
        }
    }, [account, connectWallet]);

    useEffect(() => {
        const fetchOwner = async () => {
            if (votingContractInstance && account) {
                try {
                    const owner = await votingContractInstance.methods.owner().call();
                    setVotingOwner(owner);
                    setIsOwner(account.toLowerCase() === owner.toLowerCase());
                } catch (error) {
                    console.error("Failed to fetch voting owner:", error.message);
                }
            } else {
                setVotingOwner('');
                setIsOwner(false);
            }
        };
    }, [votingContractInstance, account]);

    const value = {
        web3,
        account,
        isConnected,
        isLoading,
        error,
        networkId,
        targetNetworkId,
        tokenContract: tokenContractInstance,
        votingContract: votingContractInstance,
        stakingContract: stakingContractInstance,
        isOwner,
        connectWallet,
        setLoading,
        setError,
        clearError
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );

};