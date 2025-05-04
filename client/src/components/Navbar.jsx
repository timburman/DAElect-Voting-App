import React from "react";
import {NavLink} from 'react-router-dom';
import { useWeb3Context } from "../contexts/Web3Context";
import ConnectButton from "./ConnectButton";
import DaoSelector from "./DaoSelector";
import { targetNetworkId } from "../config/contracts";

const Navbar = () => {
    const  { account, isConnected, networkId, targetNetworkId } = useWeb3Context();

    const formatAddress = (addr) => {
        if (!addr) return '';
        
        return (
            <span className="math-inline">
                {addr.substring(0, 6)}
            </span>
            // {addr.substring(addr.length - 4)}
        );
    }

    const showDaoSelector = isConnected && networkId === targetNetworkId;

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to="/" className="navbar-brand">DAElect</NavLink>
            </div>
            <div className="navbar-middle">
                {/* {showDaoSelector && <DaoSelector />} */}
                <NavLink to="/staking" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Staking</NavLink>
                <NavLink to="/voting" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Voting</NavLink>
                <NavLink to="/deploy" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Deploy</NavLink>
            </div>
            <div className="navbar-right">
                {isConnected ? (
                    <span className="wallet-address">{formatAddress(account)}</span>
                ) : (
                    <ConnectButton />
                )}
            </div>
        </nav>
    );
};

export default Navbar;