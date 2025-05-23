// Backend Simulation
class WhatsAppBackend {
    constructor() {
        try {
            this.users = JSON.parse(localStorage.getItem('whatsappUsers')) || [];
            this.contacts = JSON.parse(localStorage.getItem('whatsappContacts')) || {};
            this.chats = JSON.parse(localStorage.getItem('whatsappChats')) || {};
        } catch (e) {
            console.warn("LocalStorage tidak tersedia", e);
            this.users = [];
            this.contacts = {};
            this.chats = {};
        }

        this.currentUser = null;
        this.onlineUsers = {};

        // Simulate online status changes
        setInterval(() => {
            this.updateOnlineStatus();
        }, 30000);
    }

    register(name, phone) {
        if (this.users.some(user => user.phone === phone)) {
            return { success: false, message: 'Phone number already registered' };
        }

        const newUser = {
            name,
            phone,
            bio: 'Hey there! I\'m using WhatsApp Clone',
            profilePic: 'https://via.placeholder.com/150 ',
            status: 'online'
        };

        this.users.push(newUser);
        this.saveToLocalStorage();

        if (!this.contacts[phone]) this.contacts[phone] = [];
        if (!this.chats[phone]) this.chats[phone] = {};
        this.saveToLocalStorage();

        return { success: true, user: newUser };
    }

    login(phone) {
        const user = this.users.find(user => user.phone === phone);
        if (!user) return { success: false, message: 'Phone number not registered' };

        this.currentUser = user;
        this.onlineUsers[phone] = true;
        this.updateOnlineStatus();

        return { success: true, user };
    }

    logout() {
        if (this.currentUser) {
            this.onlineUsers[this.currentUser.phone] = false;
            this.currentUser = null;
        }
    }

    updateOnlineStatus() {
        this.users.forEach(user => {
            this.onlineUsers[user.phone] = Math.random() > 0.5;
        });
        if (this.currentUser) {
            this.onlineUsers[this.currentUser.phone] = true;
        }
    }

    isOnline(phone) {
        return !!this.onlineUsers[phone];
    }

    addContact(userPhone, contactName, contactPhone) {
        if (this.contacts[userPhone]?.some(contact => contact.phone === contactPhone)) {
            return { success: false, message: 'Contact already exists' };
        }

        const contactUser = this.users.find(user => user.phone === contactPhone);
        const newContact = {
            name: contactName,
            phone: contactPhone,
            isUser: !!contactUser,
            profilePic: contactUser ? contactUser.profilePic : 'https://via.placeholder.com/150 '
        };

        if (!this.contacts[userPhone]) this.contacts[userPhone] = [];
        this.contacts[userPhone].push(newContact);
        this.saveToLocalStorage();

        return { success: true, contact: newContact };
    }

    getContacts(userPhone) {
        return this.contacts[userPhone] || [];
    }

    getUser(phone) {
        return this.users.find(user => user.phone === phone);
    }

    updateProfile(userPhone, name, bio, profilePic) {
        const user = this.users.find(user => user.phone === userPhone);
        if (!user) return false;

        if (name) user.name = name;
        if (bio) user.bio = bio;
        if (profilePic) user.profilePic = profilePic;

        for (const phone in this.contacts) {
            this.contacts[phone].forEach(contact => {
                if (contact.phone === userPhone && contact.isUser) {
                    contact.name = user.name;
                    contact.profilePic = user.profilePic;
                }
            });
        }

        this.saveToLocalStorage();
        return true;
    }

    sendMessage(senderPhone, receiverPhone, message, isImage = false) {
        const timestamp = new Date().toISOString();
        const newMessage = {
            sender: senderPhone,
            content: message,
            isImage,
            timestamp
        };

        if (!this.chats[senderPhone]) this.chats[senderPhone] = {};
        if (!this.chats[senderPhone][receiverPhone]) this.chats[senderPhone][receiverPhone] = [];
        if (!this.chats[receiverPhone]) this.chats[receiverPhone] = {};
        if (!this.chats[receiverPhone][senderPhone]) this.chats[receiverPhone][senderPhone] = [];

        this.chats[senderPhone][receiverPhone].push(newMessage);
        this.chats[receiverPhone][senderPhone].push(newMessage);

        this.saveToLocalStorage();
        return newMessage;
    }

