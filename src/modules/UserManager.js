export default class UserManager {
  constructor(users) {
    this.users = users;
  }

  isUserAuthorized(user) {
    const result = this.users().where(x => (x.username === user.username || x.userId === user.id) && x.role !== 'registree');
    return result.length === 1;
  }

  upsertUser(user) {
    const savedUser = this.getUser(user);

    if (savedUser && savedUser.userId === '') {
      savedUser.userId = user.id;
      this.users().update(savedUser);
      return 'update';
    } else if (!savedUser) {
      const fullName = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`;

      this.users().insert({
        userId: user.id,
        username: user.username,
        fullName,
        role: 'registree'
      });
      return 'insert';
    }

    return '';
  }

  getUser(user) {
    return this.users().where(
      x => (user.username && x.username === user.username) ||
      (user.id && x.userId === user.id)
    )[0];
  }
}
