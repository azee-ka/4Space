import React from "react";
import './profileAppearance.css';

const ProfileAppearance = ({ handleStartCustomization }) => {
    return (
        <div className="profile-appearance-tab">
            <section>
                <h3>My Profile View</h3>
                <div className="profile-appearance-setting-content">
                    <div className="profile-appearance-setting-content-description">
                        <p>Customize your profile view here. This is the profile view that you see when viewing your own profile.</p>
                    </div>
                    <div className="profile-appearance-setting-content-btn">
                        <button onClick={() => handleStartCustomization('self')}>
                            Custom My Profile View
                        </button>
                    </div>
                </div>
            </section>
            <section>
                <h3>Private Profile View</h3>
                <div className="profile-appearance-setting-content">
                    <div className="profile-appearance-setting-content-description">
                        <p>Customize your private profile view here. This is the profile view that users see when your account is private and they do NOT follow you.</p>
                    </div>
                    <div className="profile-appearance-setting-content-btn">
                        <button onClick={() => handleStartCustomization('partial')}>
                            Custom Private Profile View
                        </button>
                    </div>
                </div>
            </section>
            <section>
                <h3>Public/Followed Profile View</h3>
                <div className="profile-appearance-setting-content">
                    <div className="profile-appearance-setting-content-description">
                        <p>Customize your public profile view here. This is the profile view that users see when your account is public or they follow you.</p>
                    </div>
                    <div className="profile-appearance-setting-content-btn">
                        <button onClick={() => handleStartCustomization('full')}>
                            Custom Public Profile View
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default ProfileAppearance;