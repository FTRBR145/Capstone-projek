const Transaction = require('../models/Transaction');

const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, description, transactionDate } = req.body;

    // Validate sufficient balance for outgoing transactions
    if (type === 'pengeluaran') {
      const summary = await Transaction.getSummary(req.user.id);
      if (amount > summary.saldo) {
        return res.status(400).json({
          success: false,
          message: 'Saldo tidak cukup untuk melakukan penarikan'
        });
      }
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      description,
      transactionDate
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil ditambahkan',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { type, month, startDate, endDate } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (month) filters.month = month;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const transactions = await Transaction.findByUser(req.user.id, filters);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const transaction = await Transaction.update(id, req.user.id, updates);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil diupdate',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Transaction.delete(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const { month } = req.query;
    const summary = await Transaction.getSummary(req.user.id, month);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyChart = async (req, res, next) => {
  try {
    const { year } = req.query;
    const chartData = await Transaction.getMonthlyChart(
      req.user.id, 
      year || new Date().getFullYear()
    );

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getMonthlyChart
};