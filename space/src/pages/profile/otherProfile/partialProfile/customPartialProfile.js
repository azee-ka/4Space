import React, { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "./customPartialProfile.css";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import useApi from "../../../../utils/useApi";
import { useAuth } from "../../../../hooks/useAuth";
import ProfilePicture from "../../../../utils/profilePicture/getProfilePicture";


const ProfileInfoWidget = ({ data }) => (
    <div className="profile-info-widget">
        <ProfilePicture src={data?.profilePicture} />
        <p>{data?.username}</p>
    </div>
);



const CustomPartialProfile = ({ profileInfo }) => {
    const { callApi } = useApi();
    const { authState } = useAuth();
    const [layout, setLayout] = useState(profileInfo.layout || []);
    const [style, setStyle] = useState("");
    const [isOwner, setIsOwner] = useState(profileInfo?.basicInfo?.username === authState.user.username);

    // Fetch layout when the component mounts (if not passed via props)
    useEffect(() => {
            fetchLayout();
            setIsOwner(profileInfo?.basicInfo?.username === authState.user.username);
    }, []);

    const fetchLayout = async () => {
        try {
            const response = await callApi(`page-layout/get_layout/?page_name=partial_profile`);
            console.log(response.data);
            setLayout(response.data.layout);
            setStyle(response.data.style);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            const payload = { page_name: 'partial_profile', layout_data: layout, style_data: style };

            const response = await callApi(`page-layout/save_layout/?page_name=partial_profile`, 'POST', JSON.stringify(payload));
            console.log(response.data);
            alert("Configuration saved!");
        } catch (err) {
            console.err(err);
        }
    };


    const handleLayoutChange = (newLayout) => {
        setLayout(newLayout);
    };

    const handleCancel = () => {
        setLayout(profileInfo.layout); // Reset layout to initial if canceled
    };

    console.log(profileInfo?.basicInfo)
    const renderWidgetContent = (widget) => {
        switch (widget.componentType) {
            case "ProfileInfoWidget":
                return <ProfileInfoWidget data={profileInfo?.basicInfo} />;
            default:
                return <p>{widget.i}</p>;
        }
    };


    return (
        <div className="custom-partial-profile">
            <style>{style}</style>
            <GridLayout
                className="layout" 
                layout={layout}
                cols={30}
                rowHeight={30}
                width={1200}
                onLayoutChange={handleLayoutChange}
                isDraggable={true}
                isResizable={true}
                compactType={null}
            >
                {layout.map((widget) => (
                    <div
                        key={widget.i}
                        className={widget.className || "grid-item"}
                    >
                        {renderWidgetContent(widget)}
                    </div>
                ))}
            </GridLayout>
                <div className="customization-controls">
                    <button onClick={handleSave} className="save-btn">
                        Save Layout
                    </button>
                    <button onClick={handleCancel} className="cancel-btn">
                        Cancel
                    </button>
                </div>
        </div>
    );
};

export default CustomPartialProfile;
