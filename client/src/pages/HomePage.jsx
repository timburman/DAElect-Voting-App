import React from 'react';
import { Link } from 'react-router-dom'; // Optional: for linking to other pages

const HomePage = () => {
    return (
        <div className="page home-page">
            <h2>Welcome to DAElect!</h2>
            <p>
                DAElect empowers communities by providing a decentralized platform for staking tokens and voting on proposals.
            </p>
            <section>
                <h3>Key Features:</h3>
                <ul>
                    <li><strong>Stake Tokens:</strong> Secure your governance tokens in our staking contract to gain voting power.</li>
                    <li><strong>Vote on Proposals:</strong> Participate in DAO governance by casting votes on proposals submitted by the community or owners.</li>
                    <li><strong>Transparent Results:</strong> All proposals, votes, and results are recorded immutably on the blockchain.</li>
                </ul>
            </section>
             <section>
                <h3>How it Works:</h3>
                <p>
                    Connect your Web3 wallet (like MetaMask) to interact with the platform. Your staked balance determines your voting weight. Browse active proposals, discuss them (using off-chain details or external forums), and cast your vote directly through blockchain transactions.
                </p>
            </section>
            <section>
                <h3>Future Vision (Deployer):</h3>
                 <p>
                   (Coming Soon) We aim to provide tools to help you easily deploy your own customized staking and voting contracts for your specific DAO needs. Stay tuned!
                </p>
                 <p>
                    Ready to participate? <Link to="/dashboard">Dashboard</Link> or <Link to="/deploy">Deploy</Link>.
                </p>
            </section>
        </div>
    );
};

export default HomePage;