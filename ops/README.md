# Ops

This directory contains ops scripts used to manage room changes / update configurations.

## Adding / Removing rooms for booking

1. Create / remove google calendar with admin google account (with doris / viviean)
2. For new calendars, make cal available to public & grant access to gcal service account `calender-api-service@gds-room-booking-calendar.iam.gserviceaccount.com`
3. Run `npm run update:calendar-config` to fetch gcal config, generate updated room booking option config and generate updated bookings view page for deployment.