    getChatMessages(userPhone, contactPhone) {
        return this.chats[userPhone]?.[contactPhone] || [];
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('whatsappUsers', JSON.stringify(this.users));
            localStorage.setItem('whatsappContacts', JSON.stringify(this.contacts));
            localStorage.setItem('whatsappChats', JSON.stringify(this.chats));
        } catch (e) {
            console.error("Tidak bisa simpan ke localStorage", e);
        }
    }
}

// Frontend App
class WhatsAppApp {
    constructor() {
        this.backend = new WhatsAppBackend();
        this.currentView = 'auth';
        this.currentChat = null;
        this.initElements();
        this.initEventListeners();
        this.checkAuth();
    }

    initElements() {
        // Auth Screen
        this.authScreen = document.getElementById('auth-screen');
        this.registerForm = document.getElementById('register-form');
        this.loginForm = document.getElementById('login-form');
        this.registerBtn = document.getElementById('register-btn') || null;
        this.loginBtn = document.getElementById('login-btn') || null;
        this.showLoginBtn = document.getElementById('show-login-btn') || null;
        this.showRegisterBtn = document.getElementById('show-register-btn') || null;
        this.registerName = document.getElementById('register-name') || null;
        this.registerPhone = document.getElementById('register-phone') || null;
        this.loginPhone = document.getElementById('login-phone') || null;

        // Main App
        this.mainApp = document.getElementById('main-app') || null;
        this.backBtn = document.getElementById('back-btn') || null;
        this.headerTitle = document.getElementById('header-title') || null;
        this.searchBtn = document.getElementById('search-btn') || null;
        this.menuBtn = document.getElementById('menu-btn') || null;
        this.searchBar = document.getElementById('search-bar') || null;
        this.closeSearchBtn = document.getElementById('close-search-btn') || null;

        // Sidebar
        this.sidebar = document.getElementById('sidebar') || null;
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.chatList = document.getElementById('chat-list') || null;
        this.contactList = document.getElementById('contact-list') || null;
        this.addContactBtn = document.getElementById('add-contact-btn') || null;

        // Profile
        this.profilePicture = document.getElementById('profile-picture') || null;
        this.profileStatus = document.getElementById('profile-status') || null;
        this.profileName = document.getElementById('profile-name') || null;
        this.profileBio = document.getElementById('profile-bio') || null;
        this.editProfileBtn = document.getElementById('edit-profile-btn') || null;
        this.logoutBtn = document.getElementById('logout-btn') || null;

        // Chat View
        this.chatView = document.getElementById('chat-view') || null;
        this.chatViewProfilePic = document.getElementById('chat-view-profile-pic') || null;
        this.chatViewStatusText = document.getElementById('chat-view-status-text') || null;
        this.chatViewName = document.getElementById('chat-view-name') || null;
        this.messagesContainer = document.getElementById('messages-container') || null;
        this.messageInput = document.getElementById('message-input') || null;
        this.sendMessageBtn = document.getElementById('send-message-btn') || null;

        // Modals
        this.addContactModal = document.getElementById('add-contact-modal') || null;
        this.contactName = document.getElementById('contact-name') || null;
        this.contactPhone = document.getElementById('contact-phone') || null;
        this.cancelAddContact = document.getElementById('cancel-add-contact') || null;
        this.saveContact = document.getElementById('save-contact') || null;

        this.editProfileModal = document.getElementById('edit-profile-modal') || null;
        this.editProfilePicture = document.getElementById('edit-profile-picture') || null;
        this.changeProfilePic = document.getElementById('change-profile-pic') || null;
        this.profilePicInput = document.getElementById('profile-pic-input') || null;
        this.editName = document.getElementById('edit-name') || null;
        this.editBio = document.getElementById('edit-bio') || null;
        this.cancelEditProfile = document.getElementById('cancel-edit-profile') || null;
        this.saveProfile = document.getElementById('save-profile') || null;

        this.viewProfileModal = document.getElementById('view-profile-modal') || null;
        this.viewProfilePicture = document.getElementById('view-profile-picture') || null;
        this.viewProfileName = document.getElementById('view-profile-name') || null;
        this.viewProfileBio = document.getElementById('view-profile-bio') || null;
        this.closeViewProfile = document.getElementById('close-view-profile') || null;
        this.messageFromProfile = document.getElementById('message-from-profile') || null;
    }

