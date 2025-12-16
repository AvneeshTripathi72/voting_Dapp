// test/voting.test.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Voting Contract', function () {
  let voting;
  let owner, voter1, voter2, other;

  beforeEach(async function () {
    [owner, voter1, voter2, other] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory('Voting');
    voting = await Voting.deploy();
    await voting.deployed();
  });

  it('should set owner correctly', async function () {
    expect(await voting.owner()).to.equal(owner.address);
  });

  it('owner can start and end election', async function () {
    await voting.startElection();
    expect(await voting.electionActive()).to.be.true;
    await voting.endElection();
    expect(await voting.electionActive()).to.be.false;
  });

  it('owner can add candidates', async function () {
    await voting.addCandidate('Alice');
    await voting.addCandidate('Bob');
    const candidate = await voting.getCandidate(1);
    expect(candidate.name).to.equal('Alice');
    expect(candidate.voteCount).to.equal(0);
  });

  it('owner can authorize voters', async function () {
    await voting.authorizeVoter(voter1.address);
    const voterInfo = await voting.voters(voter1.address);
    expect(voterInfo.authorized).to.be.true;
  });

  it('authorized voter can vote once', async function () {
    await voting.addCandidate('Alice');
    await voting.authorizeVoter(voter1.address);
    await voting.connect(voter1).vote(1);
    const candidate = await voting.getCandidate(1);
    expect(candidate.voteCount).to.equal(1);
    const voterInfo = await voting.voters(voter1.address);
    expect(voterInfo.voted).to.be.true;
  });

  it('prevents double voting', async function () {
    await voting.addCandidate('Alice');
    await voting.authorizeVoter(voter1.address);
    await voting.connect(voter1).vote(1);
    await expect(voting.connect(voter1).vote(1)).to.be.revertedWith('Already voted');
  });
});
