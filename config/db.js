const Pool = require('pg').Pool;

// Heroku
const pool = new Pool({
  user: 'ktqpbkcxmwxqvw',
  password: 'fa50c0625e7a096b46a99ac93dfea543c0ab1d7adc22b36875e88c57e66159c4',
  host: 'ec2-54-166-167-192.compute-1.amazonaws.com',
  port: 5432,
  database: 'd1odmnl3r6hkct',
  ssl: { rejectUnauthorized: false },
});

// Local

// const pool = new Pool({
//   user: 'postgres',
//   password: 'foundermentality',
//   host: 'localhost',
//   port: 5432,
//   database: 'cerebro',
// });

module.exports = pool;
