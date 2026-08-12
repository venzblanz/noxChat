const express = require("express");
const path = require("path");
const db = require("../db/connection");
const app = express();

app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/messages', require('./routes/messages'));


app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/aboutme.html'));
});
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});
app.get('/test-contacts', (req, res) => {
    db.query('SELECT user_id, username, nickname FROM users', (err, results) => {
        if(err) return res.json({ error: err.message });
        res.json(results);
    });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});