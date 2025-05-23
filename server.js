const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { join } = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

// Setup database
const adapter = new FileSync(join(__dirname, "database.json"));
const db = low(adapter);

// Inisialisasi default jika belum ada
db.defaults({
  users: [],
  contacts: {},
  chats: {}
}).write();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// === Routes ===

// Register User
app.post("/register", (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone || phone.length !== 6)
    return res.status(400).send("Invalid input");

  const userExists = db.get("users").find({ phone }).value();
  if (userExists)
    return res.status(400).send("Phone number already registered");

  const newUser = {
    name,
    phone,
    bio: "Hey there! I'm using WhatsApp Clone",
    profilePic: "https://via.placeholder.com/150 ",
    status: "online"
  };

  db.get("users").push(newUser).write();

  // Init contacts & chats
  db.set(`contacts.${phone}`, []).write();
  db.set(`chats.${phone}`, {}).write();

  res.json({ success: true, user: newUser });
});

// Login User
app.post("/login", (req, res) => {
  const { phone } = req.body;
  const user = db.get("users").find({ phone }).value();
  if (!user) return res.status(404).send("User not found");

  // Update online status
  db.get("users")
    .find({ phone })
    .assign({ status: "online" })
    .write();

  res.json({ success: true, user });
});

// Get All Users (untuk pencarian kontak)
app.get("/users", (req, res) => {
  const users = db.get("users").value();
  res.json(users);
});

// Add Contact
app.post("/contacts", (req, res) => {
  const { userPhone, contactName, contactPhone } = req.body;
  const contactExists = db.get(`contacts.${userPhone}`).find({ phone: contactPhone }).value();
  if (contactExists) return res.status(400).send("Contact already added");

  const contactUser = db.get("users").find({ phone: contactPhone }).value();

  const newContact = {
    name: contactName,
    phone: contactPhone,
    isUser: !!contactUser,
    profilePic: contactUser ? contactUser.profilePic : "https://via.placeholder.com/150 "
  };

  db.get(`contacts.${userPhone}`).push(newContact).write();
  res.json({ success: true, contact: newContact });
});

// Get Contacts
app.get("/contacts/:phone", (req, res) => {
  const { phone } = req.params;
  const contacts = db.get(`contacts.${phone}`).value() || [];
  res.json(contacts);
});

// Send Message
app.post("/messages", (req, res) => {
  const { sender, receiver, message } = req.body;
  const timestamp = new Date().toISOString();

  db.get(`chats.${sender}.${receiver}`)
    .push({ sender, content: message, timestamp })
    .write();

  db.get(`chats.${receiver}.${sender}`)
    .push({ sender, content: message, timestamp })
    .write();

  res.json({ success: true });
});

// Get Messages
app.get("/messages/:user/:contact", (req, res) => {
  const { user, contact } = req.params;
  const messages = db.get(`chats.${user}.${contact}`).value() || [];
  res.json(messages);
});

// Update Profile
app.put("/profile", (req, res) => {
  const { phone, name, bio, profilePic } = req.body;
  const user = db.get("users").find({ phone }).value();
  if (!user) return res.status(404).send("User not found");

  db.get("users")
    .find({ phone })
    .assign({ name, bio, profilePic })
    .write();

  // Update nama & foto profil di kontak orang lain
  db.get("contacts").forEach(contactList => {
    contactList.forEach(c => {
      if (c.phone === phone && c.isUser) {
        c.name = name;
        c.profilePic = profilePic;
      }
    });
  }).write();

  res.json({ success: true });
});

// Logout / Set Offline
app.post("/logout", (req, res) => {
  const { phone } = req.body;
  db.get("users")
    .find({ phone })
    .assign({ status: "offline" })
    .write();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});