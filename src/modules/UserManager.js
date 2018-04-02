export default class UserManager {
  constructor(collection) {
    this.users = collection;
  }

  isUserAuthorized(user) {
    const result = this.users.where(x => x.username === user.username && x.role !== 'registree');
    return result.length === 1;
  }

  upsertUser(user) {
    const savedUser = this.getUser(user);

    if (savedUser.userId === '') {
      savedUser.userId = user.id;
      this.users.update(savedUser);
    }
  }

  getUser(user) {
    return this.users.findOne(x => x.username === user.username);
  }
}
