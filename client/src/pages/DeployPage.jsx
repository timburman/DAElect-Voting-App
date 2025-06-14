import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3Context } from "../contexts/Web3Context";
import { contractArtifacts } from "../config/contracts";
import { saveDaoInstance } from "../services/proposalService";
import MessageDisplay from "../components/MessageDisplay";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressBar from "../components/ProgressBar";

const parseVotingPeriod = (input) => {
    if (!input || typeof input !== 'string') return null;
    const value = parseFloat(input);

    if (isNaN(value) || value <= 0 ) return null;

    if (input.toLowerCase().includes('day')) {
        return Math.floor(value * 24 * 60 * 60);
    } else if (input.toLowerCase().includes('hour') || input.toLowerCase().includes('hr')) {
        return Math.floor(value * 60 * 60);
    } else if (input.toLowerCase().includes('min')) {
        return Math.floor(value * 60);
    }

    return Math.floor(value);
}

const parseQuorum = (input) => {

    if (!input || typeof input !== 'string') return null;
    let value = input.replace("%","").trim();
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue < 0 || numericValue > 10000) {

        if (!input.includes('%') && numericValue >= 0 && numericValue <= 10000) {
            return Math.floor(numericValue);
        }
        return null;
    }

    if (input.includes('%') || numericValue <= 100) {
        return Math.floor(numericValue * 100);
    }

    return null;

};

const DEPLOYMENT_STEPS = ["Token Setup", "Staking Config", "Voting Config", "Deploy & Save"];

const DeployPage = () => {

    const { web3, account, isConnected, networkId, targetNetworkId, setLoading, setError, clearError, switchDao, saveDaoConfig, addAndSelectDao, getSignature } = useWeb3Context();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [config, setConfig] = useState({
        tokenChoice: null,
        tokenName: 'DAO Token',
        tokenSymbol: 'DAOT',
        initialSupply: '1000000',
        existingTokenAddress: '',
        governanceTokenAddress: '',
        stakingContractAddress: '',
        votingContractAddress: '',
        votingPeriod: '3 days',
        quorum: '4%',

        daoName: '',
    });

    const [isDeploying, setIsDeploying] = useState({token: false, staking: false, voting: false});
    

    // const [tokenChoice, setTokenChoice] = useState(null);

    // const [tokenName, setTokenName] = useState('');
    // const [tokenSymbol, setTokenSymbol] = useState('');
    // const [initialSupplyInput, setInitialSupplyInput] = useState('');

    // const [daoNameToSave, setDaoNameToSave] = useState('');
    // const [isSavingDao, setIsSavingDao] = useState(false);

    // const [governanceTokenAddressInput, setGovernanceTokenAddressInput] = useState('');

    // const [isProcessingToken, setIsProcessingToken] = useState(false);
    // const [verifiedTokenInfo, setVerifiedTokenInfo] = useState(null);

    // const [isDeployingStaking, setIsDeployingStaking] = useState(false);
    // const [deployedStakingAddress, setDeployedStakingAddress] = useState(null);

    // const [votingPeriodInput, setVotingPeriodInput] = useState('5 days');
    // const [quorumInput, setQuorumInput] = useState('4%');
    // const [isDeployingVoting, setIsDeployingVoting] = useState(false);
    // const [deployedVotingAddress, setDeployedVotingAddress] = useState(null);
    
    // const [deploymentSuccessInfo, setDeploymentSuccessInfo] = useState(null);

    const [pageError, setPageError] = useState('');
    const clearPageError = () => setPageError('');


    const handleConfigChange = (e) => {
        setConfig(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const goToStep = (step) => {
        if (step < currentStep) {
            setCurrentStep(step);
        }
    }

    const handleNext = async () => {

        let isValid = true;
        clearPageError();

        if (currentStep === 1) {
            if (!config.tokenChoice) {
                isValid = false;
                setPageError('Please choose to create or use an existing token.');
            } else if (config.tokenChoice === 'existing' && !web3.utils.isAddress(config.existingTokenAddress)) {
                isValid = false;
                setPageError("Please enter a valid Ethereum address for the existing token.");
            } else if (config.tokenChoice === 'create' && (!config.tokenName.trim() || !config.tokenSymbol.trim())) {
                isValid = false;
                setPageError("Please provide a name and symbol for your new token.");
            }
        }
        if (currentStep === 3) {
            if (parseVotingPeriod(config.votingPeriod) === null) {
                isValid = false; setPageError("Invalid Voting Period format.");
            }
            if (parseQuorum(config.quorum) === null) {
                isValid = false; setPageError("Invalid Quorum format.");
            }
        }

        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, DEPLOYMENT_STEPS.length));
        }

    };

    const handleBack = () => {

        setCurrentStep(prev => Math.max(prev - 1, 1));

    };

    const deployContract = async ( contractName, contractKey, deployer, onDeployed ) => {
        clearError();
        clearPageError();
        setIsDeploying(prev => ({...prev, [contractKey]: true}));
        setLoading(true, `Deploying ${contractName}...`);

        try {
            await deployer.send({from: account})
            .on('transactionHash', hash => setLoading(true, `Deploying ${contractName} Tx: ${hash.substring(0,10)}...`))
            .on('receipt', receipt => {
                const newAddress = receipt.contractAddress;
                console.log(`${contractName} Deployed:`,newAddress);
                onDeployed(newAddress);
                setLoading(false);
            })
            .on('error', err => {
                setError(`${contractName} deployment failed: ${err.message}`);
                setLoading(false);
            });
        } catch (error) {
            setError(`Error sending ${contractName} transaction: ${err.message}`);
            setLoading(false);
        } finally {
            setIsDeploying(prev => ({ ...prev, [contractKey]: false }));
         }

    }

    const handleDeployToken = () => {

        const supply = BigInt(config.initialSupply) * (10n ** 18n);
        const deployer = new web3.eth.Contract(contractArtifacts.token.abi).deploy({
            data: contractArtifacts.token.bytecode,
            arguments: [config.tokenName, config.tokenSymbol, supply.toString(), account]
        });
        deployContract("Token", 'token', deployer, (address) => {
            setConfig(prev => ({...prev, governanceTokenAddress: address}));
        });
    };

    const handleVerifyAndSetToken = async () => {
        clearPageError();
        clearError();

        if (!web3 || !account) { setPageError("Wallet not connected."); return; }

        
        setLoading(true, 'Verifying Token...');
        
        try {
            const tempToken = new web3.eth.Contract(contractArtifacts.token.abi, config.existingTokenAddress);


            const [name, symbol, owner] = await Promise.all([
                tempToken.methods.name().call(),
                tempToken.methods.symbol().call(),
                tempToken.methods.owner().call(),
            ]);

            const ownerMatches = owner.toLowerCase() === account.toLowerCase();

            const signatureMessage = `Sign to verify you are the owner of this ERC-20 token at address: ${config.existingTokenAddress}. No Gas will be charged`;

            const localValidSig = await getSignature(signatureMessage);

            if (!localValidSig || !ownerMatches) {
                setPageError("Verification Failed: Your account is not the owner of this token contract.");
                setLoading(false);
                return;
            }

            
            console.log("Token Verified:", { name, symbol, decimals: '18', address: config.existingTokenAddress });
            setConfig(prev => ({...prev,
                governanceTokenAddress: config.existingTokenAddress,
                tokenName: name,
                tokenSymbol: symbol
            }));
            
            
        } catch (error) {
            console.error("Token Verification Error:", error);
            setPageError("Verification Failed: Invalid address or contract doesn't support required ERC20/Ownable functions.");
        } finally {
            setIsDeploying(prev => ({...prev, token: false}));
            setLoading(false);
        }
    };

    const handleDeployStaking = () => {
        const deployer = new web3.eth.Contract(contractArtifacts.staking.abi).deploy({
            data: contractArtifacts.staking.bytecode,
            arguments: [config.governanceTokenAddress, account]
        });

        deployContract("Staking Contract", "staking", deployer, (address) => {
            setConfig(prev => ({...prev, stakingContractAddress: address}));
        });
    };

    const handleDeployVoting = () => {

        const periodInSeconds = parseVotingPeriod(config.votingPeriod);
        const quorumBasisPoints = parseQuorum(config.quorum);
        const deployer = new web3.eth.Contract(contractArtifacts.voting.abi).deploy({
            data: contractArtifacts.voting.bytecode,
            arguments: [config.stakingContractAddress, quorumBasisPoints.toString(), account]
        });

        deployContract("Voting Contract", "voting", deployer, (address) => {
            setConfig(prev => ({...prev, votingContractAddress: address}));
        });
    };

    const handleSaveDAO = async () => {

        if (!config.daoName.trim()) {
            setPageError("Please enter a name for your DAO.");
            return;
        }

        const daoData = {
            name: config.daoName.trim(),
            token: config.governanceTokenAddress,
            staking: config.stakingContractAddress,
            voting: config.votingContractAddress
        };

        setLoading(true, `Saving DAO "${daoData.name}"...`);
        clearError();

        try {
            const savedDao = await saveDaoInstance(daoData);
            addAndSelectDao(savedDao);
            setLoading(false);
            navigate('/daos');
        } catch (error) {
            setLoading(false);
            setError(err.response?.data?.message || err.message || "Failed to save DAO to server.");
        }

    };

    if (!isConnected || networkId !== targetNetworkId) {
        return <MessageDisplay message={!isConnected ? "Please connect wallet." : "Please switch network."} type="warn" />;
    }

   const renderStepContent = () => {
        switch(currentStep) {
            case 1: // Token Setup
                return (
                    <div className="deploy-step-content">
                         <h3>Step 1: Configure Your Governance Token</h3>
                         <div className="token-choice-buttons">
                             <button onClick={() => setConfig(p => ({...p, tokenChoice: 'create'}))} className={config.tokenChoice==='create'?'active':''}>Create New Token</button>
                             <button onClick={() => setConfig(p => ({...p, tokenChoice: 'existing'}))} className={config.tokenChoice==='existing'?'active':''}>Use Existing Token</button>
                         </div>
                         {config.tokenChoice === 'create' && <div className="deploy-form">
                             <input type="text" name="tokenName" placeholder="Token Name - eg.,DAO Token" onChange={handleConfigChange} />
                             <input type="text" name="tokenSymbol" placeholder="Token Symbol - eg., DAT" onChange={handleConfigChange} />
                             <input type="number" name="initialSupply" placeholder="Initial Supply - eg., 1000000" onChange={handleConfigChange} />
                         </div>}
                         {config.tokenChoice === 'existing' && <div className="deploy-form">
                             <input type="text" name="existingTokenAddress" placeholder="Enter Token Contract Address" value={config.existingTokenAddress} onChange={handleConfigChange} />
                         </div>}
                    </div>
                );
            case 2: // Staking Config
                 return (
                     <div className="deploy-step-content">
                         <h3>Step 2: Staking Contract Configuration</h3>
                         <p>The staking contract will be linked to the governance token specified in the previous step.</p>
                         <p>Currently, the only parameter is the token address. Advanced options like changing the unstake period can be added here in the future.</p>
                         {/* Placeholder for future staking options */}
                     </div>
                 );
            case 3: // Voting Config
                  return (
                     <div className="deploy-step-content">
                         <h3>Step 3: Voting Contract Configuration</h3>
                         <p>Set the rules for how proposals are handled in your DAO.</p>
                         <div className="deploy-form">
                             <label>Voting Period (e.g., '3 days', '72h')</label>
                             <input type="text" name="votingPeriod" value={config.votingPeriod} onChange={handleConfigChange} />
                             <label>Quorum Required (e.g., '4%', '500' for basis points)</label>
                             <input type="text" name="quorum" value={config.quorum} onChange={handleConfigChange} />
                         </div>
                     </div>
                  );
            case 4: // Deploy & Save
                const isReadyToSave = config.governanceTokenAddress && config.stakingContractAddress && config.votingContractAddress;
                 return (
                    <div className="deploy-step-content">
                         <h3>Step 4: Deploy Contracts & Finalize</h3>
                         <p>Review your configuration and deploy each contract one by one.</p>
                         <ul className="deploy-summary-list">
                             <li>
                                 <strong>Token:</strong>
                                 {config.governanceTokenAddress
                                     ? <code className="address-display">{config.governanceTokenAddress}</code>
                                     : <button onClick={config.tokenChoice === 'create' ? handleDeployToken : handleVerifyAndSetToken} disabled={isDeploying.token}>
                                        {isDeploying.token ? 'Processing...' : (config.tokenChoice === 'create' ? 'Deploy Token' : 'Verify & Set Token')}
                                       </button>}
                             </li>
                             <li>
                                 <strong>Staking Contract:</strong>
                                  {config.stakingContractAddress
                                     ? <code className="address-display">{config.stakingContractAddress}</code>
                                     : <button onClick={handleDeployStaking} disabled={isDeploying.staking || !config.governanceTokenAddress}>
                                         {isDeploying.staking ? 'Deploying...' : 'Deploy Staking'}
                                       </button>}
                             </li>
                              <li>
                                 <strong>Voting Contract:</strong>
                                   {config.votingContractAddress
                                     ? <code className="address-display">{config.votingContractAddress}</code>
                                     : <button onClick={handleDeployVoting} disabled={isDeploying.voting || !config.stakingContractAddress}>
                                         {isDeploying.voting ? 'Deploying...' : 'Deploy Voting'}
                                       </button>}
                             </li>
                         </ul>
                         {isReadyToSave && <div className="deploy-form finalize-section">
                             <h4>Finalize DAO Setup</h4>
                             <input type="text" name="daoName" placeholder="Enter a Name for this DAO" value={config.daoName} onChange={handleConfigChange} />
                             <button onClick={handleSaveDAO} disabled={!config.daoName.trim()}>Save DAO Instance</button>
                         </div>}
                    </div>
                 );
            default: return null;
        }
    };


    return (
        <div className="page deploy-page">
            <h2>DAO Deployment Wizard</h2>
            <ProgressBar steps={DEPLOYMENT_STEPS} currentStep={currentStep} goToStep={goToStep} />
            <div className="deploy-wizard-content">
                {/* Global/Page level messages */}
                <MessageDisplay />
                {pageError && <MessageDisplay specificError={pageError} />}

                {renderStepContent()}

                <div className="wizard-navigation">
                    {currentStep > 1 && <button onClick={handleBack} className="secondary">Back</button>}
                    {currentStep < DEPLOYMENT_STEPS.length && <button onClick={handleNext}>Next</button>}
                </div>
            </div>
        </div>
    );
};

export default DeployPage;