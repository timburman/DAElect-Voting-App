import React, {useEffect, useState, useCallback} from "react";
import { useWeb3Context } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import MessageDisplay from "./MessageDisplay";

const StakingInterface = () => {
    const { web3, account, setLoading: setGlobalLoading, setError: setGlobalError, clearError: clearGlobalError, tokenContract, stakingContract } = useWeb3Context();

    const [amount, setAmount] = useState('');
    const [tokenBalance, setTokenBalance] = useState('0');
    const [allowance, setAllowance] = useState('0');
    const [stakedBalance, setStakedBalance] = useState('0');
    const [unstakeInfo, setUnstakeInfo] = useState({ amount: '0', unlockTime: '0' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [stakingMode, setStakingMode] = useState('stake');

    const clearLocalError = useCallback(() => setLocalError(''), []);

    const toWei = (val) => web3 ? web3.utils.toWei(val?.toString() || '0', 'ether') : '0';
    const fromWei = (val) => web3 ? web3.utils.fromWei(val?.toString() || '0', 'ether') : '0';
    const formatTimestamp = (timestamp) => {
        if (!timestamp || timestamp === '0') return 'N/A';
        try {
            return new Date(parseInt(timestamp) * 1000).toLocaleString();
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const fetchData = useCallback(async () => {
        if (!account || !tokenContract || !stakingContract || !web3) {
            return;
        }
        clearLocalError();
        try {
            const [bal, allow, staked, info, symbol] = await Promise.all([
                tokenContract.methods.balanceOf(account).call(),
                tokenContract.methods.allowance(account, stakingContract.options.address).call(),
                stakingContract.methods.stakedBalance(account).call(),
                stakingContract.methods.getUnstakedRequest(account).call(),
                tokenContract.methods.symbol().call(),
            ]);
            setTokenBalance(bal?.toString() ?? '0');
            setAllowance(allow?.toString() ?? '0' );
            setStakedBalance(staked?.toString() ?? '0');
            setUnstakeInfo({
                amount: info?.amount?.toString() ?? '0',
                unlockTime: info?.unlockTime?.toString() ?? '0'
            });
            setTokenSymbol(symbol?.toString() ?? `${tokenSymbol}`);

            clearLocalError();

        } catch (fetchError) {
            console.error("Error fetching staking data:");
            let errorMsg = "Failed to fetch staking details. Please refresh.";
            if (fetchError instanceof Error && fetchError.message) {
                 // Include the message from standard Error objects
                errorMsg = `Failed to fetch staking details: ${fetchError.message}`;
            } else if (typeof fetchError === 'string') {
                // Handle cases where a plain string might be thrown/rejected
                errorMsg = `Failed to fetch staking details: ${fetchError}`;
            } // Add more specific checks if needed based on web3 errors

            setLocalError(errorMsg);
        }
    }, [account, clearLocalError, tokenContract, stakingContract, web3, tokenSymbol]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sendTransaction = async (contractMethod, loadingMsg, successMsg, onComplete) => {
        if (!account || !web3) {
            setLocalError("Wallet not connected");
            return;
        }
        setIsSubmitting(true);
        setLocalError('');
        setGlobalLoading(true, loadingMsg);

        try {
            
            await contractMethod.send({from: account})
                .on('transactionHash', (hash) => {
                    setGlobalLoading(true, `Processing: ${hash.substring(0,10)}...`);
                })
                .on('receipt', (receipt) => {
                    setGlobalLoading(false); // Clear global loading
                    setIsSubmitting(false); // Clear local loading
                    setGlobalLoading(true, successMsg); // Show success briefly using global indicator
                    setTimeout(() => setGlobalLoading(false), 3000); // Clear success message
                    fetchData(); // Refresh data
                    if (onComplete) onComplete();
                })
                .on('error', (error, receipt) => {
                    console.error("Transaction error:",error);
                    let revertReason = "Transaction failed.";
                    if (error.message.includes('revert')) {
                        try {
                            const reasonMatch = error.message.match(/revert(?:ed)?:? (.*)/);
                             if(reasonMatch && reasonMatch[1]) {
                                revertReason = `Transaction reverted: ${reasonMatch[1].split('\'')[1] || reasonMatch[1].trim()}`; // Try to extract reason
                            } else {
                                revertReason = `Transaction reverted. TxHash: ${receipt?.transactionHash || 'N/A'}`;
                            }
                        } catch { revertReason = error.message; }
                    } else {
                        revertReason = error.message;
                    }

                    setGlobalError(revertReason);
                    setIsSubmitting(false);
                    setGlobalLoading(false);
                });

        } catch (error) {
            console.error("Send Transaction error:", error);
            setGlobalError(`Error: ${error.message}`); // Show error globally
            setIsSubmitting(false);
            setGlobalLoading(false);
        }
    };

    const handleApprove = () => {
        if (!amount || parseFloat(amount) <= 0) { setLocalError("Enter Valid Amount."); return; }
        if (!tokenContract) { setLocalError("Token contract not loaded."); return;}
        const weiAmount = toWei(amount);
        sendTransaction(
            tokenContract.methods.approve(stakingContract.options.address, weiAmount),
            `Approving ${amount} ${tokenSymbol}...`, "Approval Successful!",
            () => setAmount('')
        );
    };

    const handleStake = () => {
        if (!amount || parseFloat(amount) <= 0) { setLocalError("Enter valid amount."); return; }
        if (!stakingContract) { setLocalError("Staking contract not loaded."); return; }
        const weiAmount = toWei(amount);
        if (BigInt(allowance) < BigInt(weiAmount)) { setLocalError(`Insufficient allowance. Approve ${amount} ${tokenSymbol} first.`); return; }
        if (BigInt(tokenBalance) < BigInt(weiAmount)) { setLocalError(`Insufficient token balance.`); return; }

        sendTransaction(
            stakingContract.methods.stake(weiAmount),
            `Staking ${amount} ${tokenSymbol}...`, "Stake successful!",
            () => setAmount('') 
        );
    };

    const handleInitiateUnstake = () => {
        if (!amount || parseFloat(amount) <= 0) { setLocalError("Enter valid amount."); return; }
        if (!stakingContract) { setLocalError("Staking contract not loaded."); return; }
        const weiAmount = toWei(amount);
        if (BigInt(stakedBalance) < BigInt(weiAmount)) { setLocalError("Insufficient staked balance."); return; }
        if (unstakeInfo.amount !== '0') { setLocalError("Unstake already pending."); return; }

        sendTransaction(
            stakingContract.methods.initiateUnstaking(weiAmount),
            `Initiating unstake for ${amount} ${tokenSymbol}...`, "Unstake initiated!",
             () => setAmount('')
        );
    };

     const handleWithdraw = () => {
        if (!stakingContract) { setLocalError("Staking contract not loaded."); return; }
        if (unstakeInfo.amount === '0') { setLocalError("No pending unstake."); return; }
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime < parseInt(unstakeInfo.unlockTime)) { setLocalError(`Cannot withdraw yet.`); return; }

        sendTransaction(
            stakingContract.methods.withdraw(),
            `Withdrawing ${fromWei(unstakeInfo.amount)} ${tokenSymbol}...`, "Withdrawal successful!"
            
        );
    };

    
    const hasAllowance = BigInt(allowance) >= BigInt(toWei(amount || '0'));
    const canWithdraw = unstakeInfo.amount !== '0' && Math.floor(Date.now() / 1000) >= parseInt(unstakeInfo.unlockTime);

    return (
        <div className="staking-interface-container"> {/* Changed outer class maybe */}
            {localError && <MessageDisplay specificError={localError} />}

             {/* Mode Toggle Buttons */}
             <div className="staking-mode-toggle">
                 <button onClick={() => setStakingMode('stake')} className={stakingMode === 'stake' ? 'active' : ''} disabled={isSubmitting}>
                     Stake
                 </button>
                 <button onClick={() => setStakingMode('unstake')} className={stakingMode === 'unstake' ? 'active' : ''} disabled={isSubmitting}>
                     Unstake / Withdraw
                 </button>
             </div>

            {/* Display Balances */}
             <div className="staking-balances">
                 <p>Your Balance: {fromWei(tokenBalance)} TKN</p>
                 <p>Currently Staked: {fromWei(stakedBalance)} TKN</p>
             </div>


            {/* Conditional Rendering based on internal stakingMode */}
            {stakingMode === 'stake' && (
                <div className="stake-section">
                     <h4>Stake Tokens</h4>
                     <p><small>Allowance: {fromWei(allowance)} TKN</small></p>
                     <div>
                         <input type="number" placeholder="Amount" value={amount} onChange={(e) => { setAmount(e.target.value); clearLocalError(); }} disabled={isSubmitting} min="0" step="any"/>
                         <button onClick={handleApprove} disabled={isSubmitting || !amount || parseFloat(amount) <= 0}>
                             Approve
                         </button>
                         <button onClick={handleStake} disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || !hasAllowance}>
                             Stake
                         </button>
                     </div>
                </div>
            )}

            {stakingMode === 'unstake' && (
                 <div className="unstake-section">
                     <h4>Unstake / Withdraw</h4>
                     {unstakeInfo.amount === '0' ? (
                        <div> {/* Initiate Unstake Form */}
                            <input type="number" placeholder="Amount to Unstake" value={amount} onChange={(e) => { setAmount(e.target.value); clearLocalError(); }} disabled={isSubmitting} min="0" step="any"/>
                             <button onClick={handleInitiateUnstake} disabled={isSubmitting || !amount || parseFloat(amount) <= 0}>
                                Initiate Unstake
                             </button>
                        </div>
                     ) : (
                         <div className='unstake-info'> {/* Display Pending Unstake */}
                             <p><strong>Unstake Pending:</strong> {fromWei(unstakeInfo.amount)} TKN</p>
                             <p>Unlock Time: {formatTimestamp(unstakeInfo.unlockTime)}</p>
                             <button onClick={handleWithdraw} disabled={isSubmitting || !canWithdraw}>
                                 {isSubmitting ? 'Processing...' : 'Withdraw Now'}
                             </button>
                         </div>
                     )}
                </div>
            )}
        </div>
    );
};

export default StakingInterface;