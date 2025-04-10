const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, 'dao_details.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error Opening Database: ", err.message);
    } else {
        console.log("Connected to SQLite Database");

        db.run(`CREATE TABLE IF NOT EXISTS proposal_details (
            proposal_id TEXT PRIMARY KEY,
            details_text TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error("Error Creating table: ", err.message);
                }
            });
    }
});

const getProposalDetails = (proposalId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT details_text from proposal_details WHERE proposal_id = ?`;
        db.get(sql, [proposalId], (err, row) => {
            if (err) {
                console.error("Error reading details: ", err.message);
                reject(err);
            } else {
                resolve(row ? row.details_text: null);
            }
        });
    });
};

const saveProposalDetails = (proposalId, proposalDetails) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT OR REPLACE INTO proposal_details (proposal_id,details_text,last_updated) VALUES (?,?,CURRENT_TIMESTAMP)`;
        db.run(sql, [proposalId,proposalDetails], (err) => {
            if (err) {
                console.error("Error saving details: ",err.message);
                reject(err);
            } else {
                console.log(`Rows Affected: ${this.changes}`);
                resolve({success: true, proposalId: proposalId});
            }
        });
    });
};

module.exports = {
    getProposalDetails,
    saveProposalDetails
};