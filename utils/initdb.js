// Create and initialize user db
import Loki from 'lokijs';
import USERS from '../src/data/users';

const db = new Loki('src/data/users.json');

let users = db.getCollection('users');
if (!users) {
  users = db.addCollection('users', { indices: ['userId'] });
}

Object.keys(USERS).forEach((username) => {
  // Use username as the user's fullname for now, can be edited later
  console.log(`Inserting ${username} ${USERS[username]}`);
  users.insert({ userId: USERS[username], username, fullName: username });
});

db.saveDatabase();
console.log('Done migrating users from src/data/users.js to src/data/users.json');
