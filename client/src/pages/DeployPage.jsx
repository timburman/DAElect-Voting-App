import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3Context } from "../contexts/Web3Context";
import { contractArtifacts } from "../config/contracts";
import { saveDaoInstance } from "../services/proposalService";
import MessageDisplay from "../components/MessageDisplay";
import LoadingSpinner from "../components/LoadingSpinner";

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

const DeployPage = () => {

    const { web3, account, isConnected, networkId, targetNetworkId, setLoading, setError, clearError, switchDao, saveDaoConfig, addAndSelectDao, getSignature } = useWeb3Context();
    const navigate = useNavigate();

    const [tokenChoice, setTokenChoice] = useState(null);

    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [initialSupplyInput, setInitialSupplyInput] = useState('');

    const [daoNameToSave, setDaoNameToSave] = useState('');
    const [isSavingDao, setIsSavingDao] = useState(false);

    const [governanceTokenAddressInput, setGovernanceTokenAddressInput] = useState('');

    const [isProcessingToken, setIsProcessingToken] = useState(false);
    const [verifiedTokenInfo, setVerifiedTokenInfo] = useState(null);

    const [isDeployingStaking, setIsDeployingStaking] = useState(false);
    const [deployedStakingAddress, setDeployedStakingAddress] = useState(null);

    const [votingPeriodInput, setVotingPeriodInput] = useState('5 days');
    const [quorumInput, setQuorumInput] = useState('4%');
    const [isDeployingVoting, setIsDeployingVoting] = useState(false);
    const [deployedVotingAddress, setDeployedVotingAddress] = useState(null);
    
    const [pageError, setPageError] = useState('');
    const [deploymentSuccessInfo, setDeploymentSuccessInfo] = useState(null);

    const clearPageError = () => setPageError('');

    const handleDeployToken = async (e) => {
        e.preventDefault();
        clearPageError();
        clearError();

        if (!tokenName.trim() || !tokenSymbol.trim() || !initialSupplyInput || parseFloat(initialSupplyInput) <= 0) {
            setPageError("Please provide a valid Token Name, Symbol, and Initial Supply > 0.");
            return;
        }
        if (!web3 || !account) {
            setPageError("Wallet Not Connected.");
            return;
        }

        setIsProcessingToken(true);
        setLoading(true, `Deploying Governance Token...`);

        try {
            const supply = BigInt(initialSupplyInput);
            const decimal = 18n;
            const finalInitialSupply = supply * (10n ** decimal);

            const tokenDeployer = new web3.eth.Contract(contractArtifacts.token.abi).deploy(
                {
                    data: contractArtifacts.token.bytecode,
                    arguments: [tokenName.trim(),
                                tokenSymbol.trim().toUpperCase(),
                                finalInitialSupply.toString(),
                                account]
                }
            );

            await tokenDeployer.send({from: account})
            .on('transactionHash', hash => setLoading(true, `Deploying Token Tx: ${hash.substring(0,10)}...`))
            .on('receipt', receipt => {
                const newTokenAddress = receipt.contractAddress;
                console.log("Token Deployed:",newTokenAddress);
                setVerifiedTokenInfo({
                    name: tokenName.trim(),
                    symbol: tokenSymbol.trim().toUpperCase(),
                    decimal: 18,
                    address: newTokenAddress,
                    isOwnerVerified: true
                });
                setLoading(false);
            })
            .on('error', (error) => {
                console.error("Token Deployment Error:",error);
                setError(`Token deployment Failed: ${error.message}`);
                setLoading(false);
            });

        } catch (error) {
            console.error("Token Deploy Send Error:", error);
            setError(`Error deploying token: ${error.message}`); // Use global error
            setLoading(false);
        } finally {
            setIsProcessingToken(false);
        }
    };

    const handleVerifiedToken = async () => {
        clearPageError();
        clearError();

        if (!governanceTokenAddressInput || !web3.utils.isAddress(governanceTokenAddressInput)) {
            setPageError("Please enter a valid Ethereum address for the token.");
            return;
        }
        if (!web3 || !account) { setPageError("Wallet not connected."); return; }

        setIsProcessingToken(true);
        setLoading(true, 'Verifying Token...');
        
        try {
            const enteredAddress = governanceTokenAddressInput.trim();

            const tempToken = new web3.eth.Contract(contractArtifacts.token.abi, enteredAddress);

            const signatureMessage = `Sign to verify you are the owner of this ERC-20 token at address: ${enteredAddress}. No Gas will be charged`;

            const localValidSig = await getSignature(signatureMessage);
            if (!localValidSig) {
                setPageError("Verification Failed: Your connected account is not the owner of this token contract.");
                setLoading(false);
                setIsProcessingToken(false);
                return;
            }

            const [name, symbol, owner] = await Promise.all([
                tempToken.methods.name().call(),
                tempToken.methods.symbol().call(),
                tempToken.methods.owner().call(),
            ]);

            const ownerMatches = owner.toLowerCase() === account.toLowerCase();

            if (!ownerMatches) {
                setPageError("Verification Failed: Your connected account is not the owner of this token contract.");
                setLoading(false);
                setIsProcessingToken(false);
                return;
            }
            
            console.log("Token Verified:", { name, symbol, decimals: '18', address: enteredAddress });
            setVerifiedTokenInfo({
                name,
                symbol,
                decimals: parseInt('18', 10), // Store as number
                address: enteredAddress,
                isOwnerVerified: true
            });
            setLoading(false);
            
        } catch (error) {
            console.error("Token Verification Error:", error);
            setPageError("Verification Failed: Invalid address or contract doesn't support required ERC20/Ownable functions.");
            setLoading(false);
        } finally {
            setIsProcessingToken(false);
        }
    };

    const handleDeployStaking = async () => {
        clearPageError();
        clearError();
        if (!verifiedTokenInfo?.address) { setPageError("Verify a token first."); return; }
        if (!web3 || !account) { setPageError("Wallet not connected."); return; }

        setIsDeployingStaking(true);
        setLoading(true, "Deploying Staking Contract..");

        try {
            const stakingDeployer = new web3.eth.Contract(contractArtifacts.staking.abi).deploy({
                data: contractArtifacts.staking.bytecode,
                arguments: [verifiedTokenInfo.address, account]
            });

            await stakingDeployer.send({from: account})
            .on('transactionHash', hash => setLoading(true, `Deploying Staking Tx: ${hash.substring(0,10)}...`))
            .on('receipt', receipt => {
                const newStakingAddress = receipt.contractAddress;
                console.log("Staking Contract Deployed:",newStakingAddress);
                setDeployedStakingAddress(newStakingAddress);
                setLoading(false);
            })
            .on('error', (error) => {
                console.error("Staking Deploy Error:", error);
                setError(`Staking contract deployment failed: ${error.message}`);
                setLoading(false);
            });

        } catch (error) {
            console.error("Staking Deploy Send Error:", error);
            setError(`Error deploying staking contract: ${error.message}`);
            setLoading(false);
        } finally {
            setIsDeployingStaking(false);
        }
    };

    const handleDeployVoting = async () => {
        clearPageError();
        clearError();

        if (!deployedStakingAddress) { setPageError("Deploy Staking contract first."); return; }
        if (!web3 || !account) { setPageError("Wallet not connected."); return; }

        const periodInSeconds = parseVotingPeriod(votingPeriodInput);
        const quorumBasisPoints = parseQuorum(quorumInput);

        if (quorumBasisPoints === null || quorumBasisPoints < 0 || quorumBasisPoints > 10000) {
            setPageError("Invalid Quorum format (e.g., '4%', '10.5', '500' for basis points). Must be between 0-10000."); return;
       }

       setIsDeployingVoting(true);
       setLoading(true, 'Deploying Voting Contract...');

       try {
            const votingDeployer = new web3.eth.Contract(contractArtifacts.voting.abi).deploy({
                data: contractArtifacts.voting.bytecode,
                arguments: [
                    deployedStakingAddress,
                    quorumBasisPoints.toString(),
                    account
                ]
            });

            await votingDeployer.send({from: account})
            .on('transactionHash', hash => setLoading(true, `Deploying Voting Tx: ${hash.substring(0,10)}...`))
            .on('receipt', receipt => {
                const newVotingAddress = receipt.contractAddress;
                console.log("Voting Contract Deployed:", newVotingAddress);
                setDeployedVotingAddress(newVotingAddress);
                console.log("Voting Address:",deployedVotingAddress);
                setDeploymentSuccessInfo({
                    token: verifiedTokenInfo.address,
                    staking: deployedStakingAddress,
                    voting: newVotingAddress,
                });
                setLoading(false);
            })
            .on('error', (error) => {
                console.error("Voting Deploy Error:", error);
                setError(`Voting contract deployment failed: ${error.message}`);
                setLoading(false);
            });
       } catch (error) {
            console.error("Voting Deploy Send Error:", error);
            setError(`Error deploying voting contract: ${error.message}`);
            setLoading(false);
        } finally {
            setIsDeployingVoting(false);
        }
    }

    const handleSaveAndUse = async () => {
        if (!deploymentSuccessInfo || !daoNameToSave.trim()) {
            setPageError("Please enter a name for this DAO instance.");
            return;
        }

        clearPageError();
        setIsSavingDao(true);
        setLoading(true, `Saving DAO instance "${daoNameToSave.trim()}"...`);
        setError('');

        const daoData = {
            name: daoNameToSave.trim(),
            token: deploymentSuccessInfo.token,
            staking: deploymentSuccessInfo.staking,
            voting: deploymentSuccessInfo.voting
        };

        try {
            const savedDaoWithId = await saveDaoInstance(daoData);

            addAndSelectDao(savedDaoWithId);

            setLoading(false);
            navigate('/daos');
        } catch (error) {
            console.error("Failed to save DAO instance:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to save DAO configuration to server.";
            setError(errorMsg);
            setLoading(false);
        } finally {
            setIsSavingDao(false);
        }
    };

    if (!isConnected || networkId !== targetNetworkId) {
        return <MessageDisplay message={!isConnected ? "Please connect wallet." : "Please switch network."} type="warn" />;
    }

   return (
       <div className="page deploy-page">
           <h2>Deploy Your DAO Contracts</h2>
           <MessageDisplay />
           {pageError && <MessageDisplay specificError={pageError} />}

           
           {!verifiedTokenInfo && (
               <section className="deploy-step">
                   <h3>Step 1: Governance Token</h3>
                   <p>Do you have an existing ERC20 token with Ownable features?</p>
                   <button onClick={() => setTokenChoice('existing')} disabled={isProcessingToken} className={tokenChoice==='existing'?'active':''}>
                       Yes, Use Existing Token
                   </button>
                   <button onClick={() => setTokenChoice('create')} disabled={isProcessingToken} className={tokenChoice==='create'?'active':''}>
                       No, Create New Token
                   </button>

                   
                   {tokenChoice === 'create' && (
                       <form onSubmit={handleDeployToken} className="deploy-form">
                           <h4>Create New Token</h4>
                           <input type="text" placeholder="Token Name (e.g., MyCommunity Token)" value={tokenName} onChange={e => setTokenName(e.target.value)} required />
                           <input type="text" placeholder="Token Symbol (e.g., MCT)" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} required />
                           <input type="number" placeholder="Initial Supply (e.g., 1000000)" value={initialSupplyInput} onChange={e => setInitialSupplyInput(e.target.value)} required min="1" />
                           {initialSupplyInput && <p><small>Will mint: {initialSupplyInput} * 10^18 tokens</small></p>}
                           <button type="submit" disabled={isProcessingToken}>
                               {isProcessingToken ? 'Deploying...' : 'Deploy Token'}
                           </button>
                       </form>
                   )}

                   
                    {tokenChoice === 'existing' && (
                       <div className="deploy-form">
                           <h4>Use Existing Token</h4>
                           <input type="text" placeholder="Enter Token Contract Address" value={governanceTokenAddressInput} onChange={e => setGovernanceTokenAddressInput(e.target.value)} required />
                           <button onClick={handleVerifiedToken} disabled={isProcessingToken || !governanceTokenAddressInput}>
                               {isProcessingToken ? 'Verifying...' : 'Verify Token & Ownership'}
                            </button>
                       </div>
                    )}
               </section>
           )}


           
           {verifiedTokenInfo && !deployedStakingAddress && (
                <section className="deploy-step">
                    <h3>Step 2: Deploy Staking Contract</h3>
                    <p>Using Token: <strong>{verifiedTokenInfo.name} ({verifiedTokenInfo.symbol})</strong></p>
                    <p>Address: <code>{verifiedTokenInfo.address}</code></p>
                    {verifiedTokenInfo.isOwnerVerified && <p><small>✅ Ownership Verified</small></p>}
                    <button onClick={handleDeployStaking} disabled={isDeployingStaking}>
                        {isDeployingStaking ? 'Deploying...' : 'Deploy Staking Contract'}
                    </button>
                </section>
           )}

            
            {deployedStakingAddress && !deployedVotingAddress && (
                <section className="deploy-step">
                    <h3>Step 3: Deploy Voting Contract</h3>
                     <p>Using Token: <code>{verifiedTokenInfo.address}</code></p>
                     <p>Using Staking Contract: <code>{deployedStakingAddress}</code></p>
                    <div className="deploy-form">
                        <input type="text" placeholder="Voting Period (e.g., 3 days, 72h)" value={votingPeriodInput} onChange={e => setVotingPeriodInput(e.target.value)} required />
                        <input type="text" placeholder="Quorum (e.g., 4%, 10.5, 500)" value={quorumInput} onChange={e => setQuorumInput(e.target.value)} required />
                         <button onClick={handleDeployVoting} disabled={isDeployingVoting}>
                            {isDeployingVoting ? 'Deploying...' : 'Deploy Voting Contract'}
                        </button>
                    </div>
                </section>
            )}


                {deploymentSuccessInfo && (
                  <section className="deploy-step success-summary">
                      <h3>✅ Deployment Successful!</h3>
                      <p>Your new DAO contracts are ready:</p>
                      {/* ... (Display addresses) ... */}
                      <ul>
                          <li><strong>Governance Token:</strong> <code>{deploymentSuccessInfo.token}</code></li>
                          <li><strong>Staking Contract:</strong> <code>{deploymentSuccessInfo.staking}</code></li>
                          <li><strong>Voting Contract:</strong> <code>{deploymentSuccessInfo.voting}</code></li>
                      </ul>
                      {/* Input for DAO Name */}
                      <div className="deploy-form" style={{marginTop: '1rem'}}>
                          <input
                              type="text"
                              placeholder="Enter a Name for this DAO"
                              value={daoNameToSave}
                              onChange={(e) => setDaoNameToSave(e.target.value)}
                              required
                          />
                      </div>

                      <button onClick={handleSaveAndUse} disabled={!daoNameToSave.trim() || isSavingDao}>
                          {isSavingDao ? 'Saving...' : 'Save & Use This DAO Instance'}
                      </button>
                  </section>
                )}

       </div>
   );

}

export default DeployPage;