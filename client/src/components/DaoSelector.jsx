import React from "react";
import { useWeb3Context } from "../contexts/Web3Context";

const DaoSelector = () => {

    const { savedDaoConfigs, currentDaoAddresses, switchDao } = useWeb3Context();

    const handleSelectionChange = (event) => {
        const selectedName = event.target.value;
        const selectedConfig = savedDaoConfigs.find(c => c.name === selectedName);
        if (selectedConfig) {
            switchDao(selectedConfig);
        }
    };

    const currentSelectionName = currentDaoAddresses?.name || '';

    if (!savedDaoConfigs || savedDaoConfigs.length === 0) {

        return <span className="dao-selector-info">Deploy a dao to get started!</span>;

    }

    const selectedExistsInList = savedDaoConfigs.some(c => c.name === currentSelectionName);
    const displayValue = selectedExistsInList ? currentSelectionName : ''; // Avoid invalid select value


    return (
        <div className="dao-selector">
            <label htmlFor="daoSelect">Active DAO: </label>
            <select
                id="daoSelect"
                value={displayValue}
                onChange={handleSelectionChange}
                disabled={savedDaoConfigs.length === 0}
            >
                 {!selectedExistsInList && <option value="" disabled>Select DAO</option> } {/* Placeholder if current not found */}
                {savedDaoConfigs.map(config => (
                    <option key={config.name} value={config.name}>
                        {config.name}
                    </option>
                ))}
            </select>
        </div>
    );

}

export default DaoSelector;