import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfileVisibilityStatus, toggleProfileVisibility } from '../../../../services/settings'
import ToggleSlider from "../../../../utils/toggleSlider/toggleSlider";
import './visibility.css';
import { PROFILE_VISIBILITY } from '../../../../services/queryKeys';

const Visibility = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, isError, isFetching } = useQuery({
        queryKey: PROFILE_VISIBILITY,
        queryFn: fetchProfileVisibilityStatus,
    });

    const mutation = useMutation({
        mutationFn: toggleProfileVisibility,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROFILE_VISIBILITY });
        }
    });

    const isPrivate = data?.data?.is_private_profile;

    return (
        <div className="visibility-settings">
            <section>
                <h3>Profile Visibility</h3>
                <div className="visiblity-setting-content">
                    <div className="visiblity-setting-content-description">
                        <p>
                            Toggle profile to private or public mode.
                            {isLoading || isFetching
                                ? <span>Loading…</span>
                                : isError
                                    ? <span style={{ color: 'red' }}>Could not load status.</span>
                                    : <span>{isPrivate ? "Your profile is private." : "Your profile is public."}</span>
                            }
                        </p>
                    </div>
                    <div className="visiblity-setting-content-control">
                        <ToggleSlider
                            checked={!!isPrivate}
                            onChange={() => mutation.mutate()}
                            disabled={isLoading || isFetching || mutation.isLoading}
                        />
                        {mutation.isLoading && <span>Updating…</span>}
                        {mutation.isError && <span style={{ color: 'red' }}>Update failed!</span>}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Visibility;
