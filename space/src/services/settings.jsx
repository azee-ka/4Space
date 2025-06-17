export const fetchProfileVisiblityStatus = async () => {
  try {
    const response = await callApi(
      `settings/toggle-profile-visibility/`,
      "GET"
    );
    setIsPrivate(response.data.is_private_profile);
    // console.log(response.data);
  } catch (err) {
    console.error("Error fetching profile visibility status", err);
  }
};

export const handleToggleProfileVisiblity = async () => {
  try {
    const response = await callApi(
      `settings/toggle-profile-visibility/`,
      "POST"
    );
    // console.log(response.data);
    setIsPrivate(response.data.is_private_profile);
  } catch (err) {
    console.error("Error toggling profile visibility", err);
  }
};
