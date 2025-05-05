const express = require("express");
const { createDaoInstance, getAllDaoInstances } = require("../database");
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const daos = await getAllDaoInstances();
        res.json(daos);
    } catch (error) {
        res.status(500).json({message: 'Error fetching DAO instances', error: error.message});
    }
});

router.post('/', async (req, res) => {
    const { name, token, staking, voting } = req.body;

    if (!name || !token || !staking || !voting) {
        return res.status(400).json({message: 'Missing DAO configuration fields (name, token, staking, voting).'});
    }

    try {
        const newDao = await createDaoInstance({
            name: name,
            token_address: token,
            staking_address: staking,
            voting_address: voting
        });

        res.status(201).json(newDao);
    } catch (error) {
        if (error.message.includes(`UNIQUE constrains failed`)) {
            return res.status(409).json({ message: 'Error saving DAO: A DAO with this name or contract address already exists.', error: error.message });
        }
        res.status(500).json({ message: 'Error saving DAO instance', error: error.message });
    }

});

module.exports = router;