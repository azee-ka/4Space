import React, { useEffect, useState } from "react";
import './basicInfo.css';
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";
import useApi from "../../../../utils/useApi";
import API_BASE_URL from "../../../../utils/apiUrl";
import EditProfileImageOverlay from "./editProfileImageOverlay/editProfileImageOverlay";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaChartBar, FaFlag, FaUsers, FaInfoCircle, FaArrowUp, FaArrowCircleUp, FaArrowCircleDown, FaEdit } from "react-icons/fa";
import useAppTriggers from "../../../../hooks/useAppTriggers";

const BasicInfo = () => {
    const { callApi } = useApi();
    const [basicInfo, setBasicInfo] = useState({});
    const [initialData, setInitialData] = useState({});

    const [isEditingImage, setIsEditingImage] = useState(false);

    const fetchEditInfo = async () => {
        try {
            const response = await callApi('settings/edit-basic-info/');
            // console.log(response.data);
            setBasicInfo(response.data);
            setInitialData(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    useAppTriggers({
        userHandleChanged: fetchEditInfo
    });

    const handleEditInfoSave = async () => {
        try {
            const response = await callApi('settings/edit-basic-info/', 'POST', basicInfo);
            setBasicInfo(response.data);
            setInitialData(response.data);
            console.log(response.data);
        } catch (err) {
            console.error(err);
        }
    };


    useEffect(() => {
        fetchEditInfo();
    }, []);

    const handleReset = () => {
        setBasicInfo(initialData); // Reset changes
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBasicInfo({ ...basicInfo, [name]: value });
    };


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
                <button onClick={handleEditInfoSave}>Save Changes</button>
                <button onClick={handleReset}>Reset Changes</button>
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