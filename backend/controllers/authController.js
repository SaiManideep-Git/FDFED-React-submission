const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { JWT_SECRET } = require('../config/constants');
const { Customer, Company, Worker } = require('../models');
const upload = require('../middlewares/upload').upload; // Multer upload
 
const signup = async (req, res) => {
  try {
    const { role, password, termsAccepted, ...data } = req.body;
    if (!role) return res.status(400).json({ message: 'User type is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });
    if (!termsAccepted) return res.status(400).json({ message: 'You must accept the terms and conditions' });

    const email = data.email;
    const existingUser = await Customer.findOne({ email }) || await Company.findOne({ email }) || await Worker.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    let user;
    switch (role) {
      case 'customer':
        if (!data.name || !data.email || !data.dob || !data.phone) return res.status(400).json({ message: 'All customer fields are required' });
        user = new Customer({ name: data.name, email: data.email, dob: new Date(data.dob), phone: data.phone, password, role });
        break;
      case 'company':
        if (!data.companyName || !data.contactPerson || !data.email || !data.phone) return res.status(400).json({ message: 'All company fields are required' });
        user = new Company({ companyName: data.companyName, contactPerson: data.contactPerson, email: data.email, phone: data.phone, companyDocuments: req.files ? req.files.map(file => file.path) : [], password, role, status: 'pending' });
        break;
      case 'worker':
        if (!data.name || !data.email || !data.dob || !data.aadharNumber || !data.phone || !data.specialization) return res.status(400).json({ message: 'All worker fields are required' });
        user = new Worker({ name: data.name, email: data.email, dob: new Date(data.dob), aadharNumber: data.aadharNumber, phone: data.phone, specialization: data.specialization, experience: data.experience || 0, certificateFiles: req.files ? req.files.map(file => file.path) : [], isArchitect: data.specialization.toLowerCase() === 'architect', password, role, status: 'pending' });
        break;
      default:
        return res.status(400).json({ message: 'Invalid user type' });
    }

    await user.save();
    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    if (error.code === 11000) res.status(400).json({ message: 'Email or Aadhaar number already exists' });
    else res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    let user = await Customer.findOne({ email }) || await Company.findOne({ email }) || await Worker.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // Block login for company/worker if not verified
    if ((user.role === 'company' || user.role === 'worker')) {
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Your application is yet to be accepted', status: 'pending' });
      }
      if (user.status === 'rejected') {
        return res.status(403).json({ message: 'Your application has been rejected', status: 'rejected' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ user_id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24, sameSite: 'lax' });

    let redirect;
    switch (user.role) {
      case 'customer': redirect = '/customerdashboard'; break;
      case 'company': redirect = '/companydashboard'; break;
      case 'worker': redirect = '/workerdashboard'; break;
      default: return res.status(500).json({ message: 'Server error' });
    }

    res.status(200).json({ message: 'Login successful', redirect });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
};

const getSession = (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(200).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ authenticated: true, user: { user_id: decoded.user_id, role: decoded.role } });
  } catch (error) {
    res.status(200).json({ authenticated: false });
  }
};

module.exports = { signup, login, logout, getSession };