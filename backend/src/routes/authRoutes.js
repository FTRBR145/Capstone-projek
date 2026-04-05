const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validate, authValidations } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  register,
  login,
  googleAuth,
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount
} = require('../controllers/authController');

// Public routes
router.post('/register', validate(authValidations.register), register);
router.post('/login', validate(authValidations.login), login);
router.post('/google', googleAuth);

// Protected routes
router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', deleteAvatar);
router.put('/password', changePassword);
router.delete('/account', deleteAccount);

module.exports = router;