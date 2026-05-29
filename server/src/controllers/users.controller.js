const bcrypt = require('bcryptjs')
const pool = require('../config/db')

async function getAll(req, res) {
  try {
    const result = await pool.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY name')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function getById(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [req.params.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function create(req, res) {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' })
  }

  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashed, role || 'user']
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está en uso' })
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function update(req, res) {
  const { name, email, role } = req.body

  try {
    const current = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role',
      [name ?? current.rows[0].name, email ?? current.rows[0].email, role ?? current.rows[0].role, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está en uso' })
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function remove(req, res) {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id])
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ message: 'Usuario eliminado' })
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function getUserAreas(req, res) {
  try {
    const result = await pool.query(`
      SELECT a.* FROM areas a
      JOIN user_areas ua ON a.id = ua.area_id
      WHERE ua.user_id = $1
      ORDER BY a.name
    `, [req.params.id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function assignArea(req, res) {
  const { area_id } = req.body
  if (!area_id) return res.status(400).json({ error: 'area_id es requerido' })

  try {
    await pool.query(
      'INSERT INTO user_areas (user_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, area_id]
    )
    res.json({ message: 'Área asignada' })
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function removeArea(req, res) {
  try {
    await pool.query(
      'DELETE FROM user_areas WHERE user_id = $1 AND area_id = $2',
      [req.params.id, req.params.areaId]
    )
    res.json({ message: 'Área removida' })
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { getAll, getById, create, update, remove, getUserAreas, assignArea, removeArea }
