const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'postgres',
  password: 'foundermentality',
  host: 'localhost',
  port: 5432,
  database: 'cerebro',
});

module.exports = pool;
