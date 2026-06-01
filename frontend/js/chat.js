const currentUserId = localStorage.getItem('userId');
let currentContactId = null;

// redirect to login if not logged in
if(!currentUserId){
    window.location.href = '/login.html';
}

// load contacts
async function loadContacts(){
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

// open chat with contact
function openChat(contact){
    currentContactId = contact.user_id;
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('chat-area').style.display = 'flex';
    document.getElementById('chat-name').textContent = contact.nickname;
    document.getElementById('chat-avatar').src = 'images/furfur.png';
    loadMessages();
}

// load messages
async function loadMessages(){
    const res = await fetch(`/messages/conversation?user=${currentUserId}&contact=${currentContactId}`);
    const messages = await res.json();

    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    messages.forEach(msg => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(msg.sender_id == currentUserId ? 'sent' : 'received');
    
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.textContent = msg.messages;
    
    div.appendChild(bubble);
    messagesDiv.appendChild(div);
});

    // scroll to bottom
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
    if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage(){
    if(!currentContactId) return;
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if(!message) return;

    await fetch('/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            senderId: currentUserId,
            receiverId: currentContactId,
            message
        })
    });

    input.value = '';
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
async function checkNickname(){
    const res = await fetch(`/auth/nickname?userId=${currentUserId}`);
    const data = await res.json();

    if(!data.nickname){
        // show modal
        document.getElementById('modal-overlay').style.display = 'flex';
    } else {
        // hide modal
        document.getElementById('modal-overlay').style.display = 'none';
    }
}

// save nickname
document.getElementById('save-nickname-btn').addEventListener('click', async () => {
    const nickname = document.getElementById('nickname-input').value.trim();
    if(!nickname){
        alert('Please enter a nickname!');
        return;
    }

    const res = await fetch('/auth/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, nickname })
    });

    const data = await res.json();
    if(res.ok){
        document.getElementById('modal-overlay').style.display = 'none';
    } else {
        alert(data.error);
    }
});
checkNickname();



function logout() {
    localStorage.removeItem("userId");
    window.location.replace("login.html");
}