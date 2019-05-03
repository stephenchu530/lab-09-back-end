/*
  Source code author: Michelle Ferreirae
  URL: https://github.com/codefellows/seattle-301d56/blob/master/class-09/demo/data/schema.sql
*/

DROP TABLE IF EXISTS weathers, yelps, movies, trails, locations;

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
  );

CREATE TABLE IF NOT EXISTS weathers (
    id SERIAL PRIMARY KEY,
    forecast VARCHAR(255),
    time VARCHAR(255),
    location_id INTEGER NOT NULL REFERENCES locations(id)
  );

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  link VARCHAR(255),
  name VARCHAR(255),
  summary VARCHAR(1000),
  event_date CHAR(15),
  location_id INTEGER NOT NULL REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  overview VARCHAR(1000),
  average_votes NUMERIC(10, 7),
  image_url VARCHAR(255),
  popularity NUMERIC(10, 7),
  released_on CHAR(10),
  location_id INTEGER NOT NULL REFERENCES locations(id)
);
