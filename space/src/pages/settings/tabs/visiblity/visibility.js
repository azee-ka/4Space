import React, { useEffect, useState } from "react";
import './visibility.css';
import useApi from "../../../../utils/useApi";
import ToggleSlider from "../../../../utils/toggleSlider/toggleSlider";

const Visiblity = () => {
    const { callApi } = useApi();
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        const fetchProfileVisiblityStatus = async () => {
            try {
                const response = await callApi(`settings/toggle-profile-visibility/`, 'GET');
                setIsPrivate(response.data.is_private_profile);
                // console.log(response.data);
            } catch (err) {
                console.error('Error fetching profile visibility status', err);
            }
        };

        fetchProfileVisiblityStatus();
    }, []);


    const handleToggleProfileVisiblity = async () => {
        try {
            const response = await callApi(`settings/toggle-profile-visibility/`, 'POST');
            // console.log(response.data);
            setIsPrivate(response.data.is_private_profile);
        } catch (err) {
            console.error('Error toggling profile visibility', err);
        }
    };

    return (
        <div className="visibility-settings">
            <section>
                <h3>Profile Visiblity</h3>
                <div className="visiblity-setting-content">
                    <div className="visiblity-setting-content-description">
                        <p>
                            Toggle profile to private or public mode.
                            <span>{isPrivate ? "Your profile is private." : "Your profile is public."}</span>
                        </p>
                    </div>
                    <div className="visiblity-setting-content-control">
                        <ToggleSlider checked={isPrivate} onChange={handleToggleProfileVisiblity} />
                    </div>
                </div>
            </section>
            <section>
                <h3>Profile Visiblity</h3>
                <div className="visiblity-setting-content">
                    <div className="visiblity-setting-content-description">
                    <p>
                            Toggle profile to private or public mode.
                            {isPrivate ? "Your profile is private" : "Your profile is public"}
                        </p>
                    </div>
                    <div className="visiblity-setting-content-control">
                        <ToggleSlider checked={isPrivate} onChange={handleToggleProfileVisiblity} />
                    </div>
                </div>
            </section>
        </div>
    )
};

export default Visiblity;