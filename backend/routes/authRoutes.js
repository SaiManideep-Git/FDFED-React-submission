const express = require('express');
const router = express.Router();
const { signup, login, logout, getSession } = require('../controllers/authController');
const isAuthenticated = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

router.post('/signup', upload.array('documents', 10), signup);
router.post('/login', login);
router.get('/logout', logout);
router.get('/session', getSession);

module.exports = router;