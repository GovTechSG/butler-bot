# Butler Bot

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
* Update command list with BotFather

## Done

* Store room bookings with google calendar
* /book or @swee_zhar_bot command to initiate room booking
* /help command for instructions
* /booked command to check user's upcoming bookings
* /exit command to terminate current booking process
* /delete command to mirror /booked command with delete link
* Booking Session timeout after being inactive
* Html calendar page to display all calendar bookings
* /view command for to show link for calendar listing
