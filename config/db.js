const Pool = require('pg').Pool;

const pool = new Pool({
  connectionString:
    'postgresql://ktqpbkcxmwxqvw:$fa50c0625e7a096b46a99ac93dfea543c0ab1d7adc22b36875e88c57e66159c4@ec2-54-166-167-192.compute-1.amazonaws.com:5432/d1odmnl3r6hkct',
  ssl: true,
});

module.exports = pool;
