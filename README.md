# Butler Bot

A Telegram Bot that helps you book meetings rooms. Awesome!

## Getting Started
Grab dependencies
```javascript
npm i
```

Run your own Redis Server
``` bash
# if you have docker installed
docker run -p '6379:6379' redis
```

Run the bot
```javascript
npm start
```

## Configuration
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

## Todo

* Booking insert job queue improvement
* Authenticate to only allow hive users to book (temporary workaround for now)

## V0.1.2

* Supports recurring bookings made through google calendar
* /booked now shows your latest upcoming booking occurrence for recurring bookings

## V0.1.1

* Store room bookings with google calendar
* /book or @swee_zhar_bot command to initiate room booking
* /help command for instructions
* /booked command to check user's upcoming bookings
* /exit command to terminate current booking process
* /delete command to mirror /booked command with delete link
* Booking Session timeout after being inactive
* Html calendar page to display all calendar bookings
* /view command for to show link for calendar listing
* /any command for easy booking of any meeting room at given date & time
