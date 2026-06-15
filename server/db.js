const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'data');
const dbFile = path.join(dbDir, 'db.json');

// Ensure db directory and file exist
function initializeDb() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(dbFile)) {
    const initialData = {
      users: [],
      trips: [],
      transactions: []
    };
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Read database
function readDb() {
  initializeDb();
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON database:', error);
    return { users: [], trips: [], transactions: [] };
  }
}

// Write database safely
function writeDb(data) {
  initializeDb();
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to JSON database:', error);
    return false;
  }
}

// User Helpers
const users = {
  findAll: () => readDb().users,
  findById: (id) => readDb().users.find(u => u.id === id),
  findByEmail: (email) => readDb().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  create: (user) => {
    const db = readDb();
    db.users.push(user);
    writeDb(db);
    return user;
  },
  update: (id, updates) => {
    const db = readDb();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updates };
      writeDb(db);
      return db.users[idx];
    }
    return null;
  }
};

// Trip Helpers
const trips = {
  findAll: () => readDb().trips,
  findById: (id) => readDb().trips.find(t => t.id === id),
  findByUserId: (userId) => readDb().trips.filter(t => t.userId === userId),
  create: (trip) => {
    const db = readDb();
    db.trips.push(trip);
    writeDb(db);
    return trip;
  },
  delete: (id) => {
    const db = readDb();
    const originalLength = db.trips.length;
    db.trips = db.trips.filter(t => t.id !== id);
    writeDb(db);
    return db.trips.length < originalLength;
  }
};

// Transaction Helpers
const transactions = {
  findAll: () => readDb().transactions,
  findById: (id) => readDb().transactions.find(t => t.id === id),
  findByUserId: (userId) => readDb().transactions.filter(t => t.userId === userId),
  create: (tx) => {
    const db = readDb();
    db.transactions.push(tx);
    writeDb(db);
    return tx;
  },
  update: (id, updates) => {
    const db = readDb();
    const idx = db.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      db.transactions[idx] = { ...db.transactions[idx], ...updates };
      writeDb(db);
      return db.transactions[idx];
    }
    return null;
  }
};

module.exports = {
  users,
  trips,
  transactions
};
