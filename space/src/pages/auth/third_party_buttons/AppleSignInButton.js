import React, { useEffect } from 'react';
import './apple-button.css';

const AppleSignInButton = () => {
  useEffect(() => {
    const loadAppleSDK = () => {
      try {
        if (!document.getElementById('apple-signin-script')) {
          const script = document.createElement('script');
          script.id = 'apple-signin-script';
          script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
          script.async = true;
          script.onload = initApple;
          document.body.appendChild(script);
        } else {
          initApple();
        }
      } catch (err) {
        console.error('Error rendering apple btn', err);
      }
    };

    const initApple = () => {
      if (window.AppleID) {
        window.AppleID.auth.init({
          clientId: 'process.env.REACT_APP_APPLE_CLIENT_ID',
          scope: 'name email',
          redirectURI: 'process.env.REACT_APP_APPLE_REDIRECT_URI',
          usePopup: true,
        });
      }
    };

    loadAppleSDK();
  }, []);

  return (
<div className="apple-signin-wrapper">
  <div
  id="appleid-signin"
  data-mode="center-align"
  data-type="sign-in"
  data-color="black"
  data-border="false"
  data-border-radius="50"
  data-width="304"
  data-height="40"
  data-logo-size="large"
  data-logo-position="11"
  data-label-position="88"
></div>
</div>

  );
};

export default AppleSignInButton;
