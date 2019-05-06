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
app.get('/events', (req, res) => getRoute(req, res, 'events'));
app.get('/movies', (req, res) => getRoute(req, res, 'movies'));
app.get('/yelp', (req, res) => getRoute(req, res, 'yelps'));

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));


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
  let access = {};
  if (route === 'yelps') {
    access = {'Authorization': `Bearer ${process.env.YELP_API_KEY}`};
  }
  return superagent.get(url)
    .set(access)
    .then(result => {
      const data = model.convertAPIResult[route](result);
      let output;
      if (route === 'locations') {
        output = new model.construct[route](data, query);
      } else {
        output = data.map(entry => new model.construct[route](entry));
      }
      response.send(output);
      return output;
    })
    .catch(err => errorHandler(err, response));
};

// Generic get route function
const getRoute = function(request, response, route) {
  const query = request.query.data;
  const url = model.url[route](query);

  makeAPICall(url, query, request, response, route)
    .then(result => {
      // Place holder
    });
};


//MODELS
const Location = function(location, query) {
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
};

const Movie = function(movie) {
  this.tableName = 'movies';
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w185_and_h278_bestv2${movie.poster_path}`
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
  this.created_at = Date.now();
};

const Yelp = function(yelp) {
  this.tableName = 'yelps';
  this.name = yelp.name;
  this.image_url = yelp.image_url;
  this.price = yelp.price;
  this.rating = yelp.rating;
  this.url = yelp.url;
  this.created_at = Date.now();
};


// MODEL SPECIFIC STRINGS, DATA, CONSTANTS, AND OTHER THINGS
const model = {
  url: {
    'locations': (query) => `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`,
    'weathers': (query) => `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${query.latitude},${query.longitude}`,
    'events': (query) => `https://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENTBRITE_API_KEY}&location.address=${query.formatted_query}`,
    'movies': (query) => `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${query.search_query}`,
    'yelps': (query) => `https://api.yelp.com/v3/businesses/search?location=${query.search_query}`
  },
  convertAPIResult: {
    'locations': (resultFromAPICall) => resultFromAPICall.body,
    'weathers': (resultFromAPICall) => resultFromAPICall.body.daily.data,
    'events': (resultFromAPICall) => resultFromAPICall.body.events,
    'movies': (resultFromAPICall) => resultFromAPICall.body.results,
    'yelps': (resultFromAPICall) => resultFromAPICall.body.businesses
  },
  construct: {
    'locations': Location,
    'weathers': Weather,
    'events': Event,
    'movies': Movie,
    'yelps': Yelp
  },
  insertQuery: {
    'locations': ` (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id;`,
    'weathers': ` (forecast, time, created_at, location_id) VALUES ($1, $2, $3, $4);`,
    'events': ` (link, name, event_date, summary, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6);`,
    'movies': ` (title, overview, average_votes, total_votes, image_url, popularity, released_on, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
    'yelps': ` (name, image_url, price, rating, url, created_at, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7);`
  },
  insertValues: {
    'locations': (obj) => [obj.search_query, obj.formatted_query, obj.latitude, obj.longitude],
    'weathers': (obj) => [obj.forecast, obj.time, obj.created_at, obj.location_id],
    'events': (obj) => [obj.link, obj.name, obj.event_date, obj.summary, obj.created_at, obj.location_id],
    'movies': (obj) => [obj.title, obj.overview, obj.average_votes, obj.total_votes, obj.image_url, obj.popularity, this.released_on, obj.created_at, obj.location_id],
    'yelps': (ob) => [obj.name, obj.image_url, obj.price, obj.rating, obj.url, obj.created_at, obj.location_id]
  },
  timeouts: {
    'locations': 15 * 1000,
    'weathers': 15 * 1000,
    'events': 15 * 1000,
    'movies': 15 * 1000,
    'yelps': 15 * 1000
  }
};
