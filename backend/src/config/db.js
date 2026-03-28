const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

const testConnection = async () => {
  try {
    const { rows } = await query('SELECT NOW() AS now');
    logger.info(`Database connected at ${rows[0].now}`);
  } catch (err) {
    logger.error('Database connection failed', { error: err.message });
    process.exit(1);
  }
};

module.exports = { query, getClient, testConnection };
