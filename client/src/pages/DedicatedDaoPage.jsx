import React, { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3Context } from '../contexts/Web3Context';
import StakingInterface from '../components/StakingInterface';
import ProposalCard from '../components/ProposalCard';
import MessageDisplay from '../components/MessageDisplay';
import LoadingSpinner from '../components/LoadingSpinner';


const DedicatedDaoPage = () => {

    const { daoId } = useParams();
    const navigate = useNavigate();

    const {
        account, isConnected, networkId, targetNetworkId,
        savedDaoConfigs, currentDaoAddresses, switchDao,
        votingContract, isOwner,
        setLoading, setError
    } = useWeb3Context();

    const [proposals, setProposals] = useState([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const [proposalError, setProposalError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProposalDesc, setNewProposalDesc] = useState('');

    const proposalStateMap = { 0: 'Pending', 1: 'Active', 2: 'Canceled', 3: 'Defeated', 4: 'Succeeded' };

    useEffect(() => {

        if (daoId && savedDaoConfigs.length > 0) {
            const numericDaoId = parseInt(daoId, 10);
            const targetDao = savedDaoConfigs.find(d => d.id === numericDaoId);

            if (targetDao) {
                
                if (currentDaoAddresses?.id !== numericDaoId) {
                    console.log(`[DedicatedDaoPage] Switching context to DAO ID: ${numericDaoId}`);
                    switchDao(targetDao);
                }
            } else {
                
                console.warn(`DAO ID ${daoId} not found in saved configurations.`);
                setError(`DAO with ID ${daoId} not found.`);
                navigate('/daos');
            }
        }

    }, [daoId, savedDaoConfigs, currentDaoAddresses, switchDao, navigate, setError]);

    const fetchProposals = useCallback(async () => {
    
        if (!isConnected || networkId !== targetNetworkId || !currentDaoAddresses || !votingContract) {
            setProposals([]);
            return;
        }
        console.log(`Workspacing proposals for DAO: ${currentDaoAddresses.name} ${currentDaoAddresses.voting}`);
        setIsLoadingProposals(true);
        setProposalError('');

        try {
            const countBigInt = await votingContract.methods.proposalCounter().call();
            const count = Number(countBigInt);
            const fetchedProposals = [];

            for (let i = count; i >= 1; i--) {
                try {
                    const proposalData = await votingContract.methods.getProposal(i).call();

                    fetchedProposals.push({
                        id: proposalData.id.toString(),
                        proposer: proposalData.proposer,
                        description: proposalData.description,
                        startTime: proposalData.startTime.toString(),
                        endTime: proposalData.endTime.toString(),
                        forVotes: proposalData.forVotes.toString(),
                        againstVotes: proposalData.againstVotes.toString(),
                        abstainVotes: proposalData.abstainVotes.toString(),
                        totalVotesParticipated: proposalData.totalVotesParticipated.toString(),
                        snapshotTotalStaked: proposalData.snapshotTotalStaked.toString(),
                        canceled: proposalData.canceled,
                        stateText: proposalStateMap[proposalData.state.toString()] || 'Unknown', // Map state index to string
                        stateIndex: proposalData.state.toString() // Keep index if needed
                    });
                } catch (error) {
                    console.error(`Error fetching proposal ID ${i}:`, error);
                }
            }
            setProposals(fetchedProposals);
        } catch (error) {
            console.error("Error fetching proposals:", error);
            setProposalError(`Could not fetch proposals for ${currentDaoAddresses.name}.`);
        } finally {
            setIsLoadingProposals(false);
        }


    }, [daoId, currentDaoAddresses, votingContract]);

    

    useEffect(() => {
        if (isConnected && networkId === targetNetworkId) {
            fetchProposals();
        } else {
            setProposals([]);
        }
    }, [isConnected, networkId, targetNetworkId, fetchProposals]);

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        if (!votingContract || !account || !newProposalDesc.trim() || !isOwner) return; // Basic checks
        setLoading(true, 'Creating proposal...'); setError('');
        try {
            await votingContract.methods.createProposal(newProposalDesc.trim())
                .send({ from: account })
                .on('receipt', () => { 
                    fetchProposals();
                    setShowCreateModal(false);
                    setNewProposalDesc('');
                    setLoading(false);
                    setLoading(true, 'Proposal Created!', 2000);
                    setLoading(false);
                })
                .on('error', (err) => { setError(`Create failed: ${err.message}`); setLoading(false); });
        } catch (err) { setError(`Tx error: ${err.message}`); setLoading(false); }
   };

   if (!isConnected || networkId !== targetNetworkId) {
        return <MessageDisplay message={!isConnected ? "Connect wallet." : "Switch network."} type="warn" />;
    }
    // Show loading/error while context might be switching DAO based on URL
    if (!currentDaoAddresses || currentDaoAddresses.id !== parseInt(daoId, 10)) {
        return (
            <div className="page dedicated-dao-page">
                <LoadingSpinner /> Loading DAO Data...
                <MessageDisplay /> {/* Show potential errors from context */}
            </div>
        );
    }


    return (
    <div className="page dedicated-dao-page">
        <h2>{currentDaoAddresses.name || 'DAO Management'}</h2>
        <MessageDisplay /> {/* Global messages */}

        <div className="dao-columns-container">
            {/* Left Column: Proposals */}
            <div className="proposals-column">
                <h3>Proposals</h3>
                {isOwner && (
                    <button onClick={() => setShowCreateModal(true)} style={{ marginBottom: '1rem' }}>
                        + Create Proposal
                    </button>
                )}
                    <button onClick={fetchProposals} disabled={isLoadingProposals}>
                    {isLoadingProposals ? 'Refreshing...' : 'Refresh List'}
                    </button>

                    {proposalError && <MessageDisplay specificError={proposalError} />}
                    {isLoadingProposals && <LoadingSpinner />}

                    {!isLoadingProposals && proposals.length === 0 && !proposalError && (
                        <p>No proposals found for this DAO.</p>
                    )}
                    {!isLoadingProposals && proposals.length > 0 && (
                        <div className="proposal-list-column"> {/* Use a specific class if needed */}
                            {proposals.map((proposal) => (
                                <ProposalCard key={proposal.id} proposal={proposal} />
                            ))}
                        </div>
                    )}
            </div>

            {/* Right Column: Staking */}
            <div className="staking-column">
                    <h3>Staking & Power</h3>
                    {/* StakingInterface now manages its own stake/unstake toggle */}
                    <StakingInterface />
            </div>
        </div>

        {/* Create Proposal Modal (same as before) */}
        {showCreateModal && isOwner && (
                <div className="modal-backdrop"> <div className="modal-content">
                    <h3>Create Proposal for {currentDaoAddresses.name}</h3>
                    <form onSubmit={handleCreateProposal}>
                        <textarea /* ... */ value={newProposalDesc} onChange={e => setNewProposalDesc(e.target.value)} />
                        <div>
                            <button type="submit" disabled={!newProposalDesc.trim()}>Submit</button>
                            <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div> </div>
        )}
    </div>
    );
};

export default DedicatedDaoPage;