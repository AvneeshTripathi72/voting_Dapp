# Decentralized Voting Application (DApp)

A full-stack decentralized voting application built with Solidity, React, and Vite. This DApp allows users to cast votes securely on the blockchain, ensuring transparency and immutability. Administrators can manage elections, authorize voters, and add candidates.

## 🌟 Features

### Smart Contract (Backend)
- **Election Management**: The contract owner can start and end elections.
- **Voter Authorization**: Only authorized addresses can cast a vote (KYC/Whitelist simulation).
- **Candidate Management**: The owner can add candidates to the election.
- **Secure Voting**: Prevents double voting and ensures votes are cast only when the election is active.
- **Transparency**: All votes and candidate tallies are publicly verifiable on the blockchain.

### Frontend
- **Real-Time Data**: Fetches candidate data and election status directly from the blockchain.
- **Wallet Connection**: Seamless integration with Metamask for user authentication.
- **Live Updates**: React state management ensures the UI reflects the latest contract state.
- **Responsive Design**: Built with Tailwind CSS for a modern, mobile-friendly interface.

## 🛠 Tech Stack

- **Blockchain**:
  - [Solidity](https://soliditylang.org/) (Smart Contract Language)
  - [Hardhat](https://hardhat.org/) (Development Framework)
  - [Ethers.js](https://docs.ethers.org/v6/) (Blockchain Interaction)

- **Frontend**:
  - [React](https://react.dev/) (UI Library)
  - [Vite](https://vitejs.dev/) (Build Tool)
  - [Tailwind CSS](https://tailwindcss.com/) (Styling)

## 🚀 Getting Started

Follow these instructions to set up and run the project strictly on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [Metamask](https://metamask.io/) browser extension installed.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd voting-dapp
```

### 2. Install Dependencies
Install dependencies for both the root (Hardhat) and the frontend.

**Root (Hardhat & Smart Contracts):**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Start Local Blockchain
Open a new terminal window in the root `voting-dapp` directory and start the local hardhat node. This gives you 20 test accounts with fake ETH.
```bash
# In root directory
npx hardhat node
```

### 4. Deploy Smart Contract
Open a *second* terminal window in the root `voting-dapp` directory. Deploy the contract to your local network.
```bash
# In root directory
npx hardhat run scripts/deploy.js --network localhost
```
*Note: After deployment, copy the contract address printed in the console. You may need to update it in your frontend configuration if not automated.*

### 5. Run the Frontend
In the same terminal (or a new one), navigate to the frontend directory and start the development server.
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the app.

## 📝 Usage Guide

### Setup Metamask
1.  Open Metamask and add a **custom network**:
    -   **Network Name**: Localhost 8545
    -   **RPC URL**: `http://127.0.0.1:8545`
    -   **Chain ID**: `31337`
    -   **Currency Symbol**: ETH
2.  Import one of the private keys provided by `npx hardhat node` into Metamask to act as the **Admin (Owner)**.
3.  Import other keys to act as **Voters**.

### Admin Actions (Owner Account)
1.  **Add Candidates**: Input candidate names to populate the ballot.
2.  **Authorize Voters**: Enter user wallet addresses to whitelist them for voting.
3.  **Start Election**: Enable the voting phase.
4.  **End Election**: Close voting to finalize results.

### Voter Actions
1.  Connect your wallet.
2.  Wait for authorization from the admin.
3.  Once the election starts, select a candidate and click **Vote**.
4.  Monitor real-time results on the dashboard.

## 📜 License
This project is licensed under the MIT License.
