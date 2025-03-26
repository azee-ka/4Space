import React from 'react';

const NineDotIcon = ({ style, onClick }) => (
        <svg
            className='nine-dot-icon'
            onClick={onClick}
            style={style}
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="5" cy="5" r="2" fill="currentColor" />
            <circle cx="12" cy="5" r="2" fill="currentColor" />
            <circle cx="19" cy="5" r="2" fill="currentColor" />
            <circle cx="5" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="19" cy="12" r="2" fill="currentColor" />
            <circle cx="5" cy="19" r="2" fill="currentColor" />
            <circle cx="12" cy="19" r="2" fill="currentColor" />
            <circle cx="19" cy="19" r="2" fill="currentColor" />
        </svg>
);

export default NineDotIcon;
