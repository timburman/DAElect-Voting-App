import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3Context } from '../contexts/Web3Context';
import { fetchDetails, saveDetails } from '../services/proposalService'; // API service
import MessageDisplay from '../components/MessageDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const ProposalDetailPage = () => {
    const { proposalId } = useParams();
    const navigate = useNavigate();
    const { web3, account, votingContract, isConnected, networkId, targetNetworkId, setLoading, setError, clearError, isOwner, currentDaoAddresses, getSignature } = useWeb3Context(); // Added isOwner

    const [proposalData, setProposalData] = useState(null); // Blockchain data
    const [detailsText, setDetailsText] = useState(''); // Off-chain data
    const [isLoadingBc, setIsLoadingBc] = useState(false); // Loading blockchain data
    const [isLoadingDetails, setIsLoadingDetails] = useState(false); // Loading off-chain data
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [pageError, setPageError] = useState('');
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editedDetails, setEditedDetails] = useState('');
    const [userVoteInfo, setUserVoteInfo] = useState({ hasVoted: false, choice: null });

    const proposalStateMap = { 0: 'Pending', 1: 'Active', 2: 'Canceled', 3: 'Defeated', 4: 'Succeeded' };
    const voteTypeMap = { 0: 'Against', 1: 'For', 2: 'Abstain' };

    const fromWei = (val) => web3 ? web3.utils.fromWei(val?.toString() || '0', 'ether') : '0';
    const formatTimestamp = (timestamp) => {
         if (!timestamp || timestamp === '0') return 'N/A';
         try { return new Date(parseInt(timestamp) * 1000).toLocaleString(); } catch (e) { return 'Invalid Date'; }
     };

    // Fetch Blockchain Data
    const fetchBlockchainData = useCallback(async () => {
        if (!votingContract || !proposalId) return;
        setIsLoadingBc(true);
        setPageError('');
        try {
            const data = await votingContract.methods.getProposal(proposalId).call();
            // Fetch user vote status as well
            let voteInfo = { hasVoted: false, choice: null };
            if(account) {
                try {
                    const rawVoteInfo = await votingContract.methods.getVote(proposalId, account).call();
                    voteInfo = { hasVoted: rawVoteInfo.hasVoted, choice: rawVoteInfo.voteChoice?.toString() };
                } catch (voteErr) { console.warn("Could not fetch user vote info", voteErr); }
            }

            // Format data
            setProposalData({
                id: data.id.toString(),
                proposer: data.proposer,
                description: data.description,
                startTime: data.startTime.toString(),
                endTime: data.endTime.toString(),
                forVotes: data.forVotes.toString(),
                againstVotes: data.againstVotes.toString(),
                abstainVotes: data.abstainVotes.toString(),
                totalVotesParticipated: data.totalVotesParticipated.toString(),
                snapshotTotalStaked: data.snapshotTotalStaked.toString(),
                canceled: data.canceled,
                state: data.state.toString(), // Keep index
                stateText: proposalStateMap[data.state.toString()] || 'Unknown'
            });
            setUserVoteInfo(voteInfo);

        } catch (err) {
            console.error("Error fetching blockchain proposal data:", err);
            setPageError(`Failed to fetch proposal #${proposalId} data from blockchain.`);
        } finally {
            setIsLoadingBc(false);
        }
    }, [votingContract, proposalId, account]);

    
    const fetchOffChainDetails = useCallback(async () => {
        if (!proposalId || !currentDaoAddresses?.id) return;
        setIsLoadingDetails(true);
        try {
            const fetchedDetails = await fetchDetails(currentDaoAddresses.id,proposalId);
            setDetailsText(fetchedDetails || '');
            setEditedDetails(fetchedDetails || '');
        } catch (err) {
            console.warn("Could not fetch off-chain details:", err);
            
        } finally {
            setIsLoadingDetails(false);
        }
    }, [proposalId, currentDaoAddresses?.id]);

    useEffect(() => {
        if (isConnected && networkId === targetNetworkId) {
            fetchBlockchainData();
            fetchOffChainDetails();
        }
    }, [isConnected, networkId, targetNetworkId, fetchBlockchainData, fetchOffChainDetails]);


    // --- Handlers ---
    const handleVote = async (voteType) => {
         if (!account || !votingContract) { setPageError("Wallet not connected."); return; }
         setIsVoting(true);
         setLoading(true, `Casting vote (${voteTypeMap[voteType]})...`); // Global loading
         setError(''); // Clear global error
         setPageError('');
        try {
             await votingContract.methods.casteVote(proposalId, voteType)
                .send({ from: account })
                .on('receipt', () => {
                    setLoading(false);
                    setLoading(true, 'Vote Cast! Refreshing...');
                    fetchBlockchainData(); // Refresh data
                    setTimeout(() => setLoading(false), 2000);
                })
                 .on('error', (error) => {
                     console.error("Vote error:", error);
                     setError(`Vote failed: ${error.message}`); // Global error
                     setLoading(false);
                 });
        } catch (error) {
             console.error("Send Vote error:", error);
             setError(`Error: ${error.message}`); // Global error
             setLoading(false);
         } finally {
             setIsVoting(false);
         }
    };

    const handleFinishProposal = async () => {
        if (!account || !votingContract) { setPageError("Wallet not connected."); return; }
        setIsFinishing(true);
        setLoading(true, 'Finishing proposal...');
        setError('');
        setPageError('');
        try {
            await votingContract.methods.finishProposal(proposalId)
                .send({ from: account })
                .on('receipt', () => {
                     setLoading(false);
                     setLoading(true, 'Proposal Finished! Refreshing...');
                     fetchBlockchainData(); // Refresh data
                     setTimeout(() => setLoading(false), 2000);
                })
                 .on('error', (error) => {
                     console.error("Finish error:", error);
                     setError(`Finish failed: ${error.message}`);
                     setLoading(false);
                 });
        } catch (error) {
             console.error("Send Finish error:", error);
             setError(`Error: ${error.message}`);
             setLoading(false);
         } finally {
             setIsFinishing(false);
         }
    };

     const handleSaveDetails = async () => {
        if (!proposalId || !currentDaoAddresses?.id) {
            setPageError("Cannot save details: DAO or Proposal ID missing.");
            return;
        }
        setIsSavingDetails(true);
        setPageError('');
        try {
            const signatureMessage = "Verify ownership to edit/change details.";
            const ownerSignature = await getSignature(signatureMessage);

            if (!ownerSignature) {
                setIsSavingDetails(false);
                setError("Ownership verification failed.");
                return;
            }
            await saveDetails(currentDaoAddresses.id, proposalId, editedDetails);
            setDetailsText(editedDetails);  
            setIsEditingDetails(false);

        } catch (err) {
            console.error("Error saving details:", err);
            setError("Failed to save additional details.");
        } finally {
            setIsSavingDetails(false);
        }
    };


    useEffect(() => {

        if (isConnected && networkId === targetNetworkId) {
            fetchBlockchainData();
            fetchOffChainDetails();
        }

    }, [isConnected, networkId, targetNetworkId, fetchBlockchainData, fetchOffChainDetails]);
     // --- Render Logic ---
     const isLoading = isLoadingBc || isLoadingDetails; // Overall loading state
     const canVote = proposalData?.state === '1' // Active
                     && !userVoteInfo.hasVoted
                     && (Date.now() / 1000 < parseInt(proposalData?.endTime || '0'))
                     && !proposalData?.canceled;
     const canBeFinished = proposalData?.state === '1' // Active
                           && (Date.now() / 1000 >= parseInt(proposalData?.endTime || '0'))
                           && !proposalData?.canceled;

     // Decide who can edit details (e.g., owner or proposer)
     const canEditDetails = account && proposalData && (isOwner || account.toLowerCase() === proposalData.proposer.toLowerCase());


     if (!isConnected || networkId !== targetNetworkId) {
          return <MessageDisplay message={!isConnected ? "Please connect wallet." : "Please switch network."} type="warn" />;
     }
     if (isLoading) return <div className="page proposal-detail-page"><LoadingSpinner /> Fetching proposal data...</div>;
     if (pageError) return <div className="page proposal-detail-page"><MessageDisplay specificError={pageError} /></div>;
     if (!proposalData) return <div className="page proposal-detail-page">Proposal not found or failed to load.</div>;


    return (
        <div className="page proposal-detail-page">
            <h2>Proposal #{proposalData?.id} (DAO: {currentDaoAddresses?.name || '...'})</h2>
             <MessageDisplay /> {/* Display global messages */}

            <div className="description-section">
                <h3>Description (from Blockchain)</h3>
                <p>{proposalData.description || 'No description provided.'}</p>
            </div>

            <div className="details-section">
                 <h3>Additional Details {canEditDetails && !isEditingDetails && <button onClick={() => setIsEditingDetails(true)} className="edit-btn">(Edit)</button>}</h3>
                 {isLoadingDetails && <p>Loading details...</p>}
                 {!isLoadingDetails && (
                    isEditingDetails ? (
                        <div>
                            <textarea
                                value={editedDetails}
                                onChange={(e) => setEditedDetails(e.target.value)}
                                rows={6}
                                placeholder="Add more context, links, discussion points..."
                            />
                            <button onClick={handleSaveDetails} disabled={isSavingDetails}>
                                {isSavingDetails ? 'Saving...' : 'Save Details'}
                            </button>
                             <button onClick={() => { setIsEditingDetails(false); setEditedDetails(detailsText); }} disabled={isSavingDetails}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <p>{detailsText || 'No additional details provided.'}</p>
                    )
                 )}
            </div>

             <div className="metadata-section">
                 <h3>Details</h3>
                 <p><strong>Proposer:</strong> {proposalData.proposer}</p>
                 <p><strong>Voting Period:</strong> {formatTimestamp(proposalData.startTime)} - {formatTimestamp(proposalData.endTime)}</p>
                 <p><strong>Snapshot Total Staked:</strong> {fromWei(proposalData.snapshotTotalStaked)}</p>
             </div>


            {/* Voting or Results Section */}
            {proposalData.state === '1' && !proposalData.canceled && ( // Active
                <div className="voting-section">
                    <h3>Voting</h3>
                    {userVoteInfo.hasVoted ? (
                        <p><strong>Your vote: {voteTypeMap[userVoteInfo.choice] || 'Unknown'}</strong></p>
                    ) : (
                         Date.now() / 1000 < parseInt(proposalData.endTime) ? (
                            <div className="vote-options">
                                <p>Cast your vote:</p>
                                <button onClick={() => handleVote(1)} disabled={isVoting}>Vote For</button>
                                <button onClick={() => handleVote(0)} disabled={isVoting}>Vote Against</button>
                                <button onClick={() => handleVote(2)} disabled={isVoting}>Abstain</button>
                            </div>
                         ) : (
                            <p>Voting period has ended.</p>
                         )
                    )}
                     {/* Display current counts while active */}
                    <p style={{ marginTop: '1rem' }}>
                        Current Votes: For: {fromWei(proposalData.forVotes)}, Against: {fromWei(proposalData.againstVotes)}, Abstain: {fromWei(proposalData.abstainVotes)}
                    </p>
                    <p>Total Power Voted: {fromWei(proposalData.totalVotesParticipated)}</p>
                     {canBeFinished && (
                         <button onClick={handleFinishProposal} disabled={isFinishing} style={{ marginTop: '1rem' }}>
                            {isFinishing ? 'Processing...' : 'Finalize Proposal Results'}
                         </button>
                     )}
                </div>
            )}

             {(proposalData.state === '3' || proposalData.state === '4') && ( // Defeated or Succeeded
                 <div className="results-section">
                    <h3>Final Results</h3>
                    <p><strong>Outcome: {proposalData.stateText}</strong></p>
                     <p>For: {fromWei(proposalData.forVotes)}</p>
                     <p>Against: {fromWei(proposalData.againstVotes)}</p>
                     <p>Abstain: {fromWei(proposalData.abstainVotes)}</p>
                     <p>Total Power Voted: {fromWei(proposalData.totalVotesParticipated)}</p>
                 </div>
             )}
             {proposalData.state === '2' && ( // Canceled
                 <div className="results-section">
                     <h3>Proposal Canceled</h3>
                 </div>
             )}

             <button onClick={() => navigate('/dashboard')} style={{ marginTop: '2rem' }}>&larr; Back to Proposals</button>

        </div>
    );
};


export default ProposalDetailPage;