import React from 'react';

const LoadingSpinner = ({ size = '30px' }) => {
    const style = {
        width: size,
        height: size,
    };
    return <div className="loading-spinner" style={style}></div>;
};

export default LoadingSpinner;