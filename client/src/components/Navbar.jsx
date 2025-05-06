import React from "react";
import {NavLink} from 'react-router-dom';
import { useWeb3Context } from "../contexts/Web3Context";
import ConnectButton from "./ConnectButton";

const Navbar = () => {
    const { account, isConnected } = useWeb3Context();

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to="/" className="navbar-brand">DAElect</NavLink>
            </div>
            <div className="navbar-middle">
                {/* Updated Links */}
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
                <NavLink to="/deploy" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Deploy DAO</NavLink>
                {/* Removed Staking and Voting links */}
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