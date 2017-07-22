import { expect } from 'chai';
import sinon from 'sinon';
import SessionManagement from '../src/modules/SessionManagement';

let SessionMgr = new SessionManagement();

describe('SessionManagement', () => {
	describe('startSessionCountdown', () => {
		let stub;
		afterEach(() => {
			stub.restore();
		});
		it('should return activeUserList with new user added on session start', () => {
			let testInput = { chatId: 1, messageId: 10, username: 'user' };
			let mockTimer = { timer: 'ticktock' };

			stub = sinon.stub(SessionMgr, 'terminateSession').returns();
			stub = sinon.stub(SessionMgr, 'setCountdownTimer').returns(mockTimer);

			let expectedActiveUsers = {};
			expectedActiveUsers[testInput.chatId] = {
				userChatId: testInput.chatId,
				msgId: testInput.messageId,
				username: testInput.username,
				timer: mockTimer
			};

			let results = SessionMgr.startSessionCountdown(testInput.chatId, testInput.messageId, testInput.username);
			expect(results).to.eql(expectedActiveUsers);
		});

	});
});

