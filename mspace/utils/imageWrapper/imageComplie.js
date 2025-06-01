import API_BASE_URL from '../apiUrl';

export const imageCompile = (src) => {
    let imageSource = null;

    if (src) {
        if (typeof src === 'string' && src.includes('http://')) {
            imageSource = src;
        }
        else if (typeof src === 'string' && src.charAt(0) === '/') {
            imageSource = API_BASE_URL.slice(0, -1) + src;
        }
        else if (typeof src === 'string') {
            imageSource = API_BASE_URL + src;
        }
    }
    return imageSource;
}