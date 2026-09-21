const mongoose = require('mongoose');
const User = require('./user.model');
const Budget = require('./Budget');
const ChecklistTask = require('./ChecklistTask');
const Guest = require('./Guest');
const TimelineEvent = require('./TimelineEvent');
const Favorite = require('./Favorite');
const Inspiration = require('./Inspiration');
const EInvite = require('./EInvite');
const Booking = require('../vendor/Booking');
const Lead = require('../vendor/Lead');
const Quote = require('../vendor/Quote');

// @desc    Get consolidated planning suite summary from authoritative MongoDB models
// @route   GET /api/user/planning-summary
// @access  Private (User)
exports.getPlanningDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      user,
      budget,
      tasks,
      guests,
      timelineEvents,
      favoritesCount,
      inspirationCount,
      invites,
      bookings,
      leadsCount,
      quotesCount
    ] = await Promise.all([
      User.findById(userId).select('name weddingDetails weddingProgress').lean(),
      Budget.findOne({ userId }).lean(),
      ChecklistTask.find({ userId }).lean(),
      Guest.find({ userId }).lean(),
      TimelineEvent.find({ userId }).lean(),
      Favorite.countDocuments({ userId }),
      Inspiration.countDocuments({ userId }),
      EInvite.find({ userId }).lean(),
      Booking.find({ userId, status: { $nin: ['cancelled', 'rejected'] } }).lean(),
      Lead.countDocuments({ userId }),
      Quote.countDocuments({ userId })
    ]);

    // 1. Wedding details & days remaining
    const weddingDateVal = user?.weddingDetails?.weddingDate ? new Date(user.weddingDetails.weddingDate) : null;
    const today = new Date();
    const daysToWedding = weddingDateVal ? Math.max(0, Math.ceil((weddingDateVal - today) / (1000 * 60 * 60 * 24))) : null;

    // 2. Checklist metrics
    const totalChecklist = tasks.length;
    const completedChecklist = tasks.filter(t => t.completed).length;

    // 3. Guest metrics
    const totalGuestsInvited = guests.reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
    const confirmedGuests = guests.filter(g => g.rsvpStatus === 'Confirmed').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'Pending').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);

    // 4. Budget & booking financial metrics
    const totalBudget = budget?.totalBudget || user?.weddingDetails?.budget || 0;
    const bookedTotalValue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const budgetSpent = budget?.categories
      ? budget.categories.reduce((sum, c) => sum + (Number(c.spent) || 0), 0)
      : bookedTotalValue;

    // 5. Timeline metrics
    const upcomingTimelineEvents = timelineEvents.filter(e => e.status === 'upcoming').length;

    // 6. E-Invite metrics
    const publishedInvites = invites.filter(i => i.status === 'Published').length;
    const totalRSVPsReceived = invites.reduce((sum, i) => sum + (i.rsvps ? i.rsvps.length : 0), 0);

    res.status(200).json({
      success: true,
      data: {
        weddingDetails: user?.weddingDetails || {},
        daysToWedding,
        checklist: {
          total: totalChecklist,
          completed: completedChecklist,
          progressPercentage: totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0
        },
        budget: {
          totalBudget,
          spent: budgetSpent,
          remaining: Math.max(0, totalBudget - budgetSpent),
          bookedValue: bookedTotalValue
        },
        guests: {
          totalGuests: guests.length,
          totalInvited: totalGuestsInvited,
          confirmed: confirmedGuests,
          pending: pendingGuests
        },
        timeline: {
          totalEvents: timelineEvents.length,
          upcomingEvents: upcomingTimelineEvents
        },
        vendors: {
          shortlisted: favoritesCount,
          activeBookings: bookings.length,
          leads: leadsCount,
          quotes: quotesCount
        },
        inspiration: {
          totalSaved: inspirationCount
        },
        invites: {
          totalInvites: invites.length,
          published: publishedInvites,
          rsvpsReceived: totalRSVPsReceived
        }
      }
    });
  } catch (error) {
    console.error('getPlanningDashboardSummary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve planning summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get comprehensive personalized user dashboard summary
// @route   GET /api/user/dashboard-summary
// @access  Private (User)
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const Vendor = require('../vendor/Vendor');
    const UserNotification = require('./UserNotification');
    const UserActivity = require('./UserActivity');

    const [
      user,
      budget,
      tasks,
      guests,
      timelineEvents,
      favoritesCount,
      bookings,
      leads,
      quotes,
      invites,
      unreadNotifCount,
      recentActivities
    ] = await Promise.all([
      User.findById(userId).select('name city weddingDetails weddingProgress preferences').lean(),
      Budget.findOne({ userId }).lean(),
      ChecklistTask.find({ userId }).sort({ dueDate: 1 }).lean(),
      Guest.find({ userId }).lean(),
      TimelineEvent.find({ userId }).sort({ date: 1 }).lean(),
      Favorite.countDocuments({ userId }),
      Booking.find({ userId, status: { $nin: ['Cancelled', 'Rejected'] } })
        .populate('vendorId', 'businessName city profileImage startingPrice rating')
        .sort({ eventDate: 1 })
        .lean(),
      Lead.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Quote.find({ userId })
        .populate('vendorId', 'businessName city profileImage')
        .sort({ createdAt: -1 })
        .lean(),
      EInvite.find({ userId }).lean(),
      UserNotification.countDocuments({ userId, isRead: false }),
      UserActivity.find({ userId }).sort({ createdAt: -1 }).limit(6).lean()
    ]);

    // 1. Wedding details & days remaining
    const weddingDateVal = user?.weddingDetails?.weddingDate ? new Date(user.weddingDetails.weddingDate) : null;
    const today = new Date();
    const daysRemaining = weddingDateVal ? Math.max(0, Math.ceil((weddingDateVal - today) / (1000 * 60 * 60 * 24))) : null;

    // 2. Checklist metrics
    const totalChecklist = tasks.length;
    const completedChecklist = tasks.filter(t => t.completed).length;
    const checklistProgress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

    // 3. Guest metrics
    const totalGuestsInvited = guests.reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
    const confirmedGuests = guests.filter(g => g.rsvpStatus === 'Confirmed').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'Pending').reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);

    // 4. Budget metrics
    const totalBudget = budget?.totalBudget || user?.weddingDetails?.budget || 0;
    const budgetSpent = budget?.categories
      ? budget.categories.reduce((sum, c) => sum + (Number(c.spent) || 0), 0)
      : bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const percentSpent = totalBudget > 0 ? Math.min(100, Math.round((budgetSpent / totalBudget) * 100)) : 0;

    // 5. Bookings
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');
    const upcomingBookings = bookings.filter(b => b.eventDate && new Date(b.eventDate) >= today);

    // 6. Quotes
    const pendingQuotes = quotes.filter(q => q.status === 'Pending');
    const expiringSoonQuotes = pendingQuotes.filter(q => {
      if (!q.validUntil) return false;
      const diffDays = Math.ceil((new Date(q.validUntil) - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });

    // 7. Recommended Vendors: strictly Approved and Active
    const userCity = user?.weddingDetails?.city || user?.city || 'Indore';
    let recommendedVendors = await Vendor.find({
      status: 'Approved',
      isActive: true,
      city: { $regex: new RegExp(userCity, 'i') }
    })
      .select('businessName city profileImage startingPrice rating reviewCount selectedCategories')
      .sort({ isFeatured: -1, rating: -1, _id: -1 })
      .limit(4)
      .lean();

    // Fallback to any approved active vendors if none in city
    if (!recommendedVendors || recommendedVendors.length === 0) {
      recommendedVendors = await Vendor.find({
        status: 'Approved',
        isActive: true
      })
        .select('businessName city profileImage startingPrice rating reviewCount selectedCategories')
        .sort({ isFeatured: -1, rating: -1, _id: -1 })
        .limit(4)
        .lean();
    }

    // 8. Dynamic Actionable Items
    const upcomingActions = [];

    if (expiringSoonQuotes.length > 0) {
      upcomingActions.push({
        id: `quote-exp-${expiringSoonQuotes[0]._id}`,
        type: 'quote',
        title: 'Quote Expiring Soon',
        description: `Quote from ${expiringSoonQuotes[0].vendorId?.businessName || 'Vendor'} is expiring soon.`,
        priority: 'high',
        route: '/user/dashboard'
      });
    } else if (pendingQuotes.length > 0) {
      upcomingActions.push({
        id: `quote-pend-${pendingQuotes[0]._id}`,
        type: 'quote',
        title: 'Pending Vendor Quote',
        description: `Review quote of ₹${(pendingQuotes[0].totalAmount || 0).toLocaleString()} from ${pendingQuotes[0].vendorId?.businessName || 'Vendor'}.`,
        priority: 'medium',
        route: '/user/dashboard'
      });
    }

    if (upcomingBookings.length > 0) {
      const nextBooking = upcomingBookings[0];
      const bDays = Math.ceil((new Date(nextBooking.eventDate) - today) / (1000 * 60 * 60 * 24));
      upcomingActions.push({
        id: `book-up-${nextBooking._id}`,
        type: 'booking',
        title: 'Upcoming Booking',
        description: `${nextBooking.vendorId?.businessName || 'Vendor'} scheduled in ${bDays} day${bDays > 1 ? 's' : ''}.`,
        priority: bDays <= 7 ? 'high' : 'normal',
        route: '/user/bookings'
      });
    }

    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today);
    if (overdueTasks.length > 0) {
      upcomingActions.unshift({
        id: `task-overdue-${overdueTasks[0]._id}`,
        type: 'overdue_task',
        title: 'Overdue Checklist Task',
        description: `Task "${overdueTasks[0].task}" is overdue.`,
        priority: 'urgent',
        route: '/user/tools/checklist'
      });
    }

    const pendingTasks = tasks.filter(t => !t.completed && (!t.dueDate || new Date(t.dueDate) >= today));
    if (pendingTasks.length > 0) {
      upcomingActions.push({
        id: `task-pen-${pendingTasks[0]._id}`,
        type: 'checklist',
        title: 'Checklist Task Pending',
        description: pendingTasks[0].task,
        priority: 'normal',
        route: '/user/tools/checklist'
      });
    }

    if (pendingGuests > 0) {
      upcomingActions.push({
        id: 'guest-pend-action',
        type: 'guest',
        title: 'Pending RSVPs',
        description: `${pendingGuests} guest${pendingGuests > 1 ? 's' : ''} have not yet confirmed their RSVP.`,
        priority: 'normal',
        route: '/user/tools/guests'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        wedding: {
          brideName: user?.weddingDetails?.brideName || '',
          groomName: user?.weddingDetails?.groomName || '',
          weddingDate: weddingDateVal ? weddingDateVal.toISOString().split('T')[0] : null,
          daysRemaining,
          venue: user?.weddingDetails?.venue || '',
          location: user?.weddingDetails?.city || user?.city || '',
          budget: totalBudget,
          guestCount: totalGuestsInvited || user?.weddingDetails?.guestCount || 0,
          category: user?.weddingDetails?.category || 'Wedding'
        },
        bookings: {
          total: bookings.length,
          confirmed: confirmedBookings.length,
          upcomingCount: upcomingBookings.length,
          upcomingList: upcomingBookings.slice(0, 3)
        },
        quotes: {
          total: quotes.length,
          pending: pendingQuotes.length,
          expiringSoon: expiringSoonQuotes.length,
          recent: quotes.slice(0, 3)
        },
        planning: {
          checklist: {
            total: totalChecklist,
            completed: completedChecklist,
            progressPercentage: checklistProgress
          },
          budget: {
            totalBudget,
            spent: budgetSpent,
            remaining: Math.max(0, totalBudget - budgetSpent),
            percentSpent
          },
          timeline: {
            totalEvents: timelineEvents.length,
            upcomingEvents: timelineEvents.filter(e => e.status === 'upcoming').length
          },
          guests: {
            totalInvited: totalGuestsInvited,
            confirmed: confirmedGuests,
            pending: pendingGuests
          }
        },
        vendors: {
          favoritesCount,
          shortlistedCount: favoritesCount,
          recommended: recommendedVendors
        },
        upcomingActions,
        recentActivities,
        notifications: {
          unreadCount: unreadNotifCount
        }
      }
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get aggregated planning calendar
// @route   GET /api/user/calendar
// @access  Private (User)
exports.getPlanningCalendar = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, startDate, endDate } = req.query;

    let rangeStart = null;
    let rangeEnd = null;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      rangeStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
      rangeEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    } else {
      if (startDate) rangeStart = new Date(startDate);
      if (endDate) rangeEnd = new Date(endDate);
    }

    const isWithinRange = (date) => {
      if (!date || isNaN(date.getTime())) return false;
      if (rangeStart && date < rangeStart) return false;
      if (rangeEnd && date > rangeEnd) return false;
      return true;
    };

    const [user, bookings, tasks, timelineEvents, invites] = await Promise.all([
      User.findById(userId).select('weddingDetails').lean(),
      Booking.find({ userId, status: { $nin: ['Cancelled', 'Rejected'] } })
        .populate('vendorId', 'businessName city profileImage')
        .lean(),
      ChecklistTask.find({ userId, $or: [{ dueDate: { $ne: null } }, { targetDate: { $ne: null } }] }).lean(),
      TimelineEvent.find({ userId, date: { $ne: null } }).lean(),
      EInvite.find({ userId, rsvpDeadline: { $ne: null } }).lean()
    ]);

    const toDateOnlyString = (val) => {
      if (!val) return null;
      if (typeof val === 'string') {
        const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
      }
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      try {
        const fmt = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        return fmt.format(d);
      } catch (e) {
        return d.toISOString().split('T')[0];
      }
    };

    const events = [];

    // 1. Wedding Day Event
    if (user?.weddingDetails?.weddingDate) {
      const wDate = new Date(user.weddingDetails.weddingDate);
      if (isWithinRange(wDate)) {
        events.push({
          id: 'wedding-day',
          source: 'WEDDING',
          type: 'WEDDING',
          title: 'Wedding Day! 💍✨',
          date: toDateOnlyString(user.weddingDetails.weddingDate),
          rawDate: wDate,
          time: '18:00',
          status: 'Confirmed',
          route: '/user/wedding-details',
          navigationPath: '/user/wedding-details',
          metadata: {
            venue: user.weddingDetails.venue,
            city: user.weddingDetails.city
          }
        });
      }
    }

    // 2. Bookings
    bookings.forEach(b => {
      if (b.eventDate) {
        const bDate = new Date(b.eventDate);
        if (isWithinRange(bDate)) {
          events.push({
            id: b._id.toString(),
            source: 'BOOKING',
            type: 'BOOKING',
            title: b.vendorId?.businessName ? `Booking: ${b.vendorId.businessName}` : 'Vendor Booking',
            date: toDateOnlyString(b.eventDate),
            rawDate: bDate,
            time: '12:00',
            status: b.status,
            route: '/user/bookings',
            navigationPath: '/user/bookings',
            metadata: {
              vendorName: b.vendorId?.businessName || 'Vendor',
              totalPrice: b.totalPrice,
              services: b.services
            }
          });
        }
      }
    });

    // 3. Checklist Tasks
    tasks.forEach(t => {
      const dueDateVal = t.dueDate || t.targetDate;
      if (dueDateVal) {
        const tDate = new Date(dueDateVal);
        if (isWithinRange(tDate)) {
          events.push({
            id: t._id.toString(),
            source: 'CHECKLIST',
            type: 'CHECKLIST',
            title: `Task Due: ${t.task}`,
            date: toDateOnlyString(dueDateVal),
            rawDate: tDate,
            time: '09:00',
            status: t.completed ? 'Completed' : 'Pending',
            route: '/user/tools/checklist',
            navigationPath: '/user/tools/checklist',
            metadata: {
              category: t.category,
              priority: t.priority
            }
          });
        }
      }
    });

    // 4. Timeline Events
    timelineEvents.forEach(te => {
      if (te.date) {
        const teDate = new Date(te.date);
        if (isWithinRange(teDate)) {
          events.push({
            id: te._id.toString(),
            source: 'TIMELINE',
            type: 'TIMELINE',
            title: te.title,
            date: toDateOnlyString(te.date),
            rawDate: teDate,
            time: te.time || '10:00',
            status: te.status,
            route: '/user/tools/timeline',
            navigationPath: '/user/tools/timeline',
            metadata: {
              description: te.description,
              location: te.location
            }
          });
        }
      }
    });

    // 5. E-Invite RSVP Deadlines
    invites.forEach(inv => {
      if (inv.rsvpDeadline) {
        const rDate = new Date(inv.rsvpDeadline);
        if (isWithinRange(rDate)) {
          events.push({
            id: inv._id.toString(),
            source: 'RSVP_DEADLINE',
            type: 'RSVP_DEADLINE',
            title: `RSVP Cutoff: ${inv.name}`,
            date: toDateOnlyString(inv.rsvpDeadline),
            rawDate: rDate,
            time: '23:59',
            status: inv.status,
            route: '/user/e-invites',
            navigationPath: '/user/e-invites',
            metadata: {
              slug: inv.slug
            }
          });
        }
      }
    });

    // Sort chronologically
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        events,
        totalEvents: events.length,
        filter: {
          month: month || null,
          startDate: rangeStart ? rangeStart.toISOString() : null,
          endDate: rangeEnd ? rangeEnd.toISOString() : null
        }
      }
    });
  } catch (error) {
    console.error('getPlanningCalendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve calendar events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get weather forecast for wedding location (Honest status reporting)
// @route   GET /api/user/weather
// @access  Private (User)
exports.getWeather = async (req, res) => {
  try {
    const { city, date, month } = req.query;
    const { getWeatherForDate, getWeatherForMonth } = require('../../services/weather.service');
    const resolvedCity = city || req.user?.city || 'Indore';

    if (date) {
      const weather = await getWeatherForDate(resolvedCity, date);
      return res.status(200).json({
        success: true,
        data: {
          city: resolvedCity,
          ...weather
        }
      });
    }

    const currentYearMonth = month || new Date().toISOString().substring(0, 7);
    const forecastMap = await getWeatherForMonth(resolvedCity, currentYearMonth);
    const forecastList = Object.values(forecastMap);

    res.status(200).json({
      success: true,
      data: {
        city: resolvedCity,
        forecast: forecastList,
        forecastMap
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve weather data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

