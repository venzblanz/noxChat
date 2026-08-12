const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// GET /contacts — all users except current user
router.get('/contacts', (req, res) => {
    const { userId } = req.query;
    db.query(
        'SELECT user_id, username, nickname FROM users WHERE user_id != ?',
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.json(results);
        }
    );
});

// GET /conversations — all conversations the current user is a member of
router.get('/conversations', (req, res) => {
    const { userId } = req.query;
    db.query(`
        SELECT c.convo_id, c.convo_name, c.is_group
        FROM conversations c
        JOIN conversation_members cm ON c.convo_id = cm.convo_id
        WHERE cm.user_id = ?
    `, [userId],
    (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(results);
    });
});

// GET /conversation/:convoId/messages — messages + attachments for a conversation
router.get('/conversation/:convoId/messages', (req, res) => {
    const { convoId } = req.params;
    const { userId } = req.query;

    // First verify the requesting user is actually a member of this conversation
    db.query(
        'SELECT 1 FROM conversation_members WHERE convo_id = ? AND user_id = ?',
        [convoId, userId],
        (err, membership) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            if (!membership.length) return res.status(403).json({ error: 'Access denied' });

            db.query(`
                SELECT
                    m.message_id,
                    m.convo_id,
                    m.sender_id,
                    u.username   AS sender_username,
                    u.nickname   AS sender_nickname,
                    m.message,
                    m.sent_at,
                    ma.attachment_id,
                    ma.file_url,
                    ma.original_filename
                FROM messages m
                JOIN users u ON m.sender_id = u.user_id
                LEFT JOIN message_attachments ma ON m.message_id = ma.message_id
                WHERE m.convo_id = ?
                ORDER BY m.sent_at ASC
            `, [convoId],
            (err, results) => {
                if (err) return res.status(500).json({ error: 'Server error' });

                // Group attachments under their parent message
                const messagesMap = {};
                results.forEach(row => {
                    if (!messagesMap[row.message_id]) {
                        messagesMap[row.message_id] = {
                            message_id:       row.message_id,
                            convo_id:         row.convo_id,
                            sender_id:        row.sender_id,
                            sender_username:  row.sender_username,
                            sender_nickname:  row.sender_nickname,
                            message:          row.message,
                            sent_at:          row.sent_at,
                            attachments:      []
                        };
                    }
                    if (row.attachment_id) {
                        messagesMap[row.message_id].attachments.push({
                            attachment_id:     row.attachment_id,
                            file_url:          row.file_url,
                            original_filename: row.original_filename
                        });
                    }
                });

                res.json(Object.values(messagesMap));
            });
        }
    );
});

// POST /conversation — create a new conversation (DM or group)
router.post('/conversation', (req, res) => {
    const { convoName, isGroup, memberIds } = req.body;
    // memberIds: array of user_ids including the creator

    db.query(
        'INSERT INTO conversation (convo_name, is_group) VALUES (?, ?)',
        [convoName, isGroup ? 1 : 0],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Server error' });

            const convoId = result.insertId;
            const memberRows = memberIds.map(id => [convoId, id]);

            db.query(
                'INSERT INTO conversation_members (convo_id, user_id) VALUES ?',
                [memberRows],
                (err) => {
                    if (err) return res.status(500).json({ error: 'Server error' });
                    res.status(201).json({ convoId });
                }
            );
        }
    );
});

// POST /send — send a message to a conversation
router.post('/send', (req, res) => {
    const { convoId, senderId, message } = req.body;

    // Verify sender is a member of the conversation
    db.query(
        'SELECT 1 FROM conversation_members WHERE convo_id = ? AND user_id = ?',
        [convoId, senderId],
        (err, membership) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            if (!membership.length) return res.status(403).json({ error: 'Access denied' });

            db.query(
                'INSERT INTO messages (convo_id, sender_id, message) VALUES (?, ?, ?)',
                [convoId, senderId, message],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Server error' });
                    res.status(201).json({ messageId: result.insertId });
                }
            );
        }
    );
});
// GET /dm?userId=X&contactId=Y — find existing DM or return null
router.get('/dm', (req, res) => {
    const { userId, contactId } = req.query;
    db.query(`
        SELECT c.convo_id FROM conversation c
        JOIN conversation_members cm1 ON c.convo_id = cm1.convo_id AND cm1.user_id = ?
        JOIN conversation_members cm2 ON c.convo_id = cm2.convo_id AND cm2.user_id = ?
        WHERE c.is_group = 0
        LIMIT 1
    `, [userId, contactId],
    (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json(results.length ? { convoId: results[0].convo_id } : { convoId: null });
    });
});
module.exports = router;