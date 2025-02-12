import express from 'express';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all events with filters
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const events = await Event.find(query)
      .populate('creator', 'username')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      creator: req.user.userId
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, creator: req.user.userId },
      req.body,
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      creator: req.user.userId
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join event
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (!event.attendees.includes(req.user.userId)) {
      event.attendees.push(req.user.userId);
      await event.save();
      // Emit socket event for real-time update
      req.app.get('io').to(req.params.id).emit('attendeeUpdate', {
        eventId: req.params.id,
        attendeeCount: event.attendees.length
      });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;