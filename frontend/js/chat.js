const currentUserId = localStorage.getItem('userId');
let currentContactId = null;
let currentConvoId = null;

// redirect to login if not logged in
if (!currentUserId) {
    window.location.href = '/login';
}

// load contacts
async function loadContacts() {
    const res = await fetch(`/messages/contacts?userId=${currentUserId}`);
    const contacts = await res.json();

    const contactList = document.getElementById('contact-list');
    contactList.innerHTML = '';

    contacts.forEach(contact => {
        const div = document.createElement('div');
        div.classList.add('contact');
        div.innerHTML = `
            <img src="images/furfur.png" class="avatar" />
            <div class="contact-info">
                <p class="contact-name">${contact.nickname}</p>
                <p class="contact-status">● offline</p>
            </div>
        `;
        div.addEventListener('click', () => {
            document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
            div.classList.add('active');
            openChat(contact);
        });
        contactList.appendChild(div);
    });
}

// find existing DM conversation or create a new one
async function getOrCreateDM(contactId) {
    const res = await fetch(`/messages/dm?userId=${currentUserId}&contactId=${contactId}`);
    const data = await res.json();
    if (data.convoId) return data.convoId;

    const createRes = await fetch('/messages/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            convoName: null,
            isGroup: false,
            memberIds: [parseInt(currentUserId), contactId]
        })
    });
    const created = await createRes.json();
    return created.convoId;
}

// open chat with contact
async function openChat(contact) {
    currentContactId = contact.user_id;
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('chat-area').style.display = 'flex';
    document.getElementById('chat-name').textContent = contact.nickname;
    document.getElementById('chat-avatar').src = 'images/furfur.png';

    currentConvoId = await getOrCreateDM(contact.user_id);
    loadMessages();
}

// load messages
async function loadMessages() {
    if (!currentConvoId) return;

    const res = await fetch(`/messages/conversation/${currentConvoId}/messages?userId=${currentUserId}`);
    if (!res.ok) return;
    const messages = await res.json();

    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    messages.forEach(msg => {
        const isSent = msg.sender_id == currentUserId;

        // Outer row div
        const row = document.createElement('div');
        row.classList.add('message-row', isSent ? 'sent' : 'received');

        // Bubble
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.textContent = msg.message;

        // Timestamp
        const time = new Date(msg.sent_at);
        const dateGap = new Date().getDate() - time.getDate();
        const hours = time.getHours();
        const minutes = time.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        let display = '';
        if (dateGap === 1) {
            display = 'Yesterday';
        } else if (dateGap > 1) {
            display = time.toLocaleDateString();
        } else {
            display = `${hours % 12 || 12}:${minutes} ${ampm}`;
        }

        const timestamp = document.createElement('span');
        timestamp.classList.add('timestamp');
        timestamp.textContent = display;

        // Wrap bubble + timestamp in a column
        const msgWrapper = document.createElement('div');
        msgWrapper.classList.add('msg-wrapper');
        msgWrapper.appendChild(bubble);
        msgWrapper.appendChild(timestamp);

        row.appendChild(msgWrapper);
        messagesDiv.appendChild(row);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// send message
const messageInput = document.getElementById('message-input');
document.getElementById('send-btn').addEventListener('click', sendMessage);
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 144) + 'px';
});
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    if (!currentConvoId) return;
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    await fetch('/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            convoId: currentConvoId,
            senderId: currentUserId,
            message
        })
    });

    input.value = '';
    input.style.height = 'auto';
    loadMessages();
}

// search contacts
document.getElementById('search-input').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.contact').forEach(contact => {
        const name = contact.querySelector('.contact-name').textContent.toLowerCase();
        contact.style.display = name.includes(search) ? 'flex' : 'none';
    });
});

loadContacts();

// check nickname on load
async function checkNickname() {
    const res = await fetch(`/auth/nickname?userId=${currentUserId}`);
    const data = await res.json();
    document.getElementById('modal-overlay').style.display = data.nickname ? 'none' : 'flex';
}

// save nickname
document.getElementById('save-nickname-btn').addEventListener('click', async () => {
    const nickname = document.getElementById('nickname-input').value.trim();
    if (!nickname) {
        alert('Please enter a nickname!');
        return;
    }
    const res = await fetch('/auth/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, nickname })
    });
    const data = await res.json();
    if (res.ok) {
        document.getElementById('modal-overlay').style.display = 'none';
    } else {
        alert(data.error);
    }
});

checkNickname();

function logout() {
    localStorage.removeItem('userId');
    window.location.replace('/login');
}
