import { expect } from 'chai';
import Loki from 'lokijs';
import UserManager from '../src/modules/UserManager';

const db = new Loki('test/mock-users.json');
const users = () => db.getCollection('users');

describe('UserManager', () => {
  beforeEach((done) => {
    db.loadDatabase({}, () => {
      done();
    });
  });

  afterEach(() => {
    users().clear();
  });

  describe('#isUserAuthorized', () => {
    it('should return true for valid user', () => {
      users().insert({ username: 'valid_user', role: 'user' });

      const userMananger = new UserManager(users);
      const result = userMananger.isUserAuthorized({ username: 'valid_user' });
      expect(result).to.eq(true);
    });

    it('should return true for valid user without username', () => {
      users().insert({ id: 1385770801, role: 'user' });

      const userMananger = new UserManager(users);
      const result = userMananger.isUserAuthorized({ userId: 1385770801, username: 'valid_user' });
      expect(result).to.eq(true);
    });

    it('should return false for unregistered users', () => {
      const userManager = new UserManager(users);
      const result = userManager.isUserAuthorized({ username: 'unregistered', role: 'not registered' });
      expect(result).to.eq(false);
    });
  });

  describe('#upsertUser', () => {
    it('should add new user as registree', () => {
      const userManager = new UserManager(users);
      const action = userManager.upsertUser({ username: 'sweezharbot', first_name: 'Swee', last_name: 'Zhar Bo', id: 12345 });
      expect(action).to.eq('insert');
      expect(users().data.length).to.eq(1);
      expect(users().findOne(x => x.username === 'sweezharbot').role).to.eq('registree');
    });

    it('should add IDs for old users', () => {
      users().insert({ username: 'valid_user', userId: '' });

      const userManager = new UserManager(users);
      const action = userManager.upsertUser({ username: 'valid_user', id: 1234567 });
      expect(action).to.eq('update');
      expect(users().findOne({ username: 'valid_user' }).userId).to.eq(1234567);
    });

    it('should not insert new users', () => {
      users().insert({ username: 'valid_user', userId: 1234567 });

      const userManager = new UserManager(users);
      const action = userManager.upsertUser({ username: 'valid_user', id: 12345687 });
      expect(action).to.eq('');
      expect(users().data.length).to.eq(1);
    });
  });

  describe('#getUser', () => {
    beforeEach(() => {
      users().insert({ username: 'swee_zhar_bo1', userId: 1234561 });
      users().insert({ username: 'swee_zhar_bo2', userId: 1234562 });
      users().insert({ username: 'swee_zhar_bo3', userId: 1234563 });
    });

    it('should return user in database', () => {
      const userManager = new UserManager(users);
      const userInDB = userManager.getUser({ username: 'swee_zhar_bo2' });
      expect(userInDB.userId).to.eq(1234562);
    });

    it('should return empty if not in database', () => {
      const userManager = new UserManager(users);
      const userInDB = userManager.getUser({ username: 'bo_zhar_bor' });
      expect(userInDB).to.be.undefined;
    });
  });
});
