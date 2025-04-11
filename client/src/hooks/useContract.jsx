import { useWeb3Context } from "../contexts/Web3Context";

export const useContract = () => {
    const {tokenContract, stakingContract, votingContract} = useWeb3Context();
    return {tokenContract, stakingContract, votingContract};
};