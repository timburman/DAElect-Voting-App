import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

export const fetchDetails = async (proposalId) => {
    try {
        const response = await apiClient.get(`proposals/${proposalId}/details`);
        return response.data.details;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error("Error fetching proposal details", error);

        throw error;
    }
};

export const saveDetails = async (proposalId, details) => {
    try {
        const resposne = await apiClient.post(`proposals/${proposalId}/details`, {details});
        return resposne.data;
    } catch (error) {
        console.error("Error saving proposal details:", error);
        throw error;
    }
};