import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "../../../services/profile";
import { PROFILE } from '../../../services/queryKeys';
import PartialProfile from "./partialProfile/partialProfile";
import FullProfile from "./fullProfile/fullProfile";
import { useLocation } from "react-router-dom";

const OtherProfile = ({ username, enforceViewType = '', isCustomizing, handleStartChat }) => {
    const { data: profileInfo, isLoading } = useQuery({
        queryKey: PROFILE(username),
        queryFn: () => fetchProfile(username),
        enabled: !!username
    });
    const location = useLocation();

    if (isLoading) return <div>Loading...</div>;

    // (logic unchanged)
    return enforceViewType === '' ? (
        profileInfo?.view_type === 'partial' ? (
            <PartialProfile profileInfo={profileInfo} isCustomizing={isCustomizing} handleStartChat={handleStartChat} />
        ) : (
            profileInfo?.view_type === 'full' ? (
                <FullProfile profileInfo={profileInfo} isCustomizing={isCustomizing} handleStartChat={handleStartChat} />
            ) : (
                <div>Loading...</div>
            )
        )
    ) : (
        enforceViewType === 'partial' ? (
            <PartialProfile profileInfo={profileInfo} isCustomizing={isCustomizing} handleStartChat={handleStartChat} />
        ) : (
            enforceViewType === 'full' ? (
                <FullProfile profileInfo={profileInfo} isCustomizing={isCustomizing} handleStartChat={handleStartChat} />
            ) : (
                <div>Loading...</div>
            )
        )
    )
}
export default OtherProfile;
