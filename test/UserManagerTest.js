import { expect } from 'chai';
import Loki from 'lokijs';
import UserManager from '../src/modules/UserManager';

const db = new Loki('test/mock-users.json');

describe('UserManager', () => {
  beforeEach((done) => {
    db.loadDatabase({}, () => {
      done();
    });
  });

  describe('#checkAuthorizedUsers', () => {
    it('should return true', () => {
      const userMananger = new UserManager(db);
      
      const result = userMananger.checkAuthorisedUsers({ username: 'false' });
      expect(result).to.eq(false);
    });
  });
});
