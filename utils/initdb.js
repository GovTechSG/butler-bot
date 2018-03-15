// Create and initialize user db
import Loki from 'lokijs';
import USERS from '../data/users';

const db = new Loki('data/users.json');

let users = db.getCollection('users');
if (!users) {
  users = db.addCollection('users', { indices: ['userId'] });
}

Object.keys(USERS).forEach((username) => {
  // Use username as the user's fullname for now, can be edited later
  console.log(`Inserting ${username} ${USERS[username]}`);
  let user = { userId: USERS[username], username, fullName: username };

  user.role = USERS[username] ? 'admin' : 'user';
  users.insert(user);
});

db.saveDatabase();
console.log('Done migrating users from data/users.js to data/users.json');
