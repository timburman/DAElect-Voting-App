import React from 'react';
import { Link } from 'react-router-dom';
// Removed Web3 import as we'll likely just show status/description here, not format votes

const ProposalCard = ({ proposal }) => {
    if (!proposal) {
        return null; // Don't render if no proposal data
    }

    // Helper function to truncate long descriptions for the card view
    const truncateDescription = (desc, maxLength = 120) => {
        if (!desc) return 'No description provided.';
        if (desc.length <= maxLength) {
            return desc;
        }
        // Find the last space within the limit to avoid cutting words
        const truncated = desc.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
    };

    // Helper function to get a CSS class based on the proposal state string
    const getStatusClass = (stateText = '') => {
        // Convert state text like "Active", "Succeeded" to "status-active", "status-succeeded"
        return `status-${stateText.toLowerCase().replace(/\s+/g, '-')}`;
    };

    // Extract necessary info from the proposal prop
    const { id, description, stateText, canceled } = proposal; // stateText is pre-mapped string like 'Active'

    return (
        // Wrap the entire card content in a Link component
        <Link to={`/voting/${id}`} className="proposal-card" title={`View details for proposal #${id}`}>
            {/* Proposal Title/ID */}
            <h4>Proposal #{id}</h4>

            {/* Truncated Description */}
            <p className="description">
                {truncateDescription(description)}
            </p>

            {/* Status Indicator */}
            <div className="status-container"> {/* Optional container for styling */}
                <span className={`status ${getStatusClass(stateText)}`}>
                    {stateText || 'Unknown Status'} {canceled ? '(Canceled)' : ''}
                </span>
            </div>

            {/* Optionally add more summary info like proposer or end date if needed */}
            {/* <p className="proposer">Proposer: {proposal.proposer.substring(0, 6)}...</p> */}
            {/* <p className="end-date">Ends: {formatTimestamp(proposal.endTime)}</p> */}
        </Link>
    );
};

export default ProposalCard;