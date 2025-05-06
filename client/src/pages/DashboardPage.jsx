import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3Context } from "../contexts/Web3Context";
import StakingInterface from "../components/StakingInterface";
import ProposalCard from "../components/ProposalCard";
import MessageDisplay from "../components/MessageDisplay";
import LoadingSpinner from "../components/LoadingSpinner";

const DaoCard = ({daoConfig, isActive, onSelect}) => {

    const {name, token, staking, voting} = daoConfig;
    const truncated = (addr) => addr ? `${addr.substring(0,6)}...${addr.substring(addr.length - 4)}` : 'N/A';

    return (

        <div className={`dao-card ${isActive ? 'active' : ''}`} onClick={() => onSelect(daoConfig)}>
            <h4>{name || 'Unnamed DAO'}</h4>
            <p><small>Voting Contract: {truncated(voting)}</small></p>

        </div>

    );

};

const DashboardPage = () => {

    const {
        account,
        isConnected,
        networkId,
        targetNetworkId,
        savedDaoConfigs,
        currentDaoAddresses,
        switchDao,
        votingContract,
        isOwner,
        setLoading,
        setError,
        clearError
    } = useWeb3Context();

    const navigate = useNavigate();

    const [proposals, setProposals] = useState([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const [proposalError, setProposalError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProposalDesc, setNewProposalDesc] = useState('');

    const [mode, setMode] = useState('stake');

    const proposalStateMap = {0: 'Pending', 1: 'Active', 2: 'Canceled', 3: 'Defeated', 4: 'Succeeded'};

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


    }, [votingContract]);

    useEffect(() => {
        if (isConnected && networkId === targetNetworkId) {
            fetchProposals();
        } else {
            setProposals([]);
        }
    }, [isConnected, networkId, targetNetworkId, fetchProposals]);
    console.log("Voting Contract:",votingContract);
    const handleCreateProposal = async (e) => {

        e.preventDefault();
        if (!votingContract || !account || !newProposalDesc.trim()) return;
        if (!isOwner) {
            setError("Only the owner can create the proposals for this DAO.");
            return;
        }

        setLoading(true, "Creating Proposal..");
        setError('');

        try {
            await votingContract.methods.createProposal(newProposalDesc.trim())
            .send({from: account})
            .on('receipt', () => {
                setLoading(false);
                setLoading(true, 'Proposal Created! Refreshing...');
                setShowCreateModal(false),
                setNewProposalDesc('');
                fetchProposals();
                setTimeout(() => setLoading(false), 2000);
            })
            .on('error', (error) => { setError(`Create proposal failed: ${error.message}`); setLoading(false); });
        } catch (error) {
            setError(`Transaction error: ${error.message}`);
            setLoading(false);
        }

    };

    if (!isConnected || networkId !== targetNetworkId) {
        return <MessageDisplay message={!isConnected ? "Please connect your wallet." : "Please switch to the correct network."} type="warn" />;
    }

    return (
        <div className="page dashboard-page">
            <h2>DAO Dashboard</h2>
            <MessageDisplay /> {/* Global loading/error */}

            {/* DAO Selection Section */}
            <section className="dao-selection-section">
                <h3>Select DAO Instance</h3>
                {savedDaoConfigs.length === 0 ? (
                    <p>You haven't saved any DAO configurations yet. <Link to="/deploy">Deploy one now!</Link></p>
                ) : (
                    <div className="dao-card-container">
                        {savedDaoConfigs.map(dao => (
                            <DaoCard
                                key={dao.id || dao.name} // Use DB id if available, fallback to name
                                daoConfig={dao}
                                isActive={currentDaoAddresses?.id === dao.id || currentDaoAddresses?.name === dao.name} // Match by id or name
                                onSelect={switchDao} // Call context function on click
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Divider */}
            <hr className="section-divider" />

            {/* Active DAO Details Section */}
            {!currentDaoAddresses ? (
                 <p>Please select a DAO instance above to see details.</p>
            ) : (
                <section className="active-dao-section">
                     <h3>Active DAO: {currentDaoAddresses.name || 'Unnamed DAO'}</h3>

                     {/* Staking Sub-section */}
                     <div className="dashboard-subsection staking-subsection">
                         <h4>Staking</h4>
                         <MessageDisplay /> {/* Shows global loading/error from context */}
                        <div className="staking-toggle">
                            <button onClick={() => setMode('stake')} className={mode === 'stake' ? 'active' : ''}>Stake</button>
                            <button onClick={() => setMode('unstake')} className={mode === 'unstake' ? 'active' : ''}>Unstake</button>
                        </div>
                        <StakingInterface mode={mode} />
                     </div>

                      {/* Divider */}
                     <hr className="subsection-divider" />

                     {/* Proposals Sub-section */}
                     <div className="dashboard-subsection proposals-subsection">
                         <h4>Proposals</h4>
                         {isOwner && ( // Only show create button if owner of *this* DAO
                             <button onClick={() => setShowCreateModal(true)} style={{ marginBottom: '1rem' }}>
                                 Create New Proposal
                             </button>
                         )}
                          <button onClick={fetchProposals} disabled={isLoadingProposals}>
                             {isLoadingProposals ? 'Refreshing...' : 'Refresh Proposals'}
                         </button>

                         {proposalError && <MessageDisplay specificError={proposalError} />}
                         {isLoadingProposals && <LoadingSpinner />}

                         {!isLoadingProposals && proposals.length === 0 && !proposalError && (
                             <p>No proposals found for this DAO.</p>
                         )}
                         {!isLoadingProposals && proposals.length > 0 && (
                             <div className="proposal-list">
                                 {proposals.map((proposal) => (
                                     <ProposalCard key={proposal.id} proposal={proposal} />
                                 ))}
                             </div>
                         )}
                     </div>
                </section>
            )}


             {/* Create Proposal Modal (same as before) */}
             {showCreateModal && isOwner && (
                <div className="modal-backdrop"> {/* Add CSS for modal */}
                    <div className="modal-content">
                        <h3>Create Proposal for {currentDaoAddresses?.name || ''}</h3>
                        <form onSubmit={handleCreateProposal}>
                            <textarea
                                placeholder="Enter proposal description..."
                                value={newProposalDesc}
                                onChange={(e) => setNewProposalDesc(e.target.value)}
                                required rows={5}
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

export default DashboardPage;

