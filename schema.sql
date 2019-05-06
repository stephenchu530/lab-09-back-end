/*
  The sql schema has to pretty much be on point and will look 'highly'
  similar to many other schemas for this project. The base schema.sql
  was taken from Course 301 instructor: Michelle Ferreirae.

  The source of Michelle's schema.sql is:
  https://github.com/codefellows/seattle-301d56/blob/master/class-09/demo/data/schema.sql
*/

-- Drop all tables to start a clean slate
DROP TABLE IF EXISTS weathers, yelps, movies, trails, events;
DROP TABLE IF EXISTS locations;

-- Create the tables
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC,
    longitude NUMERIC
  );

CREATE TABLE weathers (
    id SERIAL PRIMARY KEY,
    forecast VARCHAR(255),
    time VARCHAR(255),
    created_at VARCHAR(255),
    location_id INTEGER NOT NULL REFERENCES locations(id)
  );

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  link VARCHAR(255),
  name VARCHAR(255),
  summary VARCHAR(1000),
  event_date CHAR(15),
  created_at VARCHAR(255),
  location_id INTEGER NOT NULL REFERENCES locations(id)
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  overview VARCHAR(1000),
  average_votes NUMERIC,
  total_votes NUMERIC,
  image_url VARCHAR(255),
  popularity NUMERIC,
  released_on CHAR(10),
  created_at VARCHAR(255),
  location_id INTEGER NOT NULL REFERENCES locations(id)
);

CREATE TABLE yelps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  image_url VARCHAR(255),
  price CHAR(5),
  rating NUMERIC,
  url VARCHAR(255),
  created_at VARCHAR(255),
  location_id INTEGER NOT NULL REFERENCES locations(id)
);
