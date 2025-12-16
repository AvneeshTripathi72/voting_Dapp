import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VotingAbi from './abi.json';
import ContractConfig from './contract-config.json';
import './index.css';
import { 
  LayoutDashboard, 
  Vote, 
  Settings, 
  Users, 
  LogOut, 
  PlusCircle, 
  CheckCircle2, 
  UserCheck,
  Moon,
  Sun,
  ShieldCheck,
  Wallet
} from 'lucide-react';

const CONTRACT_ADDRESS = ContractConfig.address;

function App() {
  // --- Web3 State ---
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  
  // --- UI State ---
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode
  const [activeView, setActiveView] = useState('dashboard');
  const [toast, setToast] = useState({ msg: '', type: '' });

  // --- Data State ---
  const [parties, setParties] = useState([]);
  const [mockParties, setMockParties] = useState([]);
  const [mockVoters, setMockVoters] = useState({});
  const [voterStatus, setVoterStatus] = useState({ authorized: false, voted: false, votedCandidateId: 0 }); // [NEW]

  // --- Input State ---
  const [newPartyName, setNewPartyName] = useState("");
  const [voterAddress, setVoterAddress] = useState("");
  const [voterAge, setVoterAge] = useState("");

  useEffect(() => {
    // Apply theme
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if(window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
    if(window.ethereum) {
        window.ethereum.on('accountsChanged', handleLogout); // Logout on account change for safety
        window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 4000);
  };

  const handleLogout = () => {
    setAccount(null);
    setContract(null);
    setIsAdmin(false);
    setVoterStatus({ authorized: false, voted: false, votedCandidateId: 0 }); // Reset
    setActiveView('dashboard');
    showToast("Disconnected successfully", "success");
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await tempProvider.getSigner();
        const tempContract = new ethers.Contract(CONTRACT_ADDRESS, VotingAbi, signer);
        setContract(tempContract);
        
        try {
            const adminAddress = await tempContract.owner();
            const isOwner = adminAddress.toLowerCase() === accounts[0].toLowerCase();
            setIsAdmin(isOwner);
            fetchParties(tempContract);
            fetchVoterStatus(tempContract, accounts[0]); // [NEW] Fetch status
            setIsMockMode(false);
        } catch (backendError) {
            console.error("Backend Error - Switching to Mock Mode:", backendError);
            setIsMockMode(true);
            setIsAdmin(true); 
            if(mockParties.length === 0) setMockParties([]);
        }

      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask not detected!");
    }
  };

  const fetchVoterStatus = async (contractInstance, address) => {
      try {
          const status = await contractInstance.voters(address);
          // status is [authorized, voted, votedCandidateId]
          setVoterStatus({
              authorized: status[0],
              voted: status[1],
              votedCandidateId: Number(status[2])
          });
      } catch (e) {
          console.error("Error fetching voter status", e);
      }
  };

  const fetchParties = async (contractInstance) => {
    try {
      const partiesList = await contractInstance.getAllCandidates();
      const formatted = partiesList.map((p) => ({
        id: Number(p.id),
        name: p.name,
        vote: p.voteCount.toString()
      }));
      setParties(formatted);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  const handleRegisterParty = async () => {
    if(!newPartyName.trim()) return;
    try {
      if (isMockMode) {
          const newParty = { id: mockParties.length + 1, name: newPartyName, vote: "0" };
          const updated = [...mockParties, newParty];
          setMockParties(updated);
          setParties(updated);
      } else {
          if (!contract) return;
          const tx = await contract.addCandidate(newPartyName);
          await tx.wait();
          fetchParties(contract);
      }
      setNewPartyName("");
      showToast("Candidate registered!", "success");
    } catch (e) {
      showToast("Registration failed", "error");
    }
  };

  const handleAuthorizeVoter = async () => {
    if(!voterAddress.trim()) return;
    try {
        if (isMockMode) {
             setMockVoters({...mockVoters, [voterAddress.toLowerCase()]: { registered: true }});
        } else {
            if (!contract) return;
            const tx = await contract.authorizeVoter(voterAddress);
            await tx.wait();
        }
        setVoterAddress("");
        setVoterAge("");
        showToast("Voter authorized!", "success");
    } catch (e) {
        showToast("Authorization failed", "error");
    }
  };

  const handleVote = async (candidateId) => {
    try {
        if (isMockMode) {
            const updated = parties.map((p) => 
                p.id === candidateId ? {...p, vote: (parseInt(p.vote) + 1).toString()} : p
            );
            setParties(updated);
            setMockParties(updated);
        } else {
            if (!contract) return;
            const tx = await contract.vote(candidateId);
            await tx.wait();
            fetchParties(contract);
            fetchVoterStatus(contract, account); // Update status
        }
        showToast("Vote cast successfully!", "success");
    } catch (e) {
        showToast("Voting failed", "error");
    }
  };

  /* Render Functions (Refactored to prevent focus loss) */
  const renderSidebar = () => (
    <aside className="w-64 fixed left-0 top-0 h-screen bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col z-50 transition-colors duration-300">
      <div className="flex items-center gap-3 p-6 mb-4">
        <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">V</div>
        <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">VoteChain</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <button 
          onClick={() => setActiveView('dashboard')}
          className={`w-full sidebar-link ${activeView === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveView('vote')}
          className={`w-full sidebar-link ${activeView === 'vote' ? 'active' : ''}`}
        >
          <Vote size={20} />
          <span>Active Ballot</span>
        </button>

        {/* Voter Panel Link */}
        <button 
          onClick={() => setActiveView('voterSpace')}
          className={`w-full sidebar-link ${activeView === 'voterSpace' ? 'active' : ''}`}
        >
          <UserCheck size={20} />
          <span>Voter Space</span>
        </button>

        {isAdmin && (
            <button 
              onClick={() => setActiveView('admin')}
              className={`w-full sidebar-link ${activeView === 'admin' ? 'active' : ''}`}
            >
              <ShieldCheck size={20} />
              <span>Admin Panel</span>
            </button>
        )}

        <button 
            onClick={() => setActiveView('settings')}
            className={`w-full sidebar-link ${activeView === 'settings' ? 'active' : ''}`}
        >
            <Settings size={20} />
            <span>Settings</span>
        </button>
      </nav>

      <div className="p-4 border-t border-[var(--border-color)] space-y-4">
        <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
            <span className="text-sm font-medium">Theme</span>
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <div className="flex items-center gap-3 p-2">
            <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${account}&backgroundColor=b6e3f4`} 
                alt="Avatar" 
                className="h-10 w-10 rounded-full border-2 border-[var(--border-color)] bg-white"
            />
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate w-28">{account ? `${account.substring(0,6)}...` : 'Guest'}</p>
                <p className="text-xs text-[var(--text-secondary)]">{isAdmin ? 'Admin' : 'Voter'}</p>
            </div>
            <button onClick={handleLogout} className="text-[var(--text-secondary)] hover:text-red-500 transition-colors ml-auto">
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </aside>
  );

  const renderVoterSpace = () => {
      const votedParty = voterStatus.voted ? parties.find(p => p.id === voterStatus.votedCandidateId) : null;
      
      return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Voter Space</h2>
                <p className="text-[var(--text-secondary)]">Your personal voting status and history.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status Card */}
                <div className={`card p-6 border-l-4 ${voterStatus.authorized ? 'border-emerald-500' : 'border-red-500'}`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${voterStatus.authorized ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {voterStatus.authorized ? <CheckCircle2 size={24}/> : <ShieldCheck size={24}/>}
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)]">Authorization Status</h3>
                            <p className={`text-sm font-bold ${voterStatus.authorized ? 'text-emerald-500' : 'text-red-500'}`}>
                                {voterStatus.authorized ? 'Verified & Authorized' : 'Not Authorized Yet'}
                            </p>
                        </div>
                    </div>
                    {!voterStatus.authorized && (
                        <p className="text-sm text-[var(--text-secondary)] mt-2">
                            You cannot vote yet. Please ask the Admin to authorize your wallet address: 
                            <span className="block font-mono bg-[var(--bg-tertiary)] p-1 mt-1 rounded text-xs select-all">{account}</span>
                        </p>
                    )}
                </div>

                {/* Vote Card */}
                <div className={`card p-6 border-l-4 ${voterStatus.voted ? 'border-indigo-500' : 'border-yellow-500'}`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${voterStatus.voted ? 'bg-indigo-500/10 text-indigo-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <Vote size={24}/>
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)]">Voting Status</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {voterStatus.voted ? 'Vote Cast Successfully' : 'Vote Pending'}
                            </p>
                        </div>
                    </div>
                    
                    {voterStatus.voted ? (
                        <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl">
                            <p className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">You Voted For</p>
                            <p className="text-lg font-bold text-indigo-500">{votedParty ? votedParty.name : `Candidate #${voterStatus.votedCandidateId}`}</p>
                        </div>
                    ) : (
                        <div>
                            {voterStatus.authorized ? (
                                <button onClick={() => setActiveView('vote')} className="btn-primary w-full text-sm">
                                    Go to Ballot
                                </button>
                            ) : (
                                <button disabled className="w-full py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg font-bold text-sm cursor-not-allowed">
                                    Waiting for Authorization
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )
  };

  const renderDashboardView = () => {
    const totalVotes = parties.reduce((acc, p) => acc + parseInt(p.vote), 0);
    const leadingCandidate = [...parties].sort((a,b) => parseInt(b.vote) - parseInt(a.vote))[0];

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">Overview</h2>
                    <p className="text-[var(--text-secondary)]">Election insights and real-time data.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium flex items-center gap-2 border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Live Election
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 border-l-4 border-indigo-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Candidates</span>
                    </div>
                    <h3 className="text-4xl font-bold text-[var(--text-primary)]">{parties.length}</h3>
                </div>

                <div className="card p-6 border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Total Votes</span>
                    </div>
                    <h3 className="text-4xl font-bold text-[var(--text-primary)]">{totalVotes}</h3>
                </div>

                <div className="card p-6 border-l-4 border-violet-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                            <UserCheck size={24} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Leading</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] truncate">
                        {leadingCandidate ? leadingCandidate.name : 'No Votes'}
                    </h3>
                </div>
            </div>
            
            {isAdmin && (
                 <div className="card p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white relative overflow-hidden border-none pointer-events-auto">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">Admin Actions</h3>
                            <p className="text-indigo-200 text-sm">Manage the election directly from dashboard.</p>
                        </div>
                        <div className="flex gap-3">
                             <button onClick={() => setActiveView('admin')} className="px-4 py-2 bg-white text-indigo-900 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">
                                Open Panel
                             </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
  };

  const renderSettingsView = () => (
      <div className="space-y-8 animate-fade-in">
        <header>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Profile & Settings</h2>
            <p className="text-[var(--text-secondary)]">Manage your account and view detailed stats.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-8 items-center text-center">
                <div className="h-24 w-24 mx-auto mb-6 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-violet-500">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${account}&backgroundColor=b6e3f4`} 
                        alt="Profile" 
                        className="h-full w-full rounded-full bg-white"
                    />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{isAdmin ? 'Administrator' : 'Verified Voter'}</h3>
                <div className="flex items-center justify-center gap-2 bg-[var(--bg-tertiary)] py-2 px-4 rounded-full max-w-sm mx-auto mb-6">
                    <Wallet size={16} className="text-[var(--text-secondary)]" />
                    <code className="text-sm text-[var(--text-primary)] font-mono">{account}</code>
                </div>
                
                <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 mx-auto text-red-500 hover:text-red-400 font-medium transition-colors px-6 py-2 rounded-xl hover:bg-red-500/10"
                >
                    <LogOut size={18} /> Disconnect Wallet
                </button>
            </div>

            <div className="space-y-6">
                <div className="card p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                            <PlusCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">Candidates Registered</p>
                            <h4 className="text-2xl font-bold text-[var(--text-primary)]">{parties.length} Party(s)</h4>
                        </div>
                    </div>
                </div>

                <div className="card p-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">Authorized Voters</p>
                            <h4 className="text-2xl font-bold text-[var(--text-primary)]">
                                {isMockMode ? Object.keys(mockVoters).length : 'On-Chain Managed'}
                            </h4>
                        </div>
                    </div>
                </div>

                <div className="card p-6 bg-[var(--bg-tertiary)] border-none">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        <span className="font-bold text-[var(--text-primary)]">Note:</span> Your wallet address is your unique identity in this DApp. 
                        Do not share your private key. The admin has the ability to add candidates and authorize new voters.
                    </p>
                </div>
            </div>
        </div>
      </div>
  );

  const renderVoteView = () => (
    <div className="space-y-8 animate-fade-in">
        <header>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Ballot Area</h2>
            <p className="text-[var(--text-secondary)]">Cast your vote securely on the blockchain.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {parties.map((p) => {
                 const total = parties.reduce((acc, v) => acc + parseInt(v.vote), 0);
                 const percent = total > 0 ? ((parseInt(p.vote) / total) * 100).toFixed(1) : 0;
                 return (
                    <div key={p.id} className="card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl text-[var(--text-primary)]">
                            {p.id}
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 relative z-10">{p.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6 relative z-10">Candidate #{p.id}</p>
                        
                        <div className="mb-6 relative z-10">
                             <div className="flex justify-between text-sm mb-2">
                                <span className="text-[var(--text-secondary)]">Progress</span>
                                <span className="font-bold text-[var(--text-primary)]">{percent}%</span>
                             </div>
                             <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: `${percent}%`}}></div>
                             </div>
                        </div>

                        <button 
                            onClick={() => handleVote(p.id)}
                            disabled={isAdmin && !isMockMode}
                            className={`w-full py-3 rounded-xl font-bold transition-all relative z-10 ${
                                isAdmin && !isMockMode 
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed' 
                                : 'btn-primary'
                            }`}
                        >
                            {isAdmin && !isMockMode ? 'View Only' : 'Vote Now'}
                        </button>
                    </div>
                );
            })}
             {parties.length === 0 && (
                <div className="col-span-full text-center py-20 text-[var(--text-secondary)]">
                    <p>No active candidates found.</p>
                </div>
            )}
        </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="space-y-8 animate-fade-in">
        <header>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Admin Panel</h2>
            <p className="text-[var(--text-secondary)]">Restricted access control and management.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
                        <PlusCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg">Add Candidate</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Register a new party for the election.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <input 
                        value={newPartyName}
                        onChange={(e) => setNewPartyName(e.target.value)}
                        placeholder="Candidate Name"
                        className="input-field"
                    />
                    <button onClick={handleRegisterParty} className="btn-primary w-full">
                        Confirm Registration
                    </button>
                </div>
            </div>

            <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                     <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg">Authorize Voter</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Whitelist a wallet for voting.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <input 
                        value={voterAddress}
                        onChange={(e) => setVoterAddress(e.target.value)}
                        placeholder="Wallet Address (0x...)"
                        className="input-field"
                    />
                    <button onClick={handleAuthorizeVoter} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700">
                        Authorize Access
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
            {toast.type === 'success' ? <CheckCircle2 className="text-white"/> : <Users className="text-white"/>}
            <span className="font-bold">{toast.msg}</span>
        </div>
      )}

      {/* Landing */}
      {!account ? (
        <div className="w-full h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-primary)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 flex gap-4">
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-[var(--bg-secondary)] shadow-lg text-[var(--text-primary)]">
                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                 </button>
            </div>
            
            <div className="card max-w-md w-full p-10 text-center relative z-10 shadow-2xl border-none">
                <div className="h-16 w-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                     <span className="text-3xl font-bold text-white">V</span>
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">VoteChain</h1>
                <p className="text-[var(--text-secondary)] mb-8">Secure, transparent, and decentralized.</p>
                <button onClick={connectWallet} className="btn-primary w-full py-4 text-lg mb-6">Connect Wallet</button>
                
                {/* Admin Hint */}
                <div className="mt-4 text-xs text-[var(--text-secondary)]">
                    <p>Admin Access: <span className="font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                        {contract ? "Loading..." : "0xf39F...2266"} 
                    </span> (Account #0)</p>
                </div>
            </div>
        </div>
      ) : (
        <>
            {renderSidebar()}
            <main className="flex-1 ml-64 p-10 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    {activeView === 'dashboard' && renderDashboardView()}
                    {activeView === 'voterSpace' && renderVoterSpace()}
                    {activeView === 'vote' && renderVoteView()}
                    {activeView === 'admin' && renderAdminView()}
                    {activeView === 'settings' && renderSettingsView()}
                </div>
            </main>
        </>
      )}
    </div>
  );
}

export default App;
