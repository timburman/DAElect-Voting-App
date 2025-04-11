import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3Context } from '../contexts/Web3Context';
import ProposalCard from '../components/ProposalCard';
import MessageDisplay from '../components/MessageDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const VotingPage = () => {
    const { account, isOwner, votingContract, isConnected, networkId, targetNetworkId, setLoading, setError, votingOwner } = useWeb3Context();
    const [proposals, setProposals] = useState([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const [proposalError, setProposalError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false); // For create proposal form
    const [newProposalDesc, setNewProposalDesc] = useState('');

    const proposalStateMap = { '0': 'Pending', '1': 'Active', '2': 'Canceled', '3': 'Defeated', '4': 'Succeeded' };
    console.log('isOwner:', isOwner);
    console.log('Owner:', votingOwner);
    const fetchProposals = useCallback(async () => {
        if (!votingContract) {
            // Don't set an error if contract just isn't loaded yet
            // console.log("Voting contract not available for fetching proposals.");
            return;
        }
        setIsLoadingProposals(true);
        setProposalError('');
        try {
            const countBigInt = await votingContract.methods.proposalCounter().call();
            const count = Number(countBigInt); // Convert BigInt/string to Number
            const fetchedProposals = [];

            // Fetch proposals in reverse order (newest first) - more efficient? Maybe not significantly for .call()
            for (let i = count; i >= 1; i--) {
                try {
                    const proposalData = await votingContract.methods.getProposal(i).call();
                    // Convert BigInt fields to strings for React state
                    const formattedProposal = {
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
                        state: proposalStateMap[proposalData.state.toString()] || 'Unknown', // Map state index to string
                        stateIndex: proposalData.state.toString() // Keep index if needed
                    };
                    fetchedProposals.push(formattedProposal);
                } catch (error) {
                    console.error(`Error fetching proposal ID ${i}:`, error);
                    // Optionally skip failed proposals or add placeholder
                }
            }
            setProposals(fetchedProposals); // Already reversed due to loop direction
        } catch (error) {
            console.error("Error fetching proposals:", error);
            setProposalError("Could not fetch proposals list.");
        } finally {
            setIsLoadingProposals(false);
        }
    }, [votingContract]); // Depend on votingContract instance

    useEffect(() => {
        if (isConnected && networkId === targetNetworkId) {
            fetchProposals();
        } else {
            setProposals([]); // Clear proposals if disconnected or wrong network
        }
    }, [isConnected, networkId, targetNetworkId, fetchProposals]); // Rerun if connection status or fetch function changes

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        if (!votingContract || !account || !newProposalDesc.trim()) return;

        setLoading(true, 'Creating proposal...'); // Use global loading
        setError('');
        try {
            await votingContract.methods.createProposal(newProposalDesc.trim())
                .send({ from: account })
                .on('receipt', () => {
                    setLoading(false);
                    setLoading(true, 'Proposal Created! Refreshing...'); // Show success briefly
                    setShowCreateModal(false); // Close modal
                    setNewProposalDesc('');
                    fetchProposals(); // Refresh list
                    setTimeout(() => setLoading(false), 2000);
                })
                .on('error', (error) => {
                     console.error("Create proposal error:", error);
                     setError(`Failed to create proposal: ${error.message}`);
                     setLoading(false);
                });
        } catch (error) {
            console.error("Send error:", error);
            setError(`Error sending transaction: ${error.message}`);
            setLoading(false);
        }
    };


    // --- Render ---
    if (!isConnected || networkId !== targetNetworkId) {
         return <MessageDisplay message={!isConnected ? "Please connect your wallet." : "Please switch to the correct network."} type="warn" />;
    }


    return (
        <div className="page voting-page">
            <h2>Voting Proposals</h2>
            <MessageDisplay /> {/* Display global messages */}
            {proposalError && <MessageDisplay specificError={proposalError} />} {/* Display page specific error */}

            {isOwner && (
                <button onClick={() => setShowCreateModal(true)} style={{ marginBottom: '1rem' }}>
                    Create New Proposal
                </button>
            )}
             <button onClick={fetchProposals} disabled={isLoadingProposals}>
                {isLoadingProposals ? 'Refreshing...' : 'Refresh Proposals'}
            </button>


            {isLoadingProposals && <LoadingSpinner />}

            {!isLoadingProposals && proposals.length === 0 && !proposalError && (
                <p>No proposals found.</p>
            )}

            {!isLoadingProposals && proposals.length > 0 && (
                <div className="proposal-list">
                    {proposals.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                </div>
            )}

            {/* Simple Create Proposal Modal/Form */}
            {showCreateModal && isOwner && (
                <div className="modal-backdrop"> {/* Add CSS for modal */}
                    <div className="modal-content">
                        <h3>Create New Proposal</h3>
                        <form onSubmit={handleCreateProposal}>
                            <textarea
                                placeholder="Enter proposal description..."
                                value={newProposalDesc}
                                onChange={(e) => setNewProposalDesc(e.target.value)}
                                required
                                rows={5}
                            />
                            <div>
                                <button type="submit" disabled={!newProposalDesc.trim()}>Submit Proposal</button>
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VotingPage;