## DAElect: Decentralized Governance & Staking Platform

**DAElect** is a full-stack decentralized application (DApp) designed to provide a robust and user-friendly platform for DAO (Decentralized Autonomous Organization) governance. It empowers communities by enabling token staking to acquire voting power and facilitating on-chain proposal creation and voting. The platform also offers a user-friendly interface for deploying new, customized DAO instances.

The project serves as both a practical tool for communities looking to implement decentralized governance and a comprehensive boilerplate for developers venturing into Web3 and DAO development.

**Contracts**: [text](https://github.com/timburman/DAO-Voting-Contract)

### Core Objectives:

* **Decentralized Governance:** To provide a transparent and immutable system for community members to participate in decision-making processes.
* **Staking for Influence:** To implement a mechanism where users can stake governance tokens to gain voting power, aligning incentives with the long-term success of the DAO.
* **User-Friendly Deployment:** To allow users to easily deploy their own instances of the core staking and voting contracts, tailored to their specific community needs, directly from the frontend.
* **Modularity & Extensibility:** To offer a well-structured codebase that can be easily understood, modified, and extended.

### Key Features:

1.  **Wallet Integration:** Seamless connection with popular Web3 wallets like MetaMask, enabling users to interact with the blockchain.
2.  **Multi-DAO Management:**
    * **DAO Instance Deployment:** Users can deploy new instances of the `GovernanceToken` (optional, if they don't have one), `StakingContract`, and `VotingContract` directly from the application.
    * **DAO Browser:** A dedicated page allows users to view and select from multiple saved/deployed DAO instances.
    * **Persistent DAO Configurations:** Deployed DAO instances (name, contract addresses) are saved to a backend database (SQLite) for persistence and discoverability. Local Storage is used as a cache for faster loading and remembering user selections.
3.  **Governance Token:**
    * Option to deploy a new, standard ERC20 `GovernanceToken` with `Ownable` features.
    * Option to use an existing ERC20 token, with ownership verification for the connected account.
4.  **Staking Mechanism (`StakingContract`):**
    * Users can stake their governance tokens to earn voting power.
    * Implements a time-locked unstaking period (e.g., 7 days) to promote stability.
    * Clear interface for staking, initiating unstakes, viewing pending unstakes, and withdrawing tokens.
5.  **Proposal & Voting System (`VotingContract`):**
    * **Proposal Creation:** Authorized users (typically the DAO/contract owner) can create new governance proposals on-chain.
    * **On-Chain Voting:** Stakers can cast their votes (For, Against, Abstain) on active proposals. Voting power is weighted by their staked token balance.
    * **Proposal Lifecycle:** Tracks and displays the state of proposals (e.g., Active, Succeeded, Defeated, Canceled).
    * **Configurable Parameters:** Voting period and quorum requirements are set during the deployment of the `VotingContract`.
6.  **Off-Chain Proposal Details:**
    * A simple backend API (Node.js/Express) allows users to add supplementary text details (context, links, discussion points) to on-chain proposals.
    * These details are stored in an SQLite database, linked to the specific DAO instance and proposal ID.
7.  **User Interface (React):**
    * **Dedicated DAO Pages:** Once a DAO instance is selected or deployed, users are directed to a dedicated page for that DAO, showing its proposals and staking interface side-by-side.
    * **Intuitive Navigation:** Clear navigation through a top Navbar to access different sections like "My DAOs" and "Deploy DAO".
    * **Responsive Design:** (Implicitly aimed for) The UI should be usable across different screen sizes.
    * **Context API:** Manages global Web3 state, connection details, currently active DAO configuration, and contract instances.

### Technology Stack:

* **Smart Contracts:**
    * **Language:** Solidity
    * **Standards:** ERC20 (for Governance Token)
    * **Libraries:** OpenZeppelin Contracts (for `ERC20`, `Ownable`, `ReentrancyGuard`)
* **Frontend:**
    * **Library/Framework:** React.js
    * **Routing:** React Router (`react-router-dom`)
    * **Blockchain Interaction:** Web3.js
    * **State Management:** React Context API
    * **API Calls:** Axios
    * **Styling:** CSS (potentially with a preprocessor if used)
    * **Icons:** React Icons
* **Backend:**
    * **Runtime/Framework:** Node.js with Express.js
    * **Database:** SQLite3 (via `sqlite3` npm package)
    * **Middleware:** `cors` (for Cross-Origin Resource Sharing)
* **Wallet Interaction:** MetaMask or any browser wallet supporting the `window.ethereum` provider.

DAElect aims to provide a comprehensive yet accessible solution for communities looking to embrace decentralized governance and for developers seeking a solid foundation to build upon.