    initEventListeners() {
        if (this.registerBtn) this.registerBtn.addEventListener('click', () => this.handleRegister());
        if (this.loginBtn) this.loginBtn.addEventListener('click', () => this.handleLogin());
        if (this.showLoginBtn) this.showLoginBtn.addEventListener('click', () => this.toggleAuthForms());
        if (this.showRegisterBtn) this.showRegisterBtn.addEventListener('click', () => this.toggleAuthForms());

        if (this.backBtn) this.backBtn.addEventListener('click', () => this.showSidebar());
        if (this.searchBtn) this.searchBtn.addEventListener('click', () => this.toggleSearch());
        if (this.closeSearchBtn) this.closeSearchBtn.addEventListener('click', () => this.toggleSearch());

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        if (this.editProfileBtn) this.editProfileBtn.addEventListener('click', () => this.showEditProfile());
        if (this.logoutBtn) this.logoutBtn.addEventListener('click', () => this.handleLogout());

        if (this.sendMessageBtn) this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        if (this.messageInput) this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        if (this.addContactBtn) this.addContactBtn.addEventListener('click', () => this.showAddContactModal());
        if (this.cancelAddContact) this.cancelAddContact.addEventListener('click', () => this.hideAddContactModal());
        if (this.saveContact) this.saveContact.addEventListener('click', () => this.handleAddContact());

        if (this.changeProfilePic) this.changeProfilePic.addEventListener('click', () => this.profilePicInput.click());
        if (this.profilePicInput) this.profilePicInput.addEventListener('change', (e) => this.handleProfilePicChange(e));

        if (this.saveProfile) this.saveProfile.addEventListener('click', () => this.handleSaveProfile());
        if (this.cancelEditProfile) this.cancelEditProfile.addEventListener('click', () => this.hideEditProfileModal());

        if (this.closeViewProfile) this.closeViewProfile.addEventListener('click', () => this.hideViewProfileModal());
        if (this.messageFromProfile) this.messageFromProfile.addEventListener('click', () => this.messageFromProfileHandler());
    }

    checkAuth() {
        if (this.backend.currentUser) {
            this.showMainApp();
            this.loadUserData();
        }
    }

    toggleAuthForms() {
        if (this.registerForm) this.registerForm.classList.toggle('hidden');
        if (this.loginForm) this.loginForm.classList.toggle('hidden');
    }

    handleRegister() {
        const name = this.registerName?.value.trim();
        const phone = this.registerPhone?.value.trim();
        if (!name || !phone) {
            alert('Please fill in all fields');
            return;
        }
        if (phone.length !== 6 || !/^\d+$/.test(phone)) {
            alert('Phone number must be 6 digits');
            return;
        }
        const result = this.backend.register(name, phone);
        if (result.success) {
            this.backend.login(phone);
            this.showMainApp();
            this.loadUserData();
        } else {
            alert(result.message);
        }
    }

    handleLogin() {
        const phone = this.loginPhone?.value.trim();
        if (!phone) {
            alert('Please enter your phone number');
            return;
        }
        const result = this.backend.login(phone);
        if (result.success) {
            this.showMainApp();
            this.loadUserData();
        } else {
            alert(result.message);
        }
    }

    showMainApp() {
        if (this.authScreen) this.authScreen.classList.add('hidden');
        if (this.mainApp) this.mainApp.classList.remove('hidden');
        this.currentView = 'main';
    }

    loadUserData() {
        const user = this.backend.currentUser;
        if (!user) return;

        if (this.profileName) this.profileName.textContent = user.name;
        if (this.profileBio) this.profileBio.textContent = user.bio;
        if (this.profilePicture) this.profilePicture.src = user.profilePic;
        if (this.profileStatus) this.profileStatus.className = user.status === 'online' ? 'status-online' : 'status-offline';

        this.loadChatList();
        this.loadContacts();
    }

