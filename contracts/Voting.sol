// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;
    bool public electionActive;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Voter {
        bool authorized;
        bool voted;
        uint256 votedCandidateId;
    }

    mapping(uint256 => Candidate) public candidates;
    uint256 public candidateCount;

    mapping(address => Voter) public voters;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterAuthorized(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionStarted();
    event ElectionEnded();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(voters[msg.sender].authorized, "Not authorized");
        _;
    }

    modifier electionIsActive() {
        require(electionActive, "Election not active");
        _;
    }

    constructor() {
        owner = msg.sender;
        electionActive = false;
    }

    // Admin functions
    function startElection() external onlyOwner {
        electionActive = true;
        emit ElectionStarted();
    }

    function endElection() external onlyOwner {
        electionActive = false;
        emit ElectionEnded();
    }

    function addCandidate(string calldata name) external onlyOwner {
        candidateCount++;
        candidates[candidateCount] = Candidate({id: candidateCount, name: name, voteCount: 0});
        emit CandidateAdded(candidateCount, name);
    }

    function authorizeVoter(address voter) external onlyOwner {
        voters[voter].authorized = true;
        emit VoterAuthorized(voter);
    }

    // Voting function
    function vote(uint256 candidateId) external onlyAuthorized electionIsActive {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Already voted");
        require(candidateId > 0 && candidateId <= candidateCount, "Invalid candidate");
        sender.voted = true;
        sender.votedCandidateId = candidateId;
        candidates[candidateId].voteCount++;
        emit VoteCast(msg.sender, candidateId);
    }

    // View functions
    function getCandidate(uint256 candidateId) external view returns (Candidate memory) {
        require(candidateId > 0 && candidateId <= candidateCount, "Invalid candidate");
        return candidates[candidateId];
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory all = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            all[i - 1] = candidates[i];
        }
        return all;
    }
}
