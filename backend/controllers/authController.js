import 'dotenv/config';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BrevoClient } from '@getbrevo/brevo';

const getBrevoClient = () => new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const signup = async (req, res) => {
  try {
    const { email, password: customPassword, firstName, lastName, mobile, dob, district, tehsil } = req.body;

    if (!email || !firstName || !lastName || !mobile || !dob || !district || !tehsil) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const plainPassword = customPassword && customPassword.trim() ? customPassword.trim() : generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobile: mobile.trim(),
      dob: new Date(dob),
      district: district.trim(),
      tehsil: tehsil.trim(),
    });

    await user.save();

    console.log(`\n========================================`);
    console.log(`🔑 [NEW CITIZEN REGISTRATION]`);
    console.log(`👤 Name:     ${firstName} ${lastName}`);
    console.log(`📧 User ID:  ${normalizedEmail}`);
    console.log(`📱 Mobile:   ${mobile}`);
    console.log(`🔒 Password: ${plainPassword}`);
    console.log(`========================================\n`);

    // Send credentials email (non-blocking: user creation succeeds even if email service is unreachable)
    let emailSent = false;
    try {
      if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
        console.log(`Sending credentials email via Brevo to ${normalizedEmail}...`);
        const brevo = getBrevoClient();
        const sendResult = await brevo.transactionalEmails.sendTransacEmail({
          subject: 'Welcome to Apuni Sarkar 2.0 - Your Account Credentials',
          textContent: `Hello ${firstName},\n\nYour account on Apuni Sarkar 2.0 has been created successfully.\n\nUser ID: ${normalizedEmail}\nPassword: ${plainPassword}\n\nPlease change your password upon your first login.\n\nRegards,\nApuni Sarkar 2.0 Team`,
          sender: { name: process.env.BREVO_SENDER_NAME || 'Apuni Sarkar', email: process.env.BREVO_SENDER_EMAIL },
          to: [{ email: normalizedEmail, name: firstName }],
        });
        console.log(`✅ Brevo credentials email sent successfully! Message ID:`, sendResult?.messageId);
        emailSent = true;
      }
    } catch (emailErr) {
      console.error('❌ Brevo email delivery error:', emailErr?.message || emailErr);
      if (emailErr?.body) {
        console.error('Brevo error details:', JSON.stringify(emailErr.body, null, 2));
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(201).json({
      message: 'Account created. Check your email for credentials.',
      token,
      tempPassword: plainPassword,
      emailSent,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        district: user.district,
        tehsil: user.tehsil,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const identifier = email.trim();
    const cleanMobile = identifier.replace(/[\s+-]/g, '');

    // Allow login by email OR mobile number
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { mobile: identifier },
        { mobile: cleanMobile },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User ID not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        district: user.district,
        tehsil: user.tehsil,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

export const me = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        district: user.district,
        tehsil: user.tehsil,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};