    loadChatList() {
        const user = this.backend.currentUser;
        if (!user || !this.chatList) return;

        const chats = this.backend.getChatList(user.phone);
        this.chatList.innerHTML = '';
        chats.forEach(chat => {
            const chatElement = document.createElement('div');
            chatElement.className = 'p-3 flex items-center hover:bg-gray-100 cursor-pointer';
            chatElement.dataset.phone = chat.phone;
            chatElement.innerHTML = `
                <div class="relative mr-3">
                    <img src="${chat.profilePic}" alt="${chat.name}" class="w-12 h-12 rounded-full object-cover">
                    <div class="${this.backend.isOnline(chat.phone) ? 'status-online' : 'status-offline'}"></div>
                </div>
                <div class="flex-1">
                    <h3 class="font-medium">${chat.name}</h3>
                    <p class="text-sm text-gray-500 truncate">${chat.lastMessage}</p>
                </div>
                <div class="text-xs text-gray-500">
                    ${new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>`;
            chatElement.addEventListener('click', () => this.openChat(chat.phone));
            this.chatList.appendChild(chatElement);
        });
    }

    loadContacts() {
        const user = this.backend.currentUser;
        if (!user || !this.contactList) return;

        const contacts = this.backend.getContacts(user.phone);
        this.contactList.innerHTML = '';
        contacts.forEach(contact => {
            const contactElement = document.createElement('div');
            contactElement.className = 'p-3 flex items-center hover:bg-gray-100 cursor-pointer';
            contactElement.dataset.phone = contact.phone;
            contactElement.innerHTML = `
                <div class="relative mr-3">
                    <img src="${contact.profilePic}" alt="${contact.name}" class="w-12 h-12 rounded-full object-cover">
                    ${contact.isUser ? `<div class="${this.backend.isOnline(contact.phone) ? 'status-online' : 'status-offline'}"></div>` : ''}
                </div>
                <div class="flex-1">
                    <h3 class="font-medium">${contact.name}</h3>
                    <p class="text-sm text-gray-500">${contact.isUser ? 'WhatsApp User' : 'Not on WhatsApp'}</p>
                </div>
                <button class="text-gray-500"><i class="fas fa-ellipsis-v"></i></button>`;
            const moreBtn = contactElement.querySelector('button');
            if (moreBtn) {
                moreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showContactOptions(contact);
                });
            }
            contactElement.addEventListener('click', () => this.showContactProfile(contact));
            this.contactList.appendChild(contactElement);
        });
    }

    switchTab(tab) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });
        if (this.headerTitle) this.headerTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
    }

    toggleSearch() {
        if (this.searchBar) this.searchBar.classList.toggle('hidden');
    }

    openChat(contactPhone) {
        this.currentChat = contactPhone;
        const contact = this.backend.getContactInfo(this.backend.currentUser.phone, contactPhone);
        if (!contact) return;

        if (this.chatViewName) this.chatViewName.textContent = contact.name;
        if (this.chatViewProfilePic) this.chatViewProfilePic.src = contact.profilePic;
        if (this.chatViewStatusText) this.chatViewStatusText.textContent = this.backend.isOnline(contact.phone) ? 'online' : 'offline';
        if (this.chatViewStatus) this.chatViewStatus.className = this.backend.isOnline(contact.phone) ? 'status-online' : 'status-offline';

        this.loadMessages(contactPhone);
        this.showChatView();
    }

    loadMessages(contactPhone) {
        const user = this.backend.currentUser;
        if (!user || !this.messagesContainer) return;

        const messages = this.backend.getChatMessages(user.phone, contactPhone);
        this.messagesContainer.innerHTML = '';
        messages.forEach(message => {
            const isMe = message.sender === user.phone;
            const contact = this.backend.getContactInfo(user.phone, message.sender);
            const messageElement = document.createElement('div');
            messageElement.className = `flex ${isMe ? 'justify-end' : 'justify-start'} fade-in`;
            messageElement.innerHTML = `
                <div class="max-w-xs md:max-w-md rounded-lg p-3 ${isMe ? 'chat-bubble-me' : 'chat-bubble-other'} shadow">
                    ${message.isImage ? 
                        `<img src="${message.content}" alt="Sent image" class="rounded-lg max-w-full h-auto">` : 
                        `<p>${message.content}</p>`
                    }
                    <p class="text-xs text-gray-500 text-right mt-1">
                        ${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>`;
            this.messagesContainer.appendChild(messageElement);
        });

        if (this.messagesContainer) this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    sendMessage() {
        const message = this.messageInput?.value.trim();
        if (!message || !this.currentChat) return;

        this.backend.sendMessage(this.backend.currentUser.phone, this.currentChat, message);
        this.loadMessages(this.currentChat);
        this.messageInput.value = '';
        this.loadChatList();
    }

    showChatView() {
        if (this.sidebar) this.sidebar.classList.add('hidden');
        if (this.chatView) this.chatView.classList.remove('hidden');
        if (this.backBtn) this.backBtn.classList.remove('hidden');
        if (this.headerTitle) this.headerTitle.textContent = 'Chat';
    }

    showSidebar() {
        if (this.sidebar) this.sidebar.classList.remove('hidden');
        if (this.chatView) this.chatView.classList.add('hidden');
        if (this.backBtn) this.backBtn.classList.add('hidden');
        if (this.headerTitle) this.headerTitle.textContent = 'WhatsApp';
        this.currentChat = null;
        this.loadChatList();
    }

    showAddContactModal() {
        if (this.addContactModal) this.addContactModal.classList.remove('hidden');
        if (this.contactName) this.contactName.value = '';
        if (this.contactPhone) this.contactPhone.value = '';
    }

    hideAddContactModal() {
        if (this.addContactModal) this.addContactModal.classList.add('hidden');
    }

    handleAddContact() {
        const name = this.contactName?.value.trim();
        const phone = this.contactPhone?.value.trim();
        if (!name || !phone) {
            alert('Please fill in all fields');
            return;
        }
        if (phone.length !== 6 || !/^\d+$/.test(phone)) {
            alert('Phone number must be 6 digits');
            return;
        }
        if (phone === this.backend.currentUser.phone) {
            alert("You can't add yourself as a contact");
            return;
        }

        const result = this.backend.addContact(this.backend.currentUser.phone, name, phone);
        if (result.success) {
            this.loadContacts();
            this.hideAddContactModal();
        } else {
            alert(result.message);
        }
    }

    showEditProfile() {
        const user = this.backend.currentUser;
        if (!user) return;

        if (this.editName) this.editName.value = user.name;
        if (this.editBio) this.editBio.value = user.bio;
        if (this.editProfilePicture) this.editProfilePicture.src = user.profilePic;
        if (this.editProfileModal) this.editProfileModal.classList.remove('hidden');
    }

    hideEditProfileModal() {
        if (this.editProfileModal) this.editProfileModal.classList.add('hidden');
    }

    handleSaveProfile() {
        const name = this.editName?.value.trim();
        const bio = this.editBio?.value.trim();
        const profilePic = this.editProfilePicture?.src;
        if (!name) {
            alert('Name is required');
            return;
        }

        const success = this.backend.updateProfile(this.backend.currentUser.phone, name, bio, profilePic);
        if (success) {
            this.loadUserData();
            this.hideEditProfileModal();
        }
    }

    handleProfilePicChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (this.editProfilePicture) this.editProfilePicture.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    showContactProfile(contact) {
        if (contact.isUser) {
            const user = this.backend.getUser(contact.phone);
            if (!user) return;

            if (this.viewProfileName) this.viewProfileName.textContent = user.name;
            if (this.viewProfileBio) this.viewProfileBio.textContent = user.bio;
            if (this.viewProfilePicture) this.viewProfilePicture.src = user.profilePic;
            if (this.viewProfileStatus) this.viewProfileStatus.className = this.backend.isOnline(user.phone) ? 'status-online' : 'status-offline';
            if (this.viewProfileModal) this.viewProfileModal.classList.remove('hidden');

            this.currentProfileView = user.phone;
        } else {
            alert(`${contact.name} is not a WhatsApp user`);
        }
    }

    hideViewProfileModal() {
        if (this.viewProfileModal) this.viewProfileModal.classList.add('hidden');
        this.currentProfileView = null;
    }

    messageFromProfileHandler() {
        if (this.currentProfileView) {
            this.openChat(this.currentProfileView);
            this.hideViewProfileModal();
        }
    }

    showContactOptions(contact) {
        alert(`Options for ${contact.name}`);
    }

    handleLogout() {
        this.backend.logout();
        if (this.mainApp) this.mainApp.classList.add('hidden');
        if (this.authScreen) this.authScreen.classList.remove('hidden');
        this.currentView = 'auth';

        if (this.loginForm) this.loginForm.classList.add('hidden');
        if (this.registerForm) this.registerForm.classList.remove('hidden');
        if (this.registerName) this.registerName.value = '';
        if (this.registerPhone) this.registerPhone.value = '';
        if (this.loginPhone) this.loginPhone.value = '';
    }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new WhatsAppApp();
});
