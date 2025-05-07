import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DaosListPage from './pages/DaosListPage';
import DedicatedDaoPage from "./pages/DedicatedDaoPage";
import ProposalDetailPage from './pages/ProposalDetailPage';
import DeployPage from './pages/DeployPage';
import './assets/App.css';

function App() {
    return (
        <Web3Provider>
            <Router>
                <div className="app-container">
                    <Navbar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            {/* Route for Browse DAOs */}
                            <Route path="/daos" element={<DaosListPage />} />
                            {/* Route for the dedicated page for a specific DAO */}
                            <Route path="/dao/:daoId" element={<DedicatedDaoPage />} /> {/* Simplified route */}
                            {/* Keep proposal detail route */}
                            <Route path="/voting/:proposalId" element={<ProposalDetailPage />} />
                            <Route path="/deploy" element={<DeployPage />} />
                            {/* Optional: Add a redirect from /dashboard or a 404 */}
                            {/* <Route path="*" element={<NotFoundPage />} /> */}
                        </Routes>
                    </main>
                </div>
            </Router>
        </Web3Provider>
    );
}

export default App;