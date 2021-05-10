const { google } = require('googleapis');
const cal = google.calendar({
  version: 'v3',
  auth: 'AIzaSyA_VaJkqoIbHWjoaF73mJSlnvxKvW-wlho',
});
const calendar = 'daraladje@gmail.com';
// Set beginning of query to 3 pm tomorrow
const now = new Date();

// Make the query
cal.freebusy
  .query({
    resource: {
      // Set times to ISO strings as such
      timeMin: now.toISOString(),
      timeMax: new Date(now.getTime() + 30 * 60000).toISOString(),
      timeZone: 'PST',
      items: [{ id: calendar }],
    },
  })
  .then((result) => {
    const busy = result.data.calendars[calendar].busy;
    const errors = result.data.calendars[calendar].errors;
    if (undefined !== errors) {
      console.error(errors);
    } else if (busy.length !== 0) {
      console.log('Busy');
    } else {
      console.log('Free');
    }
  })
  .catch((e) => {
    console.error(e);
  });
