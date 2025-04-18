import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import StakingPage from './pages/StakingPage';
import VotingPage from './pages/VotingPage';
import ProposalDetailPage from './pages/ProposalDetailPage';
import DeployPage from './pages/DeployPage';
import './assets/App.css'; // Import main CSS

function App() {
    return (
        <Web3Provider>
            <Router>
                <div className="app-container">
                    <Navbar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/staking" element={<StakingPage />} />
                            <Route path="/voting" element={<VotingPage />} />
                            <Route path="/voting/:proposalId" element={<ProposalDetailPage />} />
                            <Route path="/deploy" element={<DeployPage />} />
                            {/* Add Not Found Route if desired */}
                            {/* <Route path="*" element={<NotFoundPage />} /> */}
                        </Routes>
                    </main>
                     {/* Footer could go here */}
                </div>
            </Router>
        </Web3Provider>
    );
}

export default App;