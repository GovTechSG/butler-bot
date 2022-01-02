const fs = require('fs');
const mustache = require('mustache');
const jsdom = require('jsdom');
const calConfig = require('../generated/calendar-config.json');

const TEMPLATE_LOCATION = './src/view-template.html';
const OUTPUT_FILE_LOCATION = './generated/view-calendar.html';
const { JSDOM } = jsdom;

// This generates calendar view html page based on calendar config

function generatePageWidgets(calendarConfig) {
    let widgets = [];
    calendarConfig.forEach((cal) => {
        const calendarId = cal.calendarId;
        const roomName = cal.displayName;
        const roomLocation = cal.location;

        const calWidget = `<!--[${roomLocation}]${roomName}-->
        <iframe src="https://calendar.google.com/calendar/embed?showNav=0&amp;showPrint=0&amp;showTabs=0&amp;showCalendars=0&amp;showTz=0&amp;mode=AGENDA&amp;height=400&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;ctz=Asia%2FSingapore&amp;src=${calendarId}&amp;" style="border-width:0" width="400" height="400" frameborder="0" scrolling="no"></iframe>`;
        widgets.push(calWidget);
    });
    return widgets;
}

function generatePage() {
    console.log('[Generate View Page]');
    console.log('Reading html template file', TEMPLATE_LOCATION);
    JSDOM.fromFile(TEMPLATE_LOCATION, {
        contentType: 'text/html'
    }).then((dom) => {
        const htmlPage = dom.serialize();
        console.log('Generate cal widgets from cal config');
        const calWidget = generatePageWidgets(calConfig);
        const renderedPage = mustache.render(htmlPage, { widgets: calWidget.join('\n\t') });

        console.log('Generate calendar view html page');
        fs.writeFileSync(OUTPUT_FILE_LOCATION, renderedPage);
    });
}
generatePage();
