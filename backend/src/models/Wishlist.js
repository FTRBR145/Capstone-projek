const { pool } = require('../config/database');

class Wishlist {
  static async create({ userId, name, targetAmount, savedAmount = 0 }) {
    const [result] = await pool.execute(
      `INSERT INTO wishlists (user_id, name, target_amount, saved_amount) 
       VALUES (?, ?, ?, ?)`,
      [userId, name, targetAmount, savedAmount]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM wishlists WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByUser(userId, search = '') {
    let query = 'SELECT * FROM wishlists WHERE user_id = ?';
    const params = [userId];

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(id, userId, updates) {
  try {
    const allowedUpdates = ['name', 'target_amount', 'saved_amount'];
    const fields = [];
    const values = [];

    // Convert to snake_case
    for (const [key, value] of Object.entries(updates)) {
      let dbKey = key;
      
      if (key === 'targetAmount') dbKey = 'target_amount';
      if (key === 'savedAmount') dbKey = 'saved_amount';
      if (key === 'name') dbKey = 'name';
      
      if (allowedUpdates.includes(dbKey) && value !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id, userId);
    const query = `UPDATE wishlists SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return null;
    }

    const updated = await this.findById(id);
    
    return updated;
  } catch (error) {
    throw error;
  }
}

  static async delete(id, userId) {
    const [result] = await pool.execute(
      'DELETE FROM wishlists WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  static async getProgress(id, userId) {
    const [rows] = await pool.execute(
      `SELECT 
        name,
        target_amount,
        saved_amount,
        ROUND((saved_amount / target_amount) * 100, 2) as progress_percentage
      FROM wishlists
      WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return rows[0];
  }

  static async getSummary(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as total_items,
        SUM(target_amount) as total_target,
        SUM(saved_amount) as total_saved,
        AVG((saved_amount / target_amount) * 100) as average_progress
      FROM wishlists
      WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }
}

module.exports = Wishlist;