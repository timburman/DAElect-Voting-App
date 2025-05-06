import React, { useState } from 'react';
import StakingInterface from '../components/StakingInterface';
import { useWeb3Context } from '../contexts/Web3Context';
import MessageDisplay from '../components/MessageDisplay'; // To show errors/loading

const StakingPage = () => {
    const [mode, setMode] = useState('stake'); // 'stake' or 'unstake'
    const { isConnected, networkId, targetNetworkId } = useWeb3Context();

    if (!isConnected || networkId !== targetNetworkId) {
         return <MessageDisplay message={!isConnected ? "Please connect your wallet." : "Please switch to the correct network."} type="warn" />;
    }

    return (
        <div className="page staking-page">
            <h2>Staking</h2>
             <MessageDisplay /> {/* Shows global loading/error from context */}
            <div className="staking-toggle">
                <button onClick={() => setMode('stake')} className={mode === 'stake' ? 'active' : ''}>Stake</button>
                <button onClick={() => setMode('unstake')} className={mode === 'unstake' ? 'active' : ''}>Unstake</button>
            </div>
            <StakingInterface mode={mode} />
        </div>
    );
};
export default StakingPage;