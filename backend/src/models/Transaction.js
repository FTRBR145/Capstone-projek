const { pool } = require('../config/database');

class Transaction {
  static async create({ userId, type, amount, description, transactionDate }) {
    const [result] = await pool.execute(
      `INSERT INTO transactions (user_id, type, amount, description, transaction_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, amount, description, transactionDate]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByUser(userId, filters = {}) {
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.month) {
      query += ' AND DATE_FORMAT(transaction_date, "%Y-%m") = ?';
      params.push(filters.month);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND transaction_date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    query += ' ORDER BY transaction_date DESC, created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedUpdates = ['amount', 'description', 'transaction_date'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      let dbKey = key;
      if (key === 'transactionDate') dbKey = 'transaction_date';

      if (allowedUpdates.includes(dbKey) && value !== undefined) {
        fields.push(`${dbKey} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    values.push(id, userId);
    const [result] = await pool.execute(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return result.affectedRows > 0 ? this.findById(id) : null;
  }

  static async delete(id, userId) {
    const [result] = await pool.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  static async getSummary(userId, month = null) {
    let query = `
      SELECT 
        type,
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount
      FROM transactions
      WHERE user_id = ?
    `;
    const params = [userId];

    if (month) {
      query += ' AND DATE_FORMAT(transaction_date, "%Y-%m") = ?';
      params.push(month);
    }

    query += ' GROUP BY type';

    const [rows] = await pool.execute(query, params);
    
    const summary = {
      pemasukan: 0,
      pengeluaran: 0,
      total_transactions_pemasukan: 0,
      total_transactions_pengeluaran: 0
    };

    rows.forEach(row => {
      if (row.type === 'pemasukan') {
        summary.pemasukan = parseInt(row.total_amount);
        summary.total_transactions_pemasukan = row.total_transactions;
      } else {
        summary.pengeluaran = parseInt(row.total_amount);
        summary.total_transactions_pengeluaran = row.total_transactions;
      }
    });

    summary.saldo = summary.pemasukan - summary.pengeluaran;
    return summary;
  }

  static async getMonthlyChart(userId, year = new Date().getFullYear()) {
    const [rows] = await pool.execute(
      `SELECT 
        MONTH(transaction_date) as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = ? AND YEAR(transaction_date) = ?
      GROUP BY MONTH(transaction_date), type
      ORDER BY month ASC`,
      [userId, year]
    );

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const chartData = {
      pemasukan: months.map((month, index) => ({
        month,
        amount: 0
      })),
      pengeluaran: months.map((month, index) => ({
        month,
        amount: 0
      }))
    };

    rows.forEach(row => {
      const monthIndex = row.month - 1;
      if (row.type === 'pemasukan') {
        chartData.pemasukan[monthIndex].amount = parseInt(row.total);
      } else {
        chartData.pengeluaran[monthIndex].amount = parseInt(row.total);
      }
    });

    return chartData;
  }
}

module.exports = Transaction;