const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// get contacts (all users except current)
router.get('/contacts', (req, res) => {
    const { userId } = req.query;
    db.query(
        'SELECT user_id, username, nickname FROM users WHERE user_id != ?',
        [userId],
        (err, results) => {
            if(err) return res.status(500).json({ error: 'Server error' });
            console.log('contacts query result:', results);
            res.json(results);
        }
    );
});

// get conversation
router.get('/conversation', (req, res) => {
    const { user, contact } = req.query;
    db.query(`
        SELECT * FROM messages
        WHERE (sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC
    `, [user, contact, contact, user],
    (err, results) => {
        if(err) return res.status(500).json({ error: 'Server error' });
        res.json(results);
    });
});

// send message
router.post('/send', (req, res) => {
    const { senderId, receiverId, message } = req.body;
    db.query(
        'INSERT INTO messages (sender_id, receiver_id, messages) VALUES (?, ?, ?)',
        [senderId, receiverId, message],
        (err) => {
            if(err) return res.status(500).json({ error: 'Server error' });
            res.status(201).json({ message: 'Message sent' });
        }
    );
});

module.exports = router;