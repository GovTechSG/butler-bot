import * as ParamBuilder from '../src/modules/ParamBuilder';
let chai = require('chai');
let expect = chai.expect;

describe('ParamBuilder', () => {

	describe('constructTimeslotOptions', () => {
		it('should return full list telegram keyboard paramOptions when allTimeslots available', () => {
			let expectedResult =
				[[{
					text: '8:00 AM',
					callback_data: '{"date":"18/4/2017","time":"8:00 AM","room":"bb"}'
				},
				{
					text: '8:30 AM',
					callback_data: '{"date":"18/4/2017","time":"8:30 AM","room":"bb"}'
				}],
				[{
					text: '9:00 AM',
					callback_data: '{"date":"18/4/2017","time":"9:00 AM","room":"bb"}'
				},
				{
					text: '9:30 AM',
					callback_data: '{"date":"18/4/2017","time":"9:30 AM","room":"bb"}'
				}],
				[{ text: '<<Back', callback_data: '{"room":"bb"}' }]];

			let availTimeslots = {
				'8:00 AM': '8:00 AM',
				'8:30 AM': '8:30 AM',
				'9:00 AM': '9:00 AM',
				'9:30 AM': '9:30 AM'
			};
			let room = 'bb';
			let date = new Date().setDateWithSimpleFormat('18/4/2017');
			let result = ParamBuilder.constructTimeslotOptions(availTimeslots, room, date);
			expect(result).to.eql(expectedResult);
		});

		it('should return all except 530pm - 630pm telegram keyboard paramOptions when allTimeslots except 530pm - 630pm available', () => {
			let expectedResult =
				[[{
					text: 'left',
					callback_data: '{"date":"18/4/2017","time":"left","room":"fgd"}'
				},
				{
					text: 'right',
					callback_data: '{"date":"18/4/2017","time":"right","room":"fgd"}'
				}],
				[{
					text: 'left2',
					callback_data: '{"date":"18/4/2017","time":"left2","room":"fgd"}'
				}],
				[{ text: '<<Back', callback_data: '{"room":"fgd"}' }]];

			let availTimeslots = {
				'left': 'left',
				'right': 'right',
				'left2': 'left2'
			};
			let room = 'fgd';
			let date = new Date().setDateWithSimpleFormat('18/4/2017');
			let result = ParamBuilder.constructTimeslotOptions(availTimeslots, room, date);
			expect(result).to.eql(expectedResult);
		});

		it('should return only back button as paramOptions when allTimeslots are not available', () => {
			let expectedResult =
				[[{ text: '<<Back', callback_data: '{"room":"fgd"}' }]];

			let availTimeslots = {};
			let room = 'fgd';
			let date = new Date().setDateWithSimpleFormat('18/4/2017');
			let result = ParamBuilder.constructTimeslotOptions(availTimeslots, room, date);
			expect(result).to.eql(expectedResult);
		});
	});

	describe('constructRoomOptions', () => {
		it('should return correct room options text and callback_data for 4 rooms', () => {
			let expectedResult = [
				[
					{ text: 'Focus Group Room', callback_data: '{"room":"fg"}' },
					{ text: 'Queen (Video)', callback_data: '{"room":"q1"}' }],
				[
					{ text: 'Queen (Projector)', callback_data: '{"room":"q2"}' },
					{ text: 'Queen Room Combined', callback_data: '{"room":"qc"}' }
				]
			];

			let roomConfig = {
				'fg': { 'command': '/book_fgd', 'text': 'Focus Group Room' },
				'q1': { 'command': '/book_queen_video', 'text': 'Queen (Video)' },
				'q2': { 'command': '/book_queen_projector', 'text': 'Queen (Projector)' },
				'qc': { 'command': '/book_queen_combined', 'text': 'Queen Room Combined' }
			};
			let result = ParamBuilder.constructRoomOptions(roomConfig);
			expect(result).to.eql(expectedResult);
		});
		it('should return correct room order for 5 rooms', () => {
			let expectedResult = [
				[
					{ text: 'A', callback_data: '{"room":"a"}' },
					{ text: 'B', callback_data: '{"room":"b"}' }],
				[
					{ text: 'C', callback_data: '{"room":"c"}' },
					{ text: 'D', callback_data: '{"room":"d"}' }
				],
				[
					{ text: 'E', callback_data: '{"room":"e"}' }
				]
			];
			let configRoomOption = {
				'a': { 'command': '/a', 'text': 'A' },
				'b': { 'command': '/b', 'text': 'B' },
				'c': { 'command': '/c', 'text': 'C' },
				'd': { 'command': '/d', 'text': 'D' },
				'e': { 'command': '/e', 'text': 'E' }
			};
			let result = ParamBuilder.constructRoomOptions(configRoomOption);
			expect(result).to.eql(expectedResult);
		});
	});
});
