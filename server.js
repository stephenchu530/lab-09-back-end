'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// API ROUTES
app.get('/location', (req, res) => getRoute(req, res, 'locations'));
app.get('/weather', (req, res) => getRoute(req, res, 'weathers'));
/*
app.get('/events', (req, res) => getRoute(req, res, 'events'));
app.get('/movies', getData);
app.get('/yelp', getData);
*/

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));


//MODELS
const Location = function(query, location) {
  this.tableName = 'locations';
  this.search_query = query;
  this.formatted_query = location.results[0].formatted_address;
  this.latitude = location.results[0].geometry.location.lat;
  this.longitude = location.results[0].geometry.location.lng;
};

const Weather = function(day) {
  this.tableName = 'weathers';
  this.forecast = day.summary
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
  this.created_at = Date.now();
};

const Event = function (event) {
  this.tableName = 'events';
  this.link = event.url;
  this.name = event.name.text;
  this.event_date = new Date(event.start.local).toString().slice(0, 15);
  this.summary = event.summary;
  this.created_at = Date.now();
}


// MODEL SPECIFIC STRINGS, DATA, CONSTANTS, AND OTHER THINGS
const model = {
  url: {
    'locations': (query) => `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`,
    'weathers': (query) => `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${query.latitude},${query.longitude}`,
    'events': (query) => `https://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENTBRITE_API_KEY}&location.address=${query.formatted_query}`
  },
  convertAPIResult: {
    'locations': (resultFromAPICall) => resultFromAPICall.body,
    'weathers': (resultFromAPICall) => resultFromAPICall.body.daily.data,
    'events': (resultFromAPICall) => resultFromAPICall.body.events
  },
  construct: {
    'locations': Location,
    'weathers': Weather,
    'events': Event
  },
  insertQuery: {
    'locations': ` (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id;`,
    'weathers': ` (forecast, time, created_at, location_id) VALUES ($1, $2, $3, $4);`,
    'events': ` (link, name, event_date, summary, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6);`
  },
  insertValues: {
    'locations': (obj) => [obj.search_query, obj.formatted_query, obj.latitude, obj.longitude],
    'weathers': (obj) => [obj.forecast, obj.time, obj.created_at, obj.location_id],
    'events': (obj) => [obj.link, obj.name, obj.event_date, obj.summary, obj.created_at, obj.location_id]
  },
  timeouts: {
    'locations': 15 * 1000,
    'weathers': 15 * 1000,
    'events': 15 * 1000
  }
};


// Error Handler
const errorHandler = function(err, response) {
  const errorMessage = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  console.log(err);
  response.send(errorMessage);
};


// Make the API call
const makeAPICall = function(url, query, request, response, route) {
  return superagent.get(url)
    .then(result => {
      const insertQuery = `INSERT INTO ${route}` + model.insertQuery[route];
      const data = model.convertAPIResult[route](result);
      const Constructor = model.construct[route];
      let parsedResult;
      let insertValues;

      if (route === 'locations') {
        parsedResult = new Constructor(query, data);
        insertValues = model.insertValues[route](parsedResult);
        response.send(client.query(insertQuery, insertValues)
          .then(result => {
            parsedResult.id = result.rows[0].id;
            return parsedResult;
          }));
      } else {
        response.send(parsedResult = data.map(entry => {
          const entryObj = new Constructor(entry);
          insertValues = model.insertValues[route](entryObj);
          entryObj.id = request.query.data.id;
          client.query(insertQuery, insertValues);
        }));
      }
    })
    .catch(err => errorHandler(err, response));
};


// Generic get route function
const getRoute = function(request, response, route) {
  const query = request.query.data;
  const url = model.url[route](query);

  makeAPICall(url, query, request, response, route);
};
