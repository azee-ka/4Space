import default_profile_picture from '../../assets/default_profile_picture.png';
import community_default_logo from '../../assets/community_default_logo.png';
import API_BASE_URL from '../apiUrl';
import { imageCompile } from '../imageWrapper/imageComplie';

export const ProfileImageCompile = (src, isCommunity) => {
    let profilePictureSrc = default_profile_picture;

    if(!isCommunity) {
        if (src) {
            if (typeof src === 'object' && src.profile_picture) {
                profilePictureSrc = API_BASE_URL + src.profile_picture;

            } else if (typeof src === 'string') {
                if(src.includes('default_profile_picture')) {
                    profilePictureSrc = default_profile_picture;
                }
                else {
                    profilePictureSrc = imageCompile(src);
                }
            }
    } else if (src === null) {
        profilePictureSrc = default_profile_picture;
    }
    } else {
        if (src) {
                    if (typeof src === 'object' && src.community_logo) {
                        profilePictureSrc = API_BASE_URL + src.community_logo;

                    } else if (typeof src === 'string') {
                        if(src.includes('default_community_logo')) {
                            profilePictureSrc = community_default_logo;
                        }
                        else {
                            profilePictureSrc = imageCompile(src);
                        }
                    }
            } else if (src === null) {
                profilePictureSrc = community_default_logo;
            }
    }

    return profilePictureSrc;
}