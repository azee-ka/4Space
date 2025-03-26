export const fetchMinimalProfileData = async (callApi) => {
    try {
        const response = await callApi(`profile/get-user-info/`);
        return response.data; // Adjust if the endpoint structure is different
    } catch (error) {
        console.error('Error fetching minimal profile data:', error);
        throw new Error('Failed to fetch profile data');
    }
};
