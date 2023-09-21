CREATE DATABASE budget_api;

\c budget_api

CREATE TABLE envelopes (
  id SERIAL PRIMARY KEY,
  category varchar(20) UNIQUE NOT NULL,
  allotment integer NOT NULL
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  date varchar(57),
  payment decimal,
  shop varchar(20),
  envelope_id integer REFERENCES envelopes(id)
);

CREATE TABLE variables (
  name varhcar(20),
  value decimal
);
