const mongoose = require('mongoose');
const TimelineEvent = require('./TimelineEvent');
const User = require('./user.model');
const ChecklistTask = require('./ChecklistTask');

// Roadmap stages, from the earliest planning window to the wedding week
const MILESTONE_STAGES = [
  { title: '12 Months Before', color: '#10b981', minMonths: 9 },
  { title: '6 Months Before', color: '#f59e0b', minMonths: 4 },
  { title: '3 Months Before', color: '#ec4899', minMonths: 1 },
  { title: 'Wedding Week', color: '#8b5cf6', minMonths: 0 }
];

// "10 months before" -> 10, "2 weeks before" -> 0.5, anything else -> 1
const timeframeToMonths = (timeframe = '') => {
  const m = String(timeframe).match(/(\d+(?:\.\d+)?)\s*(month|week|day)/i);
  if (!m) return 1;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  return unit === 'month' ? n : unit === 'week' ? n / 4 : n / 30;
};

const INITIAL_TIMELINE_EVENTS = [
  { title: 'Venue Recce & Tasting', date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), time: '11:00 AM', location: 'Selected Banquet Hall', category: 'Venue', status: 'upcoming', order: 1 },
  { title: 'Pre-Wedding Photoshoot', date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), time: '04:00 PM', location: 'Heritage Garden', category: 'Photography', status: 'upcoming', order: 2 },
  { title: 'Bridal Outfit Final Fitting', date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), time: '02:00 PM', location: 'Designer Studio', category: 'Attire', status: 'upcoming', order: 3 },
  { title: 'Mehendi & Sangeet Ceremony', date: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000), time: '06:00 PM', location: 'Grand Ballroom', category: 'Ceremony', status: 'upcoming', order: 4 },
  { title: 'Wedding Ceremony & Vows', date: new Date(Date.now() + 81 * 24 * 60 * 60 * 1000), time: '07:00 PM', location: 'Main Mandap', category: 'Wedding', status: 'upcoming', order: 5 }
];

// @desc    Get user's wedding timeline and milestones
// @route   GET /api/user/timeline
// @access  Private (User)
exports.getTimeline = async (req, res) => {
  try {
    const userId = req.user._id;

    let events = await TimelineEvent.find({ userId }).sort({ date: 1, order: 1 });

    if (events.length === 0) {
      const seeded = INITIAL_TIMELINE_EVENTS.map(e => ({ ...e, userId }));
      events = await TimelineEvent.insertMany(seeded);
    }

    const user = await User.findById(userId).select('weddingDetails weddingDate');
    // The date given at sign-up counts too; only fall back to a placeholder when no date is known
    const knownWeddingDate = user?.weddingDetails?.weddingDate || user?.weddingDate;
    const weddingDateVal = knownWeddingDate ? new Date(knownWeddingDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((weddingDateVal - today) / (1000 * 60 * 60 * 24)));

    // Generate milestones progress based on timeline events
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const upcomingEvents = events.filter(e => e.status === 'upcoming').length;

    // Milestone progress comes from the user's own checklist (grouped by when each task is due),
    // not from fixed numbers that would show every couple the same fake progress
    const checklist = await ChecklistTask.find({ userId }).select('task timeframe completed').lean();
    const milestones = MILESTONE_STAGES.map((stage) => {
      const stageTasks = checklist.filter((t) => {
        const months = timeframeToMonths(t.timeframe);
        const stageIndex = MILESTONE_STAGES.findIndex((s) => months >= s.minMonths);
        return MILESTONE_STAGES[stageIndex]?.title === stage.title;
      });
      return {
        title: stage.title,
        color: stage.color,
        tasks: stageTasks.slice(0, 3).map((t) => t.task),
        completed: stageTasks.filter((t) => t.completed).length,
        total: stageTasks.length
      };
    });

    res.status(200).json({
      success: true,
      data: {
        weddingDate: weddingDateVal.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        rawWeddingDate: weddingDateVal,
        daysRemaining,
        totalPlanningDays: 365,
        milestones,
        events: events.map(e => ({
          _id: e._id,
          id: e._id,
          title: e.title,
          event: e.title,
          date: e.date.toISOString().split('T')[0],
          time: e.time,
          location: e.location,
          category: e.category,
          status: e.status,
          daysUntil: Math.ceil((new Date(e.date) - today) / (1000 * 60 * 60 * 24))
        })),
        stats: {
          totalEvents: events.length,
          upcomingEvents,
          completedEvents
        }
      }
    });
  } catch (error) {
    console.error('getTimeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve timeline',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new timeline event
// @route   POST /api/user/timeline
// @access  Private (User)
exports.createTimelineEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, date, time, location, category, status, description, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Event title is required' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Event date is required' });
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const newEvent = await TimelineEvent.create({
      userId,
      title: title.trim(),
      date: eventDate,
      time: time ? time.trim() : '10:00 AM',
      location: location ? location.trim() : '',
      category: category ? category.trim() : 'Ceremony',
      status: ['upcoming', 'completed', 'in-progress'].includes(status) ? status : 'upcoming',
      description: description ? description.trim() : '',
      order: Number(order) || 0
    });

    res.status(201).json({
      success: true,
      message: 'Timeline event created successfully',
      data: { event: newEvent }
    });
  } catch (error) {
    console.error('createTimelineEvent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create timeline event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update timeline event
// @route   PUT /api/user/timeline/:id
// @access  Private (User)
exports.updateTimelineEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await TimelineEvent.findOne({ _id: id, userId });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
    }

    const { title, date, time, location, category, status, description, order } = req.body;

    if (title !== undefined) event.title = String(title).trim();
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) event.date = parsedDate;
    }
    if (time !== undefined) event.time = String(time).trim();
    if (location !== undefined) event.location = String(location).trim();
    if (category !== undefined) event.category = String(category).trim();
    if (status !== undefined && ['upcoming', 'completed', 'in-progress'].includes(status)) event.status = status;
    if (description !== undefined) event.description = String(description).trim();
    if (order !== undefined) event.order = Number(order) || 0;

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Timeline event updated successfully',
      data: { event }
    });
  } catch (error) {
    console.error('updateTimelineEvent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update timeline event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete timeline event
// @route   DELETE /api/user/timeline/:id
// @access  Private (User)
exports.deleteTimelineEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await TimelineEvent.findOneAndDelete({ _id: id, userId });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Timeline event deleted successfully'
    });
  } catch (error) {
    console.error('deleteTimelineEvent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete timeline event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
