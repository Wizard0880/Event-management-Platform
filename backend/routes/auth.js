import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const generateTokens = async (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  await RefreshToken.create({
    userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  return { accessToken, refreshToken };
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const { accessToken, refreshToken } = await generateTokens(user._id);
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/guest', async (req, res) => {
  try {
    const guestUser = new User({
      username: `guest_${Date.now()}`,
      email: `guest_${Date.now()}@temp.com`,
      password: Date.now().toString(),
      isGuest: true
    });
    await guestUser.save();
    
    const { accessToken, refreshToken } = await generateTokens(guestUser._id);
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: guestUser._id,
        username: guestUser.username,
        isGuest: true
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    const refreshTokenDoc = await RefreshToken.findOne({ token });
    
    if (!refreshTokenDoc) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (refreshTokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: refreshTokenDoc._id });
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const user = await User.findById(refreshTokenDoc.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);
    await RefreshToken.deleteOne({ _id: refreshTokenDoc._id });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { token } = req.body;
    await RefreshToken.deleteOne({ token });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/events', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Check if the user is a guest
    if (user.isGuest) {
      return res.status(403).json({ error: 'Guest users are not allowed to create events' });
    }

    const { title, description, date } = req.body;
    const event = new Event({
      title,
      description,
      date,
      createdBy: req.user.userId
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/events/:eventId/join', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Add the user to the event's participants list
    event.participants.push(req.user.userId);
    await event.save();

    res.json({ message: 'Successfully joined the event', event });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;