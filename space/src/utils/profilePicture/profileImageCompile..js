import default_profile_picture from '../../assets/default_profile_picture.png';
import API_BASE_URL from '../apiUrl';
import { imageCompile } from '../imageWrapper/imageComplie';

export const ProfileImageCompile = (src) => {
    let profilePictureSrc = default_profile_picture;

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

    return profilePictureSrc;
}