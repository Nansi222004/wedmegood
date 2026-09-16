const mongoose = require('mongoose');
const UserNotification = require('./UserNotification');
const UserActivity = require('./UserActivity');

// @desc    Get paginated user notifications
// @route   GET /api/user/notifications
// @access  Private (User)
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.type && req.query.type !== 'all') {
      filter.type = req.query.type;
    }
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      UserNotification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserNotification.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/user/notifications/unread-count
// @access  Private (User)
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await UserNotification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('getUnreadNotificationCount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/user/notifications/:id/read
// @access  Private (User)
exports.markNotificationRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await UserNotification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark all unread notifications as read
// @route   PUT /api/user/notifications/read-all
// @access  Private (User)
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await UserNotification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount || 0
    });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get paginated user activities
// @route   GET /api/user/activities
// @access  Private (User)
exports.getUserActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.type && req.query.type !== 'all') {
      filter.type = req.query.type;
    }

    const [activities, total] = await Promise.all([
      UserActivity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserActivity.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('getUserActivities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
