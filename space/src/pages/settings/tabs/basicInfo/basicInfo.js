// src/pages/settings/tabs/basicInfo/basicInfo.js

import React, { useState } from "react";
import './basicInfo.css';
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import EditProfileImageOverlay from "./editProfileImageOverlay/editProfileImageOverlay";
import { FaEdit } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBasicInfo, updateBasicInfo } from "../../../../services/settings";
import { BASIC_INFO } from "../../../../services/queryKeys";
import useAppDataRefetcher from "../../../../hooks/useAppDataRefetcher";

const BasicInfo = () => {
    const queryClient = useQueryClient();
    useAppDataRefetcher(); // For global events/invalidations

    // Load info
    const { data, isLoading, isError } = useQuery({
        queryKey: BASIC_INFO,
        queryFn: fetchBasicInfo,
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
    });

    const [basicInfo, setBasicInfo] = useState({});
    const [isEditingImage, setIsEditingImage] = useState(false);

    // Keep form in sync when data loads (or after save)
    React.useEffect(() => {
        if (data) setBasicInfo(data);
    }, [data]);

    // Save mutation
    const mutation = useMutation({
        mutationFn: updateBasicInfo,
        onSuccess: (saved) => {
            setBasicInfo(saved);
            queryClient.setQueryData(BASIC_INFO, saved); // update cache
        },
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBasicInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        if (data) setBasicInfo(data);
    };

    const handleEditInfoSave = () => {
        mutation.mutate(basicInfo);
    };

    if (isLoading) return <div>Loading…</div>;
    if (isError)  return <div style={{ color: "red" }}>Could not load info.</div>;

    return (
        <div className="basic-info-tab">
            <div className="basic-info-profile-username">
                <div className="basic-info-profile-image" onClick={() => setIsEditingImage(true)}>
                    <ProfilePicture src={basicInfo?.profile_image} />
                    <div className="profile-image-edit-overlay" >
                        <FaEdit className="icon-style" />
                    </div>
                </div>
                <div className="basic-info-username">
                    <div className="form-field">
                        <input
                            type="text"
                            name="username"
                            value={basicInfo?.username || ""}
                            onChange={handleInputChange}
                            placeholder=" "
                            id="username"
                            disabled
                        />
                        <label htmlFor="username">Username</label>
                    </div>
                </div>
            </div>
            <div className="basic-info-names">
                <div className="form-field">
                    <input
                        type="text"
                        name="first_name"
                        value={basicInfo?.first_name || ""}
                        onChange={handleInputChange}
                        placeholder=" "
                    />
                    <label htmlFor="first name">First Name</label>
                </div>
                <div className="form-field">
                    <input
                        type="text"
                        name="last_name"
                        value={basicInfo?.last_name || ""}
                        onChange={handleInputChange}
                        placeholder=" "
                    />
                    <label htmlFor="last name">Last Name</label>
                </div>
            </div>
            <div className="basic-info-email">
                <div className="form-field">
                    <input
                        type="text"
                        name="email"
                        value={basicInfo?.email || ""}
                        onChange={handleInputChange}
                        placeholder=" "
                    />
                    <label htmlFor="email">Email</label>
                </div>
            </div>

            <div className="basic-info-about-me">
                <div className="form-field">
                    <textarea
                        name="about_me"
                        value={basicInfo?.about_me || ""}
                        onChange={handleInputChange}
                        placeholder=" "
                        id="about-me"
                    />
                    <label htmlFor="about me">About Me</label>
                </div>
            </div>

            <div className="basic-info-gender">
                <div className="form-field">
                    <select
                        name="gender"
                        value={basicInfo?.gender || ""}
                        onChange={handleInputChange}
                        id="gender"
                    >
                        <option value="" disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="undisclosed">Prefer not to disclose</option>
                    </select>
                    <label htmlFor="gender">Gender</label>
                </div>
            </div>
            <div className="basic-info-save-btn">
                <button onClick={handleEditInfoSave} disabled={mutation.isLoading}>Save Changes</button>
                <button onClick={handleReset} disabled={mutation.isLoading}>Reset Changes</button>
                {mutation.isLoading && <span>Saving…</span>}
                {mutation.isError && <span style={{ color: 'red' }}>Save failed!</span>}
                {mutation.isSuccess && <span style={{ color: 'green' }}>Saved!</span>}
            </div>

            {/* Overlay for editing profile image */}
            {isEditingImage && (
                <EditProfileImageOverlay
                    basicInfo={basicInfo}
                    setBasicInfo={setBasicInfo}
                    setIsEditingImage={setIsEditingImage}
                />
            )}
        </div>
    )
}

export default BasicInfo;
