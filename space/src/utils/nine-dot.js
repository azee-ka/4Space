import React from 'react';

const NineDotIcon = ({ style = {}, color, mode = null, onClick }) => {
    // If a color prop is given, use it. If not, use mode to pick a color. If mode is not provided, fallback to style/inherit.
    let resolvedColor = color;
    if (!resolvedColor && mode === 'dark') resolvedColor = '#fff';
    if (!resolvedColor && mode === 'light') resolvedColor = '#23272e';

    return (
        <svg
            className="nine-dot-icon"
            onClick={onClick}
            style={{ color: resolvedColor, ...style }}
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {[5, 12, 19].flatMap(cx =>
                [5, 12, 19].map(cy => (
                    <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="currentColor" />
                ))
            )}
        </svg>
    );
};

export default NineDotIcon;
