# Butler Bot Changelog

## [unreleased]
## [0.1.6] - 15 Mar 2018
* Improve admin workflow to user management
* Update messages
## [0.1.5] - 7 Feb 2018
* Refactor Code
* Add new rooms for /book and /any

## [0.1.4] - 25nd July 2017
* Added Travis CI to run unit tests
* Extracted available room, duration, colour options and session settings to config file
* Minor bugfixes in de-conflicting recurring booking conflicts & delete booking

## [0.1.3] - 22nd May 2017

* Added extra error handling for listing event to handle random event data returned by google with undefined start and end time
* Removed room options that are no longer available for booking

## [0.1.2] - 4th April 2017

* Added Mocha; Started writing unit tests
* Parses and handles recurring bookings during booking checks and slot availability checks made through google calendar
* /booked now able to shows latest upcoming booking occurrence for recurring bookings
* Removed unused Redis for simplicity

## [0.1.1] - 13th February 2017
### Added
* Added /any command for easy booking of any room available at given date & time
* Supports semi-natural language input for datetime selection for /any
* Added function to list available duration till next booking @shekyh/@yuhong90
* Improved navigation interaction between each booking step @edisonchee
* Changed booking format - from 0.5hr slots to user-defined start time and duration @shekyh/@yuhong90
* Added booking session and timeout functionality @shekyh/@yuhong90
* Added booking queue system @shekyh/@yuhong90
* Changed voice and tone of bot i.e. add character and use singlish @edisonchee

## [0.1.0] - 1st August 2016
### Added
* Basic booking interaction via Telegram Bot (Today, current month)
* Integration with Google Calendar


