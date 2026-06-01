const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const bcrypt = require('bcrypt');

// register
router.post('/register', async (req, res) => {
   const {username, password} = req.body;
   
   db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if(err) {
            return res.status(500).json({ error: 'Server error' });
        }
        if(results.length > 0){
            return res.status(400).json({ error: 'Username already taken' });
        }
        const hashedPass = await bcrypt.hash(password, 10); 
        db.query('INSERT INTO users (username, password) values (?,?)',
            [username, hashedPass],
            (err) => {
                if(err){
                    return res.status(500).json({ error: 'Server error' });
                }
                res.status(201).json({ message: 'User registered successfully'});
            }
        );
   });
});

// login
router.post('/login', (req,res) => {
    const {username, password} = req.body;

    db.query('SELECT * FROM users WHERE username = ?',
        [username],
        async(err, result) => {
            if(err){
                return res.status(500).json({ error: 'Server error' });
            }
            if(result.length === 0){
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const match = await bcrypt.compare(password, result[0].password);
            if(!match){
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            res.json({ message: 'Login successful', userId: result[0].user_id });
        }
    );
});

// get nickname
router.get('/nickname', (req, res) => {
    const { userId } = req.query;
    db.query(
        'SELECT nickname FROM users WHERE user_id = ?',
        [userId],
        (err, results) => {
            if(err) return res.status(500).json({ error: 'Server error' });
            res.json({ nickname: results[0].nickname });
        }
    );
});

// save nickname
router.post('/nickname', (req, res) => {
    const { userId, nickname } = req.body;
    db.query(
        'UPDATE users SET nickname = ? WHERE user_id = ?',
        [nickname, userId],
        (err) => {
            if(err) return res.status(500).json({ error: 'Server error' });
            res.json({ message: 'Nickname saved!' });
        }
    );
});

module.exports = router;