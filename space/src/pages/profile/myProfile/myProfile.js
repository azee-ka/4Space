// src/pages/profile/myProfile/MyProfile.jsx
import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from "../../../services/profile";
import { PROFILE } from '../../../services/queryKeys';
import { useAuth } from "../../../hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { formatDateTime } from "../../../utils/formatDateTime";
import React, { useState, useEffect } from "react";
import './myProfile.css';

import SocialProfile from './social/socialProfile';
import ProfessionalProfile from './professional/professionalProfile';

const MyProfile = ({ username: usernameProp, isCustomizing }) => {
  const { authState } = useAuth();
  const username = usernameProp || authState?.current?.user.username;
  const location = useLocation();
  const navigate = useNavigate();

  const { data: profileInfo, isLoading } = useQuery({
    queryKey: PROFILE(username),
    queryFn: () => fetchProfile(username),
    enabled: !!username,
  });

  const profileViews = [
    { key: 'social', label: 'Social', component: SocialProfile },
    { key: 'professional', label: 'Professional', component: ProfessionalProfile },
  ];

  const getViewFromSearch = () => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    return profileViews.find(v => v.key === view)?.key || 'social';
  };

  const [activeView, setActiveView] = useState(getViewFromSearch());

  useEffect(() => {
    const newView = getViewFromSearch();
    if (newView !== activeView) setActiveView(newView);
    // eslint-disable-next-line
  }, [location.search]);

const switchToView = (viewKey) => {
  const currentParams = new URLSearchParams(location.search);
  currentParams.delete('view');

  // Remove stale tab params depending on view
  if (viewKey === 'professional') {
    currentParams.delete('tab');
  } else if (viewKey === 'social') {
    currentParams.delete('proTab');
  }

  // Rebuild with view first
  const newParams = new URLSearchParams();
  newParams.set('view', viewKey);
  for (const [key, value] of currentParams.entries()) {
    newParams.append(key, value);
  }

  navigate({ search: newParams.toString() }, { replace: true });
};



  if (isLoading) {
    return <div className="profile-page loading"><p>Loading profile...</p></div>;
  }

  const ActiveComponent = profileViews.find(v => v.key === activeView)?.component || SocialProfile;

  return (
    <div className="profile-page">
      <div className="profile-top-panel">
        <h2>
          <Link to={'/profile'}>My Profile</Link>
        </h2>
        <div className="profile-view-tabs">
        {profileViews.map(view => (
          <button
            key={view.key}
            onClick={() => switchToView(view.key)}
            className={`profile-view-tab-btn ${activeView === view.key ? 'active' : ''}`}
          >
            {view.label}
          </button>
        ))}
      </div>
        <div className="profile-top-panel-date-joined">
          <p>Member since {formatDateTime(profileInfo?.basicInfo?.date_joined)}</p>
        </div>
      </div>

      <ActiveComponent profileInfo={profileInfo} />
    </div>
  );
};

export default MyProfile;
