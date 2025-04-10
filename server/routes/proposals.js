const express = require("express");
const {getProposalDetails, saveProposalDetails} = require("../database");
const router = express.Router();

router.get('/:proposalId/details', async (req,res) => {
    const {proposalId} = req.params;

    try {
        const details = await getProposalDetails(proposalId);
        if (details !== null) {
            res.json({details});
        } else {
            res.status(400).json({message: "Details not found for this Proposal"});
        }
    } catch (error) {
        res.status(500).json({message: "Error fetching proposal details", error: error.message});
    }
});

router.post("/:proposalId/details", async (req, res) => {
        const {proposalId} = req.params;
        const {details} = req.body;

        if (typeof details !== 'string') {
            return res.status(400).json({message: "Invalid details format. Expected a string"});
        }

        try {
            const result = await saveProposalDetails(proposalId, details);
            res.status(201).json({
                message: "Details saved successfully"
              });
        } catch (error) {
            res.status(500).json({message: "Error saving proposal details", error: error.message});
        }
});

module.exports = router;