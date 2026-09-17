import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import { userApi } from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const WeddingTimeline = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '10:00 AM',
    location: '',
    category: 'Ceremony'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      const res = await userApi.getTimeline();
      if (res.success && res.data) {
        setTimelineData(res.data);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) {
      toast.warning('Please provide event title and date');
      return;
    }

    try {
      setIsSubmitting(true);
      await userApi.createTimelineEvent(newEvent);
      toast.success('Timeline event added successfully');
      setShowAddModal(false);
      setNewEvent({
        title: '',
        date: '',
        time: '10:00 AM',
        location: '',
        category: 'Ceremony'
      });
      await fetchTimeline();
    } catch (err) {
      console.error('Failed to create timeline event:', err);
      toast.error(getFriendlyErrorMessage(err, 'Failed to create event'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (eventId) => {
    setEventToDelete(eventId);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await userApi.deleteTimelineEvent(eventToDelete);
      toast.success('Event deleted successfully');
      await fetchTimeline();
    } catch (err) {
      console.error('Failed to delete event:', err);
      toast.error(getFriendlyErrorMessage(err, 'Failed to delete event'));
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  const getPercentage = (completed, total) => (total > 0 ? ((completed / total) * 100).toFixed(1) : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading wedding timeline...</p>
        </div>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="text-center px-4 max-w-sm">
          <Icon name="clock" size="xl" style={{ color: theme.colors.primary[300] }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Timeline Data
          </h2>
          <p className="text-sm mb-6" style={{ color: theme.semantic.text.secondary }}>
            Set your wedding date to view countdown and milestones
          </p>
          <button
            onClick={() => navigate('/user/wedding-form')}
            className="px-6 py-3 rounded-xl font-semibold text-white shadow-md active:scale-95"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            Set Wedding Date
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-3 p-2 rounded-full transition-transform active:scale-95"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.semantic.text.primary }}>
                Wedding Timeline
              </h1>
              <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
                Milestones, event schedule and ceremony roadmap
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            <Icon name="plus" size="xs" />
            <span>Add Event</span>
          </button>
        </div>

        {/* Countdown Card */}
        <div
          className="bg-white rounded-2xl p-6 mb-6 text-center border border-black/5 shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.secondary[50]} 100%)`
          }}
        >
          <h2 className="text-4xl font-black mb-1" style={{ color: theme.colors.primary[600] }}>
            {timelineData.daysRemaining}
          </h2>
          <p className="text-sm font-bold text-gray-800">
            Days Until The Big Day
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Target Date: {timelineData.weddingDate}
          </p>
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="px-4 mb-8">
        <h3 className="font-bold text-lg mb-3" style={{ color: theme.semantic.text.primary }}>
          Scheduled Events & Appointments
        </h3>

        {timelineData.events && timelineData.events.length > 0 ? (
          <div className="space-y-3">
            {timelineData.events.map((evt) => (
              <div
                key={evt._id || evt.id}
                className="bg-white rounded-xl p-4 border border-black/5 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{evt.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {evt.date} • {evt.time} {evt.location ? `• ${evt.location}` : ''}
                  </p>
                  <span className="inline-block text-[10px] px-2 py-0.5 mt-1.5 rounded-full bg-primary-50 text-primary-700 font-semibold">
                    {evt.category}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-primary-600">
                    {evt.daysUntil > 0 ? `in ${evt.daysUntil} days` : (evt.daysUntil === 0 ? 'Today!' : 'Completed')}
                  </span>
                  <button
                    onClick={() => handleDeleteEvent(evt._id || evt.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg"
                  >
                    <Icon name="trash" size="xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-xs text-gray-400 border border-gray-100">
            No events scheduled yet. Click "Add Event" to plan rehearsals and ceremonies.
          </div>
        )}
      </div>

      {/* Planning Milestones Roadmap */}
      <div className="px-4 space-y-4">
        <h3 className="font-bold text-lg mb-2" style={{ color: theme.semantic.text.primary }}>
          Planning Roadmap
        </h3>

        {timelineData.milestones?.map((milestone, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-4 shadow-sm border border-black/5"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-sm text-gray-900">{milestone.title}</h4>
              <span className="text-xs font-semibold text-gray-500">
                {milestone.completed}/{milestone.total} Completed
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${getPercentage(milestone.completed, milestone.total)}%`,
                  backgroundColor: milestone.color || '#10b981'
                }}
              />
            </div>

            <div className="space-y-1">
              {milestone.tasks.map((task, taskIndex) => (
                <div key={taskIndex} className="flex items-center text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2" />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">Add Timeline Event</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Event / Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sangeet Rehearsal or Mandap Recce"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Venue / Studio"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Ceremony">Ceremony</option>
                    <option value="Rehearsal">Rehearsal</option>
                    <option value="Venue">Venue</option>
                    <option value="Attire">Attire</option>
                    <option value="Photography">Photography</option>
                    <option value="Meeting">Meeting</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl shadow hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Event Confirmation Modal */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        title="Delete Event"
        message="Are you sure you want to delete this timeline event?"
        confirmText={isDeleting ? 'Deleting...' : 'Delete Event'}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};

export default WeddingTimeline;