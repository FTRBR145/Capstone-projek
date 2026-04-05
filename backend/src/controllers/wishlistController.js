const Wishlist = require('../models/Wishlist');

const createWishlist = async (req, res, next) => {
  try {
    const { name, targetAmount, savedAmount } = req.body;

    const wishlist = await Wishlist.create({
      userId: req.user.id,
      name,
      targetAmount,
      savedAmount: savedAmount || 0
    });

    res.status(201).json({
      success: true,
      message: 'Wishlist berhasil ditambahkan',
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

const getWishlists = async (req, res, next) => {
  try {
    const { search } = req.query;
    const wishlists = await Wishlist.findByUser(req.user.id, search);

    res.json({
      success: true,
      data: wishlists
    });
  } catch (error) {
    next(error);
  }
};

const updateWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating with an empty payload
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data update tidak boleh kosong'
      });
    }

    const wishlist = await Wishlist.update(id, req.user.id, updates);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Wishlist berhasil diupdate',
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

const deleteWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Wishlist.delete(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Wishlist berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

const getProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const progress = await Wishlist.getProgress(id, req.user.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await Wishlist.getSummary(req.user.id);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWishlist,
  getWishlists,
  updateWishlist,
  deleteWishlist,
  getProgress,
  getSummary
};