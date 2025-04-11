import GovernanceTokenABI from "./GovernanceToken.json";
import StakingContractABI from "./StakingContract.json";
import VotingContractABI from "./VotingContract.json";


const deployedConfig = {
    targetNetworkId: '11155111',
    addresses: {
        governanceToken: '0x704b4F59E76a9e7464f81713d3f282d69c9655ee',
        stakingContract: '0x514d54Da32c9Fa0E01D367d123e01bAcB993AF4d',
        votingContract: '0x13d07616357a00518815Ad6a42f81a74edfCC41E',
    }

};


const contracts = {
    token: {
        address: deployedConfig.addresses.governanceToken,
        abi: GovernanceTokenABI,
    },
    staking: {
        address: deployedConfig.addresses.stakingContract,
        abi: StakingContractABI,
    },
    voting: {
        address: deployedConfig.addresses.votingContract,
        abi: VotingContractABI,
    },
};

const targetNetworkId = deployedConfig.targetNetworkId;

export {contracts, targetNetworkId};