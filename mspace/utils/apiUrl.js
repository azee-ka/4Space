import { Platform } from "react-native";

let API_BASE_URL = "";

if (Platform.OS === "android") {
  // Android emulator
  API_BASE_URL = "http://10.0.2.2:8000/";
} else {
  // iOS Simulator
  // Real iPhone/Android device on the same Wi-Fi:
  API_BASE_URL = 'http://10.0.0.6:8000/';
}

export default API_BASE_URL;




// // utils/apiUrl.js
// const API_BASE_URL = 'http://127.0.0.1:8000/'; 
// //'http://10.0.0.6:8000/';
//  // process.env.NODE_ENV === 'production'
//   //  ? 'https://django-backend-url' : 
//    // process.env.REACT_APP_API_BASE_URL// || 'http://127.0.0.1:8000/';
// export const CLIENT_BASE_URL = 'http://10.0.0.85:3000';
// export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8000';

// export default API_BASE_URL;