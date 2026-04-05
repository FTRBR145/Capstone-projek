const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ name, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return this.findById(result.insertId);
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, updates) {
    const allowedUpdates = ['name', 'avatar'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0 ? this.findById(id) : null;
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async findByGoogleId(googleId) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar, google_id, created_at FROM users WHERE google_id = ?',
      [googleId]
    );
    return rows[0];
  }

  static async createGoogleUser({ googleId, name, email, avatar }) {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, avatar, google_id) VALUES (?, ?, NULL, ?, ?)',
      [name, email, avatar || null, googleId]
    );
    return this.findById(result.insertId);
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;