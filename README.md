# Butler Bot
[![Build Status](https://travis-ci.org/GovTechSG/butler-bot.svg?branch=master)](https://travis-ci.org/GovTechSG/butler-bot)
[![Known Vulnerabilities](https://snyk.io/test/github/GovTechSG/butler-bot/badge.svg)](https://snyk.io/test/github/GovTechSG/butler-bot)

A Telegram Bot that helps you book meetings rooms. Awesome!

## Getting Started
Grab dependencies
```javascript
npm i
```

Run the bot
```javascript
npm start
```

Running tests (After you have setup the env vars)
```javascript
npm test
```

## Configuration
* [Setup & grant permission to test google calendar, service account and get auth key](https://github.com/yuhong90/node-google-calendar/wiki#setup-service-accounts)
* Setup test telegram bot and [get bot token](https://core.telegram.org/bots#6-botfather)
* Copy [.sample-env](.sample-env) to `.env` and replace with your own env variables
* Add sample users data in [sample-users.js](src/data/sample-users.js)

## Contributing

Easy as 1-2-3:
* Step 1: Branch off from ```develop``` and work on your feature or hotfix.
* Step 2: Update the changelog.
* Step 3: Create a pull request when you're done.

References:
* [Git branching strategy](http://nvie.com/posts/a-successful-git-branching-model/)
* [Keeping a changelog](http://keepachangelog.com/)
* [Semver](http://semver.org/)

Report a bug [here](https://github.com/GovTechSG/butler-bot/issues).

## Todo
* [Feature] Quick command to check available rooms in the next coming x hour
* [Improvement] Improve /any booking flow
* [Feature] Users to state meeting participants and auto send email meeting invites 
* [Improvement] Booking insert job queue improvement
* [Improvement] Authenticate to only allow hive users to book (temporary workaround for now)   
* [Feature] Improve admin workflow to user management
* [Improvement] Break logs into mutiple streams/ files 
* [Improvement] Clean up code    

## Releases

### V0.1.4
* Bug fixes in handling erroneous cancelled events from google calendar during room selection 
* Minor bug fixes in de-conflicting recurring booking conflicts & delete booking
### V0.1.3

* Removed room options that are no longer available for booking
* Minor bug fixes

### V0.1.2

* Supports recurring bookings made through google calendar
* /booked now shows your latest upcoming booking occurrence for recurring bookings

### V0.1.1

* Store room bookings with google calendar
* /book command to initiate room booking
* /help command for instructions
* /booked command to check user's upcoming bookings
* /exit command to terminate current booking process
* /delete command to mirror /booked command with delete link
* Booking Session timeout after being inactive
* Html calendar page to display all calendar bookings
* /view command for to show link for calendar listing
* /any command for easy booking of any meeting room at given date & time

