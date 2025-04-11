import React from "react";
import { useWeb3Context } from "../contexts/Web3Context";
import LoadingSpinner from "./LoadingSpinnder";

const MessageDisplay = ({ specificError, specificLoading }) => {
    const { isLoading: contextLoading, error: contextError, clearError } = useWeb3Context();

    const isLoading = specificLoading !== undefined ? specificLoading : contextLoading;
    const error = specificError !== undefined ? specificError : contextError;

    const handelClearError = () => {
        if (!specificError && clearError) {
            clearError();
        }
    };

    if (!isLoading && !error) {
        return null;
    }

    return (
        <div className={`message-display ${error ? 'error' : 'loading'}`}>
            {isLoading && (
                <>
                    <LoadingSpinner size="20px" />
                    <span>{typeof isLoading === 'string' ? isLoading : 'Loading...'}</span>
                </>
            )}
            {error && (
                <>
                    <span>Error: {error}</span>
                    {/* Add a close button only for dismissable context errors */}
                    {!specificError && clearError && (
                         <button onClick={handleClearError} className="clear-error-btn">✖</button>
                    )}
                </>
            )}
        </div>
    );
}

export default MessageDisplay;