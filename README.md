gjcomps [![Build Status](https://travis-ci.org/jfly/gjcomps.png?branch=master)](https://travis-ci.org/jfly/gjcomps)
=======

## Setup
- `curl https://install.meteor.com/ | sh` - Install [Meteor](https://www.meteor.com/)
- Install nodejs.
- `(cd tests; npm install)` - Install linting tools and setup pre-commit hook.

## To run
- `meteor`
- [http://localhost:3000/organizer](http://localhost:3000/organizer), log in as 2011SELZ01/1990-01-02

## To lint
- `(cd tests; npm run-script lint)`

## Third party stuff
- `(cd client/components/; wget http://twitter.github.io/typeahead.js/releases/latest/typeahead.bundle.js)`
- `(cd css/; wget https://raw.githubusercontent.com/bassjobsen/typeahead.js-bootstrap-css/master/typeaheadjs.css)`

- `(cd client/components/; wget https://github.com/arshaw/fullcalendar/raw/master/dist/fullcalendar.js)`
- `(cd css/; wget https://github.com/arshaw/fullcalendar/raw/master/dist/fullcalendar.css)`

- `(cd client/components; wget https://raw.githubusercontent.com/jonthornton/jquery-timepicker/master/jquery.timepicker.js)`
- `(cd css/; wget https://raw.githubusercontent.com/jonthornton/jquery-timepicker/master/jquery.timepicker.css)`
- `(cd client/components; wget https://raw.githubusercontent.com/jonthornton/Datepair.js/master/dist/datepair.js)`
