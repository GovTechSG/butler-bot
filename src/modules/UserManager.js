export default class UserManager {
  constructor(database) {
    this.database = database;
  }

  loadUsers() {
    return this.database.getCollection('users');
  }

  checkAuthorisedUsers(user) {
    const result = this.loadUsers().where(x => x.username === user.username);
    if (result.length) {
      console.log('result', result);
      console.log('user.username', user.username);
      console.log('true', true);
      return true;
    }
    return false;
  }
}
