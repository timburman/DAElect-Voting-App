import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3Context } from '../contexts/Web3Context';
import { FiLock, FiCheckSquare, FiLayers, FiFileText, FiNavigation, FiGitBranch, FiThumbsUp, FiPenTool } from 'react-icons/fi';
import ConnectButton from '../components/ConnectButton';

const HomePage = () => {

    const { isConnected, account, connectWallet, isLoading } = useWeb3Context();
    const navigate = useNavigate();


    return (
        <div className="page home-page"> {/* Removed default page padding if sections handle it */}

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <span className="hero-icon-brand"><img src="../assets/DAElect_logo.jpeg" alt="" /></span> {/* Simple Emoji Icon */}
                    <h1 className="hero-title">DAElect</h1>
                    <p className="hero-subtitle">
                        Empowering Communities Through Decentralized Governance.
                        <br />
                        Stake tokens, vote on proposals, or deploy your own DAO instance.
                    </p>
                    <div className="hero-cta">
                        {!isConnected ? (
                            // Use the ConnectButton component for consistency
                            <ConnectButton />
                        ) : (
                            <button onClick={() => navigate('/daos')} className="cta-button primary">
                                Go to DAOs
                            </button>
                        )}
                         <button onClick={() => navigate('/deploy')} className="cta-button secondary">
                                <FiLayers size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Deploy Your DAO
                         </button>
                    </div>
                    {isConnected && account && (
                        <p className="wallet-info-hero">Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</p>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">Platform Highlights</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <FiLock size={36} className="feature-icon" />
                        <h3>Secure Staking</h3>
                        <p>Lock governance tokens to gain voting power. Includes a configurable time-delayed unstaking period for DAO stability.</p>
                    </div>
                    <div className="feature-card">
                        <FiCheckSquare size={36} className="feature-icon" />
                        <h3>On-Chain Voting</h3>
                        <p>Transparently create and vote on proposals. Votes are weighted by staked balance and results are recorded on-chain.</p>
                    </div>
                    <div className="feature-card">
                        {/* Using FiLayers as an alternative for Deploy */}
                        <FiLayers size={36} className="feature-icon" />
                        <h3>Easy Deployment</h3>
                        <p>Utilize our interface to launch your own customized Staking and Voting contracts for your community's needs.</p>
                    </div>
                    <div className="feature-card">
                        <FiFileText size={36} className="feature-icon" />
                        <h3>Off-Chain Details</h3>
                        <p>Enhance proposals by adding supplementary context, links, or discussion points stored off-chain via our simple API.</p>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="how-it-works-section">
                <h2 className="section-title">Simple Steps to Participate</h2>
                <div className="steps-container">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <FiNavigation size={30} className="step-icon"/>
                        <h3>Connect Wallet</h3>
                        <p>Use MetaMask or a compatible wallet connected to the correct network (e.g., Sepolia).</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                         <FiGitBranch size={30} className="step-icon"/>
                        <h3>Select / Deploy</h3>
                        <p>Choose an existing DAO instance from 'DAOs' or deploy your own using the 'Deploy' page.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <FiThumbsUp size={30} className="step-icon"/>
                        <h3>Stake & Vote</h3>
                        <p>Stake tokens in your chosen DAO to gain voting power, then participate in active proposals.</p>
                    </div>
                     <div className="step-card">
                        <div className="step-number">4</div>
                        <FiPenTool size={30} className="step-icon"/>
                        <h3>Govern</h3>
                        <p>Contribute to the DAO's future by creating proposals (if eligible) and voting responsibly.</p>
                    </div>
                </div>
            </section>

             {/* Final CTA Section */}
             <section className="final-cta-section">
                 <h2>Take Control of Your Community's Future</h2>
                 <p>Ready to engage with decentralized governance? Explore the available DAOs or launch your own instance today.</p>
                  <div className="hero-cta"> {/* Reusing hero cta styles */}
                     <button onClick={() => navigate('/daos')} className="cta-button">
                         Browse DAOs
                     </button>
                      <button onClick={() => navigate('/deploy')} className="cta-button secondary">
                         Deploy Your DAO
                     </button>
                 </div>
            </section>

        </div>
    );
};

export default HomePage;