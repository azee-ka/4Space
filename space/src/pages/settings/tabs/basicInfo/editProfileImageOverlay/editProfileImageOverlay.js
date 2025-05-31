import React, { useState } from "react";
import './editProfileImageOverlay.scss';
import API_BASE_URL from "../../../../../utils/apiUrl";
import default_profile_picture from '../../../../../assets/default_profile_picture.png';
import ReactCrop from 'react-easy-crop';
import useApi from "../../../../../utils/useApi";
import { useNavigate } from "react-router-dom";
import { ProfileImageCompile } from "../../../../../utils/profilePicture/profileImageCompile.";

const EditProfileImageOverlay = ({ basicInfo, setBasicInfo, setIsEditingImage }) => {
    const { callApi } = useApi();
    const [croppedArea, setCroppedArea] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [selectedImage, setSelectedImage] = useState(null); // Uploaded image


    const handleImageSave = async () => {
        // If no new image is selected, use the existing selectedImage from the crop editor
        if ((selectedImage || basicInfo?.profile_image) && croppedArea) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            // Ensure that the image is fetched without CORS issues
            img.crossOrigin = 'anonymous'; // Add this line to handle cross-origin images

            // If no new image is selected, use the existing image (profile_image)
            img.src = selectedImage || `${API_BASE_URL}${basicInfo.profile_image}`;

            img.onload = () => {
                canvas.width = croppedArea.width;
                canvas.height = croppedArea.height;
                ctx.drawImage(
                    img,
                    croppedArea.x,
                    croppedArea.y,
                    croppedArea.width,
                    croppedArea.height,
                    0,
                    0,
                    croppedArea.width,
                    croppedArea.height
                );

                canvas.toBlob(async (blob) => {
                    const formData = new FormData();
                    formData.append("profile_image", blob, "profile_image.jpg");
                    try {
                        const response = await callApi(
                            "settings/edit-basic-info/",
                            "POST",
                            formData,
                            "multipart/form-data"
                        );
                        setBasicInfo({ ...basicInfo, profile_image: response.data.profile_image });
                        setIsEditingImage(false);
                    } catch (err) {
                        console.error(err);
                    }
                }, 'image/jpeg');
            };
        }
    };


    const handleImageDelete = async () => {
        try {
            const response = await callApi(
                "settings/edit-basic-info/",
                "POST",
                { profile_image: null }
            );
            setBasicInfo({ ...basicInfo, profile_image: null });
            setIsEditingImage(false);
        } catch (err) {
            console.error("Error deleting profile image:", err);
        }
    };

    return (
        <div className="profile-image-overlay" onClick={() => setIsEditingImage(false)}>
            <div className="profile-image-card" onClick={(e) => e.stopPropagation()} >
                <h3>Edit your Profile Image</h3>
                <div className="image-editor">
                    <ReactCrop
                        image={selectedImage || ProfileImageCompile(basicInfo?.profile_image)}
                        crop={crop}
                        zoom={zoom}
                        minWidth={200}
                        minHeight={200}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(croppedAreaPercentage, croppedAreaPixels) => setCroppedArea(croppedAreaPixels)}
                    />
                    {/* {croppedArea && (
                                <div className="overlay-effect"/>
                            )} */}
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            setSelectedImage(URL.createObjectURL(file));
                        }
                    }}
                />
                <div className="profile-image-controls-btn">
                    <button onClick={handleImageDelete}>Remove Image</button>
                    <div>
                        <button onClick={() => setIsEditingImage(false)}>Cancel</button>
                        <button onClick={handleImageSave}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditProfileImageOverlay;