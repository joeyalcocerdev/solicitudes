const express = require('express')
const { Pool } = require('pg')

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS counter (
      id SERIAL PRIMARY KEY,
      visits INTEGER DEFAULT 0
    )
  `)
  await pool.query(`
    INSERT INTO counter (id, visits)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `)
}

app.get('/', async (req, res) => {
  await pool.query('UPDATE counter SET visits = visits + 1 WHERE id = 1')
  const { rows } = await pool.query('SELECT visits FROM counter WHERE id = 1')
  res.send(`<h1>Visitas: ${rows[0].visits}</h1>`)
})

init().then(() => {
  app.listen(3000, () => console.log('App corriendo en puerto 3000'))
})