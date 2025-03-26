import React from "react";
import './toggleSlider.css';

const ToggleSlider = ({ checked, onChange }) => {
    return (
        <label className='toggle-switch'>
            <input type='checkbox' checked={checked} onChange={onChange} />
            <span className='slider round'></span>
        </label>
    );
}

export default ToggleSlider;
