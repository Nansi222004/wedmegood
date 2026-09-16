const mongoose = require('mongoose');
const ChecklistTask = require('./ChecklistTask');

const INITIAL_CHECKLIST_TASKS = [
  { category: 'Planning', task: 'Research Wedding Planners', timeframe: '12 months before', description: 'Start your journey by finding the right professional to guide you.', color: '#ec4899', priority: 'high', order: 1 },
  { category: 'Planning', task: 'Decide wedding budget', timeframe: '12 months before', description: 'Align with your family on the total spend for all functions.', color: '#ec4899', priority: 'high', order: 2 },
  { category: 'Catering', task: 'Short list caterers', timeframe: '10 months before', description: 'After tasting food from caterers, pick out the best one.', color: '#10b981', priority: 'medium', order: 3 },
  { category: 'Venue', task: 'Book wedding venue', timeframe: '10 months before', description: 'Secure your dream location early for preferred dates.', color: '#f59e0b', priority: 'high', order: 4 },
  { category: 'Catering', task: 'Book caterer', timeframe: '8 months before', description: 'Finalize the contract and pay the advance.', color: '#10b981', priority: 'high', order: 5 },
  { category: 'Photography', task: 'Research photographers', timeframe: '8 months before', description: 'Look through portfolios to find your style.', color: '#8b5cf6', priority: 'medium', order: 6 },
  { category: 'Attire', task: 'Select bridal lehenga & groom sherwani', timeframe: '6 months before', description: 'Visit designers and finalize wedding outfits.', color: '#ec4899', priority: 'high', order: 7 },
  { category: 'Invites', task: 'Finalize guest list and send digital e-invites', timeframe: '3 months before', description: 'Send digital save-the-dates and invitations to all guests.', color: '#06b6d4', priority: 'high', order: 8 },
  { category: 'Music', task: 'Book DJ & Sangeet choreography', timeframe: '2 months before', description: 'Plan the music playlist and sangeet performances.', color: '#ef4444', priority: 'medium', order: 9 }
];

// @desc    Get all checklist tasks for current user
// @route   GET /api/user/checklist
// @access  Private (User)
exports.getChecklist = async (req, res) => {
  try {
    const userId = req.user._id;

    let tasks = await ChecklistTask.find({ userId }).sort({ order: 1, createdAt: 1 });

    // Seed default tasks if brand new user
    if (tasks.length === 0) {
      const seeded = INITIAL_CHECKLIST_TASKS.map(t => ({ ...t, userId }));
      tasks = await ChecklistTask.insertMany(seeded);
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        tasks,
        stats: {
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          progressPercentage
        }
      }
    });
  } catch (error) {
    console.error('getChecklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve checklist tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new checklist task
// @route   POST /api/user/checklist
// @access  Private (User)
exports.createChecklistTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { task, category, timeframe, description, color, priority, order, notes } = req.body;

    if (!task || !task.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
    }

    const newTask = await ChecklistTask.create({
      userId,
      task: task.trim(),
      category: category ? category.trim() : 'General',
      timeframe: timeframe ? timeframe.trim() : '1 month before',
      description: description ? description.trim() : '',
      color: color || '#ec4899',
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      order: Number(order) || 0,
      notes: notes ? notes.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: newTask }
    });
  } catch (error) {
    console.error('createChecklistTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checklist task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update checklist task
// @route   PUT /api/user/checklist/:id
// @access  Private (User)
exports.updateChecklistTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format' });
    }

    const task = await ChecklistTask.findOne({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    const { task: taskTitle, category, timeframe, description, color, completed, priority, order, notes } = req.body;

    if (taskTitle !== undefined) task.task = String(taskTitle).trim();
    if (category !== undefined) task.category = String(category).trim();
    if (timeframe !== undefined) task.timeframe = String(timeframe).trim();
    if (description !== undefined) task.description = String(description).trim();
    if (color !== undefined) task.color = color;
    if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) task.priority = priority;
    if (order !== undefined) task.order = Number(order) || 0;
    if (notes !== undefined) task.notes = String(notes).trim();

    if (completed !== undefined) {
      task.completed = Boolean(completed);
      task.completedAt = task.completed ? new Date() : null;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('updateChecklistTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update checklist task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle checklist task completion
// @route   PATCH /api/user/checklist/:id/toggle
// @access  Private (User)
exports.toggleChecklistTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format' });
    }

    const task = await ChecklistTask.findOne({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    res.status(200).json({
      success: true,
      message: `Task marked as ${task.completed ? 'completed' : 'pending'}`,
      data: { task }
    });
  } catch (error) {
    console.error('toggleChecklistTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle checklist task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete checklist task
// @route   DELETE /api/user/checklist/:id
// @access  Private (User)
exports.deleteChecklistTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format' });
    }

    const task = await ChecklistTask.findOneAndDelete({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('deleteChecklistTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete checklist task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset checklist tasks to default
// @route   POST /api/user/checklist/reset
// @access  Private (User)
exports.resetChecklist = async (req, res) => {
  try {
    const userId = req.user._id;

    await ChecklistTask.deleteMany({ userId });
    const seeded = INITIAL_CHECKLIST_TASKS.map(t => ({ ...t, userId }));
    const tasks = await ChecklistTask.insertMany(seeded);

    res.status(200).json({
      success: true,
      message: 'Checklist reset to default successfully',
      data: { tasks }
    });
  } catch (error) {
    console.error('resetChecklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset checklist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
