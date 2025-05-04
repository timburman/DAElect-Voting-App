import React, {createContext, useState, useEffect, useCallback, useContext} from "react";
import Web3 from "web3";
import {contracts, targetNetworkId, contractArtifacts, defaultAddresses, LS_DAO_CONFIGS, LS_LAST_DAO_NAME} from "../config/contracts";


const safeJsonParse = (item) => {
    try {
        return JSON.parse(item);
    } catch (error) {
        return null;
    }
};

const Web3Context = createContext(null);

export const useWeb3Context = () => useContext(Web3Context);

export const Web3Provider = ({children}) => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [networkId, setNetworkId] = useState(null);
    const [error, setError] = useState('');

    const [savedDaoConfigs, setSavedDaoConfigs] = useState([]);
    const [currentDaoAddresses, setCurrentDaoAddresses] = useState(null);

    const [tokenContractInstance, setTokenContractInstance] = useState(null);
    const [stakingContractInstance, setStakingContractInstance] = useState(null);
    const [votingContractInstance, setVotingContractInstance] = useState(null);
    const [votingOwner, setVotingOwner] = useState('');
    const [isOwner, setIsOwner] = useState(false);

    const clearError = useCallback(() => setError(''), []);
    const setLoading = useCallback((loading, message = '') => setIsLoading(loading ? message || true : false), []);


    useEffect(() => {

        const savedJson = localStorage.getItem(LS_DAO_CONFIGS);
        const loadedConfig = Array.isArray(safeJsonParse(savedJson)) ? safeJsonParse(savedJson) : [];

        if (defaultAddresses.votingContract) {
            const defaultExists = loadedConfig.some(c => {
                c.token === defaultAddresses.governanceToken &&
                c.staking === defaultAddresses.stakingContract &&
                c.voting === defaultAddresses.votingContract
            });
            if (!defaultExists) {
                loadedConfig.unshift({
                    name: "DAElect",
                    token: defaultAddresses.governanceToken,
                    staking: defaultAddresses.stakingContract,
                    voting: defaultAddresses.votingContract,
                });
            }
        }
        setSavedDaoConfigs(loadedConfig);

        const lastDaoName = localStorage.getItem(LS_LAST_DAO_NAME);
        const targetConfig = loadedConfig.find(c => c.name === lastDaoName) || loadedConfig[0] || null;
        setCurrentDaoAddresses(targetConfig);
            
    }, []);

    const saveDaoConfig = useCallback((newConfig) => {

        if (!newConfig?.name || newConfig?.token || !newConfig?.staking || !newConfig?.voting) {
            console.error("Attemped to save invalid DAO config:", newConfig);
            setError("Failed to save DAO configuration: Invalid Data");
            return;
        }

        setSavedDaoConfigs(prevConfigs => {
            const existingIndex = prevConfigs.findIndex(c => c.name === newConfig.name);
            let updatedConfigs;

            if (existingIndex > -1) {
                updatedConfigs = [...prevConfigs];
                updatedConfigs[existingIndex] = newConfig;
            } else {
                updatedConfigs = [...prevConfigs, newConfig];
            }

            localStorage.setItem(LS_DAO_CONFIGS, JSON.stringify(updatedConfigs));
            return updatedConfigs;
        });

    }, [setError]);

    const switchDao = useCallback((daoConfig) => {
        if (daoConfig && daoConfig.name && daoConfig.token && daoConfig.staking && daoConfig.voting) {
            setCurrentDaoAddresses(daoConfig);
            localStorage.setItem(LS_LAST_DAO_NAME, daoConfig.name);

            setTokenContractInstance(null);
            setStakingContractInstance(null);
            setVotingContractInstance(null);
            setVotingOwner('');
            setIsOwner(false);
            console.log(`Switched to Dao: ${daoConfig.name}`);
        } else {
            console.error("Attemped to switch to invalid Dao config:", daoConfig);
            setError("Cannot Switch Dao: Invalid configuration selected");
        }
    }, [setError]);


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
                        // const staking = new web3Instance.eth.Contract(contracts.staking.abi, contracts.staking.address);
                        // const voting = new web3Instance.eth.Contract(contracts.voting.abi, contracts.voting.address);

                        // setTokenContractInstance(token);
                        // setStakingContractInstance(staking);
                        // setVotingContractInstance(voting);

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

        if (web3 && account && networkId === targetNetworkId && currentDaoAddresses) {
            console.log("Instantiating contracts for DAO:", currentDaoAddresses.name || 'Unnamed DAO');
            try {
                const token = new web3.eth.Contract(contractArtifacts.token.abi, currentDaoAddresses.token);
                const staking = new web3.eth.Contract(contractArtifacts.staking.abi, currentDaoAddresses.staking);
                const voting = new web3.eth.Contract(contractArtifacts.voting.abi, currentDaoAddresses.voting);

                setTokenContractInstance(token);
                setStakingContractInstance(staking);
                setVotingContractInstance(voting);
                setError('');
            } catch (instantiationError) {
                console.error("Contract instance error:",instantiationError);
                setError(`Failed to load contracts for ${currentDaoAddresses.name || `select DAO`}. check addresses`);

                setTokenContractInstance(null);
                setStakingContractInstance(null);
                setVotingContractInstance(null);
            }
        } else {
            setTokenContractInstance(null);
            setStakingContractInstance(null);
            setVotingContractInstance(null);
        }

    }, [web3, account, networkId, targetNetworkId, currentDaoAddresses]);

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
                    setVotingOwner('');
                    setIsOwner(false);
                }
            } else {
                setVotingOwner('');
                setIsOwner(false);
            }
        };

        fetchOwner();
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
        votingOwner,
        isOwner,
        connectWallet,
        setLoading,
        setError,
        clearError,
        savedDaoConfigs,
        currentDaoAddresses,
        switchDao,
        saveDaoConfig
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );

};