// LoginForm.js
import React, { useState, useEffect } from 'react';
import './alert.css';
import { FaTimes } from 'react-icons/fa';

const AlertModule = ({ message, setShowAlert }) => {

    return (
        <div className='alert-message-container'>
            <div className='alert-message-container-inner'>
                {message}
            </div>
            <div className='alert-message-dismiss'>
                <FaTimes onClick={() => setShowAlert('')} />
            </div>
        </div>
    );
}

export default AlertModule;