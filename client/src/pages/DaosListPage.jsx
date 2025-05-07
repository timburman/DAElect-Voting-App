import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3Context } from '../contexts/Web3Context';
import MessageDisplay from '../components/MessageDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const DaoListCard = ({daoConfig}) => {

    const { name, token, staking, voting, id } = daoConfig;
    const truncated = (addr) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : 'N/A';


    return (
        <Link to={`/dao/${id}`} className="dao-list-card">
            <h4>{name || 'Unnamed DAO'}</h4>
            <p><small>Voting Contract: {truncated(voting)}</small></p>
            {/* <p><small>ID: {id}</small></p> */}
        </Link>
    );

};

const DaosListPage = () => {

    const { savedDaoConfigs, isLoading, error, isConnected } = useWeb3Context();

    if (!isConnected) {
        return <MessageDisplay message="Please connect your wallet to view DAOs." type="warn" />;
    }
    
    return (
        <div className="page daos-list-page">
            <h2>Your DAO Instances</h2>
            <MessageDisplay /> 

            <Link to="/deploy" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
                 <button>+ Deploy New DAO</button>
             </Link>

            {isLoading && !savedDaoConfigs?.length && <LoadingSpinner />}

            {!isLoading && savedDaoConfigs.length === 0 && (
                <p>You haven't saved any DAO configurations yet. Deploy one to get started!</p>
            )}

            {savedDaoConfigs.length > 0 && (
                <div className="dao-list-container">
                    {savedDaoConfigs.map(dao => (
                        <DaoListCard key={dao.id || dao.name} daoConfig={dao} />
                    ))}
                </div>
            )}
        </div>
    );

}

export default DaosListPage;