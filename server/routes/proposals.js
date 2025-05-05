const express = require("express");
const {getProposalDetails, saveProposalDetails} = require("../database");
const router = express.Router({ mergeParams: true });

router.get('/:proposalId/details', async (req,res) => {
    const {daoInstanceId, proposalId} = req.params;

    if (!daoInstanceId || !proposalId || isNaN(parseInt(daoInstanceId, 10))) {
        return res.status(400).json({ message: 'Valid DAO Instance ID and Proposal ID are required.' });
    }

    try {
        const details = await getProposalDetails(daoInstanceId, proposalId);
        if (details !== null) {
            res.json({details});
        } else {
            // res.status(400).json({message: "Details not found for this Proposal"});
            res.json({details: ''});
        }
    } catch (error) {
        res.status(500).json({message: "Error fetching proposal details", error: error.message});
    }
});

router.post("/:proposalId/details", async (req, res) => {
        const {daoInstanceId, proposalId} = req.params;
        const {details} = req.body;

        if (!daoInstanceId || !proposalId || isNaN(parseInt(daoInstanceId, 10))) {
            return res.status(400).json({ message: 'Valid DAO Instance ID and Proposal ID are required.' });
        }
        if (typeof details !== 'string') {
            return res.status(400).json({message: "Invalid details format. Expected a string"});
        }

        try {
            const result = await saveProposalDetails(daoInstanceId,proposalId, details);
            res.status(201).json({
                message: "Details saved successfully",
                ...result
              });
        } catch (error) {
            res.status(500).json({message: "Error saving proposal details", error: error.message});
        }
});

module.exports = router;