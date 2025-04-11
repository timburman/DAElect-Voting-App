import React, {useEffect, useState, useCallback} from "react";
import { useWeb3Context } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import MessageDisplay from "./MessageDisplay";

const StakingInterface = ({ mode }) => {
    const { web3, account, setLoading: setGlobalLoading, setError: setGlobalError, clearError } = useWeb3Context();
    const { tokenContract, stakingContract } = useContract();

    const [amount, setAmount] = useState('');
    const [tokenBalance, setTokenBalance] = useState('0');
    const [allowance, setAllowance] = useState('0');
    const [stakedBalance_, setStakedBalance] = useState('0');
    const [unstakeInfo, setUnstakeInfo] = useState({ amount: '0', unlockTime: '0' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');

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
        if (BigInt(stakedBalance_) < BigInt(weiAmount)) { setLocalError("Insufficient staked balance."); return; }
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
        <div className="staking-interface">
             {/* Display local errors specific to this interface */}
            {localError && <MessageDisplay specificError={localError} />}

            <p>Token Balance: {fromWei(tokenBalance)} {tokenSymbol}</p>
            <p>Staked Balance: {fromWei(stakedBalance_)} {tokenSymbol}</p>

            {mode === 'stake' && (
                <>
                    <h3>Stake Tokens</h3>
                    <p>Allowance: {fromWei(allowance)} {tokenSymbol}</p>
                    <div>
                        <input
                            type="number"
                            placeholder="Amount to Stake"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); clearLocalError(); }}
                            disabled={isSubmitting}
                            min="0" step="any"
                        />
                        <button onClick={handleApprove} disabled={isSubmitting || !amount || parseFloat(amount) <= 0}>
                            {isSubmitting ? 'Processing...' : 'Approve'}
                        </button>
                        <button onClick={handleStake} disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || !hasAllowance}>
                            {isSubmitting ? 'Processing...' : 'Stake'}
                        </button>
                    </div>
                </>
            )}

            {mode === 'unstake' && (
                <>
                    <h3>Unstake Tokens</h3>
                    <div>
                        <input
                            type="number"
                            placeholder="Amount to Unstake"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); clearLocalError(); }}
                            disabled={isSubmitting || unstakeInfo.amount !== '0'} // Disable if already pending
                            min="0" step="any"
                        />
                        <button
                            onClick={handleInitiateUnstake}
                            disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || unstakeInfo.amount !== '0'}
                        >
                            {isSubmitting ? 'Processing...' : 'Initiate Unstake'}
                        </button>
                    </div>

                    {unstakeInfo.amount !== '0' && (
                        <div className='unstake-info'>
                            <p>Pending Unstake: {fromWei(unstakeInfo.amount)} {tokenSymbol}</p>
                            <p>Unlock Time: {formatTimestamp(unstakeInfo.unlockTime)}</p>
                            <button onClick={handleWithdraw} disabled={isSubmitting || !canWithdraw}>
                                {isSubmitting ? 'Processing...' : 'Withdraw'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StakingInterface;