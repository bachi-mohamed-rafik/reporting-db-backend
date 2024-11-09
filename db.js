const { Pool } = require('pg');

const pool = new Pool({
  user: 'odoo',
  password: '$Rv@2022$$',
  host: '35.241.192.79',
  port: 5432, // default Postgres port
  database: 'prod'
});
// xyhXx6izjsFobMKl7jggzUUEe+0piVDc9uSpwy81BFw=
module.exports = {
  query: (text, params) => pool.query(text, params)
};

