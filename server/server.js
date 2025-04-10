require('dotenv').config();
console.log('Loaded env:', process.env.PORT);
const express = require("express");
const cors = require("cors");
const path = require("path");
const proposalRoutes = require("./routes/proposals");

const app = express();
const PORT = process.env.PORT || 3002;
;

app.use(cors());
app.use(express.json());

app.use('/api/proposals', proposalRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

    app.get(/^\/(?!api).*/, (req,res) => {
        res.sendFile(path.resolve(__dirname, '..', 'client', 'build', 'index.html'));
    });
} else {
    app.get('/', (req,res) => {
        res.send("DAElect Backend Server Running (Development Mode)");
    });
}

app.listen(PORT, () => {
    console.log(`Backend Server is running on http://localhost:${PORT}/`);
    console.log(process.env.NODE_ENV);
    require('./database');
});