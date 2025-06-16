import React from "react";
import {NavLink} from 'react-router-dom';
import { useWeb3Context } from "../contexts/Web3Context";
import ConnectButton from "./ConnectButton";
import logo from '../assets/Logo_1_no_background.png';

const Navbar = () => {
    const { account, isConnected } = useWeb3Context();

    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to="/" className="navbar-brand">
                    <img src={logo} alt="DAElect logo" className="navbar-logo"/>
                    <span>DAElect</span>
                </NavLink>
            </div>
            <div className="navbar-middle">
                {/* Updated Links */}
                {/* Link to the DAO browser page */}
                <NavLink to="/daos" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>DAOs</NavLink>
                <NavLink to="/deploy" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Deploy DAO</NavLink>
                {/* Removed Dashboard/Staking/Voting links */}
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