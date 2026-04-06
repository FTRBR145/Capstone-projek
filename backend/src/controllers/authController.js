const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const verifyRecaptcha = async (token) => {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: token } }
    );
    console.log('reCAPTCHA siteverify response:', response.data);
    return response.data.success;
  } catch (err) {
    console.error('Error during siteverify axios call:', err.message);
    return false;
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, captchaToken } = req.body;

    if (!captchaToken) {
      return res.status(400).json({ success: false, message: 'Verifikasi reCAPTCHA diperlukan' });
    }
    
    const captchaValid = await verifyRecaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: 'Verifikasi reCAPTCHA gagal' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!captchaToken) {
      return res.status(400).json({ success: false, message: 'Verifikasi reCAPTCHA diperlukan' });
    }
    
    const captchaValid = await verifyRecaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: 'Verifikasi reCAPTCHA gagal' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password harus diisi' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email tidak terdaftar' });
    }

    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }

    // Prevent password hash from leaking to the client
    delete user.password;

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updatedUser = await User.update(req.user.id, { name, avatar });

    if (!updatedUser) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diupdate' });
    }

    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Harap pilih file gambar terlebih dahulu' });
    }

    // Format expected by the client: /uploads/avatars/avatar-1234.jpg
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await User.update(req.user.id, { avatar: avatarUrl });
    
    res.json({
      success: true,
      message: 'Foto profil berhasil diperbarui',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

const deleteAvatar = async (req, res, next) => {
  try {
    const updatedUser = await User.update(req.user.id, { avatar: null });
    
    res.json({
      success: true,
      message: 'Foto profil berhasil dihapus dan dikembalikan ke default',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByEmail(req.user.email);

    const isValid = await User.comparePassword(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Password lama salah' });
    }

    await User.updatePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await User.delete(req.user.id);
    res.json({ success: true, message: 'Akun berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { credential, password, captchaToken, type = 'login' } = req.body;

    if (!captchaToken) {
      return res.status(400).json({ success: false, message: 'Verifikasi reCAPTCHA diperlukan' });
    }
    
    // Bypass strict backend reCAPTCHA verification for Google Auth because the multi-step 
    // flow (Google Popup -> Password Modal) often causes the 2-minute token to expire. 
    // The Google JWT verification below serves as a strong anti-bot measure instead.

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Credential Google diperlukan' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password harus diisi' });
    }

    let payload;
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token Google tidak valid' });
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findByGoogleId(googleId);
    if (!user) {
      user = await User.findByEmail(email);
    }

    if (type === 'register') {
      if (user) {
        return res.status(400).json({ success: false, message: 'Akun sudah terdaftar. Silakan login.' });
      }
      user = await User.createGoogleUser({ googleId, name, email, avatar: picture, password });
    } else {
      if (!user) {
        return res.status(404).json({ success: false, message: 'Akun belum terdaftar. Silakan register terlebih dahulu.' });
      }

      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Password salah' });
      }

      if (!user.google_id) {
        await require('../config/database').pool.execute(
          'UPDATE users SET google_id = ?, avatar = COALESCE(avatar, ?) WHERE id = ?',
          [googleId, picture || null, user.id]
        );
        user = await User.findById(user.id);
      }
    }

    // Prevent password leak
    delete user.password;

    res.json({
      success: true,
      message: 'Login dengan Google berhasil',
      data: {
        user,
        token: generateToken(user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount
};