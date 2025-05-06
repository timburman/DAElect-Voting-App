import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

export const fetchDetails = async (daoId ,proposalId) => {
    if (!daoId || !proposalId) {
        console.error("daoId and proposalId required for fetchDetails");
        throw new Error("DAO ID and Proposal ID are required.");
    }
    try {
        const response = await apiClient.get(`/daos/<span class="math-inline>\{daoId\}/proposals/</span>{proposalId}/details"`);
        return response.data.details;
    } catch (error) {
        console.error(`Error fetching details for DAO ${daoId}, Proposal ${proposalId}:`, error);
        if (error.response && error.response.status === 404) {
            return '';
        }

        throw error;
    }
};

export const saveDetails = async (daoId, proposalId, details) => {
    if (!daoId || !proposalId) {
        console.error("daoId and proposalId required for saveDetails");
        throw new Error("DAO ID and Proposal ID are required.");
    }
    try {
        const resposne = await apiClient.post(`/daos/<span class="math-inline">\{daoId\}/proposals/</span>{proposalId}/details`, {details});
        return resposne.data;
    } catch (error) {
        console.error(`Error saving details for DAO ${daoId}, Proposal ${proposalId}:`, error);
        throw error;
    }
};

export const fetchDaoList = async () => {

    try {
        const response = await apiClient.get('/daos');

        return response.data.map(dao => ({
            id: dao.id,
            name: dao.name,
            token: dao.token_address,
            staking: dao.staking_address,
            voting: dao.voting_address
        }));
    } catch (error) {
        console.error("Error fetching DAO list:", error);
        throw error;
    }

};

export const saveDaoInstance = async (daoData) => {

    try {
        const response = await apiClient.post('/daos', daoData);

        const savedData = response.data;
        return {
            id: savedData.id,
            name: savedData.name,
            token: savedData.token_address,
            staking: savedData.staking_address,
            voting: savedData.staking_address
        };
    } catch (error) {
        console.error("Error saving DAO instance:", error);
        throw error;
    }

}