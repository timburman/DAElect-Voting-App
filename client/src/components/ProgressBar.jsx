import React from "react";
import { FiCheck } from 'react-icons/fi';

const ProgressBar = ({ steps, currentStep, goToStep }) => {

    return (
        <div className="progress-bar-container">
            {steps.map((step, index) => {
                const stepIndex = index + 1;
                const isCompleted = stepIndex < currentStep;
                const isActive = stepIndex === currentStep;

                return (
                    <React.Fragment key={stepIndex}>
                        <div className="progress-step-wrapper">
                            <div
                                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                // Allow clicking only on completed steps to go back
                                onClick={isCompleted ? () => goToStep(stepIndex) : undefined}
                            >
                                {isCompleted ? <FiCheck size={20} /> : <span className="step-number">{stepIndex}</span>}
                            </div>
                            <div className={`step-label ${isActive || isCompleted ? 'active' : ''}`}>
                                {step}
                            </div>
                        </div>
                        {/* Render connector line between steps */}
                        {stepIndex < steps.length && <div className={`progress-connector ${isCompleted ? 'completed' : ''}`}></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );

};

export default ProgressBar;