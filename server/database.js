const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, 'dao_details.sqlite');
let db = null;

const connectDb = () => {

    if (db) return db;

    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error("[Database] Error opening database:", err.message);
            throw err;
        } else {
            console.log("[Database] connected to the SQLite database");
            initializeDbSchema();
        }
    });

    return db;

};

const initializeDbSchema = () => {

    if (!db) return;

    db.serialize(() => {

        db.run(`CREATE TABLE IF NOT EXISTS dao_instances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                token_address TEXT NOT NULL,
                staking_address TEXT NOT NULL UNIQUE,
                voting_address TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("[Database] Error creating dao_instance table:", err.message);
                else console.log("[Database] dao_instance table checked/created.");
        });

        db.all("PRAGMA table_info(proposal_details", (err, columns) => {
            if (err) {
                db.run(`CREATE TABLE IF NOT EXISTS proposal_details (
                    proposal_id TEXT NOT NULL,
                    dao_instance_id INTEGER NOT NULL,
                    details_text TEXT,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (dao_instance_id, proposal_id),
                    FOREIGN KEY (dao_instance_id) REFERENCES dao_instances (id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) console.error("[Database] Error creating proposal_details table:",err.message);
                    else console.log("[Database] proposal_details table checked/created.");
                });
            } else {
                const hasDaoIdColumn = columns.some(col => col.name === 'dao_instance_id');
                if (!hasDaoIdColumn) {
                    console.log("[Database] Adding dao_instance_id column to proposal_details...");
                    db.run("ALTER TABLE proposal_details ADD COLUMN dao_instance_id INTEGER", (err) => {
                        if (err) console.error("[Database] Error adding dao_instance_id column:", err.message);
                        else console.log("[Database] dao_instance_id column added, constrains need manual migration if table pre existed");
                    })
                }
                else {
                    console.log("[Database] proposal_details table schema verified");
                }
            }
        });

    });

};

const createDaoInstance = ({name, token_address, staking_address, voting_address}) => {

    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error("Database not connected"));
        const sql = `INSERT INTO dao_instances (name, token_address, staking_address, voting_address) VALUES (?,?,?,?)`;
        db.run(sql, [name, token_address, staking_address, voting_address], function(err) {
            if (err) {
                console.error("[Database] Error creating DAO Instance:",err.message);
                reject(err);
            } else {
                console.log(`[Database] DAO Instance created with ID: ${this.lastID}`);

                resolve({
                    id: this.lastID,
                    name, token_address, staking_address, voting_address
                });
            }
        });
    });
};

const getAllDaoInstances = () => {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error("Database not connected"));
        const sql = `SELECT id, name, token_address, staking_address, voting_address FROM dao_instances ORDER BY created_at DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("[Database] Error fetching dao instances:", err.message);
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
};

const getProposalDetails = (daoInstanceId, proposalId) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error("Database not connected"));
        const sql = `SELECT details_text FROM proposal_details WHERE dao_instance_id = ? AND proposal_id = ?`;
        db.get(sql, [daoInstanceId, proposalId], (err, row) => {
            if (err) {
                console.error("[Database] Error reading details: ", err.message);
                reject(err);
            } else {
                resolve(row ? row.details_text: null);
            }
        });
    });
};

const saveProposalDetails = (daoInstanceId, proposalId, details) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error("Database not connected"));

        const sql = `INSERT OR REPLACE INTO proposal_details (dao_instance_id, proposal_id, details_text, last_updated) VALUES (?,?,?,CURRENT_TIMESTAMP)`;
        db.run(sql, [daoInstanceId,proposalId,details], (err) => {
            if (err) {
                console.error("[Database] Error saving details:",err.message);
                reject(err);
            } else {
                console.log(`[Database] Proposal Details saved/affected. Rows Affected: ${this.changes}`);
                resolve({success: true, daoInstanceId, proposalId});
            }
        });
    });
};

module.exports = {
    connectDb,
    createDaoInstance,
    getAllDaoInstances,
    getProposalDetails,
    saveProposalDetails
};