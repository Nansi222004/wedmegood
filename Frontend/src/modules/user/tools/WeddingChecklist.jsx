import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';

const WeddingChecklist = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState(null);

  // Local Icon helper to respect constraints - no modifications to Icon.jsx
  const DetailIcon = ({ name, size = 'md', className = '' }) => {
    const sizeClasses = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
    const paths = {
      pencil: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
      description: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
      tag: "M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.182 0l4.318-4.318a2.25 2.25 0 0 0 0-3.182L11.159 3.659A2.25 2.25 0 0 0 9.568 3Z M9 9h.008v.008H9V9Z",
      file: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    };
    return (
      <svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} />
      </svg>
    );
  };
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    task: '',
    category: 'Planning',
    timeframe: '12 months before',
    description: ''
  });

  // Default tasks
  const defaultTasks = [
    { id: 1, category: 'Planning', task: 'Research Wedding Planners', timeframe: '12 months before', description: 'Start your journey by finding the right professional to guide you.', color: '#ec4899', completed: false },
    { id: 2, category: 'Planning', task: 'Decide wedding budget', timeframe: '12 months before', description: 'Align with your family on the total spend for all functions.', color: '#ec4899', completed: false },
    { id: 3, category: 'Catering', task: 'Short list caterers', timeframe: '10 months before', description: 'After tasting food from caterers, pick out the best one.', color: '#10b981', completed: false },
    { id: 4, category: 'Venue', task: 'Book wedding venue', timeframe: '10 months before', description: 'Secure your dream location early for preferred dates.', color: '#f59e0b', completed: false },
    { id: 5, category: 'Catering', task: 'Book caterer', timeframe: '8 months before', description: 'Finalize the contract and pay the advance.', color: '#10b981', completed: false },
    { id: 6, category: 'Photography', task: 'Research photographers', timeframe: '8 months before', description: 'Look through portfolios to find your style.', color: '#8b5cf6', completed: false },
  ];

  useEffect(() => {
    const savedTasks = localStorage.getItem('weddingChecklistTasks_v2');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(defaultTasks);
      localStorage.setItem('weddingChecklistTasks_v2', JSON.stringify(defaultTasks));
    }
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    localStorage.setItem('weddingChecklistTasks_v2', JSON.stringify(updatedTasks));
    // Sync selected task if it's being viewed
    if (selectedTask) {
      const updated = updatedTasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      saveTasks(updatedTasks);
      setSelectedTask(null);
    }
  };

  const addTask = () => {
    if (!newTask.task) return;
    const taskToAdd = {
      ...newTask,
      id: Date.now(),
      completed: false,
      color: getCategoryColor(newTask.category)
    };
    const updatedTasks = [taskToAdd, ...tasks];
    saveTasks(updatedTasks);
    setShowAddModal(false);
    setNewTask({
      task: '',
      category: 'Planning',
      timeframe: '12 months before',
      description: ''
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Planning': '#ec4899',
      'Catering': '#10b981',
      'Venue': '#f59e0b',
      'Photography': '#8b5cf6',
      'Jewellery': '#f59e0b',
      'Invitations': '#ec4899',
    };
    return colors[category] || '#6b7280';
  };

  const handleBack = () => navigate('/user/planning-dashboard');

  const categories = ['All', 'Planning', 'Catering', 'Venue', 'Photography', 'Jewellery', 'Invitations'];
  const timeframes = ['12 months before', '10 months before', '8 months before', '6 months before', '4 months before', '2 months before', '1 month before', 'Wedding Day'];

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = activeCategory === 'All' || task.category === activeCategory;
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Pending' && !task.completed) ||
      (statusFilter === 'Completed' && task.completed);
    return matchesCategory && matchesStatus;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Detail View Layer - Matching Image Exactly */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-[50] bg-white animate-in slide-in-from-right duration-300 flex flex-col overflow-y-auto"
          style={{ backgroundColor: theme.semantic.background.primary, paddingBottom: '70px' }}
          data-lenis-prevent="true"
        >
          {/* Detail Header */}
          <div className="flex-none px-4 pt-6 pb-4 flex items-center justify-between border-b border-gray-100 bg-white z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Icon name="chevronDown" size="sm" className="rotate-90 text-gray-900" />
              </button>
              <h1 className="text-lg font-black text-gray-900">Checklist</h1>
            </div>

            {/* Added Add Task button matching your latest image */}
            <button
              onClick={() => {
                setNewTask({ ...newTask, category: selectedTask.category });
                setShowAddModal(true);
              }}
              className="w-8 h-8 rounded-full bg-[#ec4899] text-white flex items-center justify-center hover:bg-[#db2777] transition-colors"
            >
              <Icon name="plus" size="xs" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto w-full pb-32 overscroll-contain"
            data-lenis-prevent="true"
          >
            {/* Action Bar */}
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <button
                onClick={() => toggleTask(selectedTask.id)}
                className={`flex items-center gap-3 px-4 h-11 rounded-full border font-bold text-sm transition-all shadow-sm ${selectedTask.completed
                  ? 'bg-primary-50 border-primary-500 text-primary-600'
                  : 'bg-white border-gray-300 text-gray-700'
                  }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedTask.completed ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                  {selectedTask.completed && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>Mark complete</span>
              </button>

              <div className="flex items-center gap-6">
                <button className="text-gray-400 hover:text-gray-600 active:scale-95 transition-all">
                  <DetailIcon name="pencil" size="sm" />
                </button>
                <button
                  onClick={() => deleteTask(selectedTask.id)}
                  className="text-gray-400 hover:text-red-500 active:scale-95 transition-all"
                >
                  <Icon name="trash" size="sm" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-6 py-4">
              <h2 className="text-[26px] font-black text-gray-900 mb-6 leading-tight tracking-tight">{selectedTask.task}</h2>

              <div className="flex items-start gap-4 mb-10">
                <div className="mt-1 flex-shrink-0"><DetailIcon name="description" size="sm" className="text-gray-300" /></div>
                <p className="text-[15px] leading-relaxed text-gray-500 font-medium">
                  {selectedTask.description || "Start searching for the perfect vendor for your special day."}
                </p>
              </div>

              {/* Info Rows */}
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-6 flex justify-center"><Icon name="clock" size="sm" className="text-gray-300" /></div>
                  <span className="text-[15px] font-bold text-gray-600">From {selectedTask.timeframe}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-6 flex justify-center"><DetailIcon name="tag" size="sm" className="text-gray-300" /></div>
                  <span className="text-[15px] font-bold text-gray-600">{selectedTask.category}</span>
                </div>

                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-6 flex justify-center"><DetailIcon name="file" size="sm" className="text-gray-300 group-hover:text-primary-500" /></div>
                  <span className="text-[15px] font-bold text-gray-400 group-hover:text-primary-500">
                    {selectedTask.notes || 'Add a note'}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/user/vendors/${selectedTask.category.toLowerCase()}`)}
                  className="flex items-center justify-between w-full py-1 hover:bg-gray-50 transition-all rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 flex justify-center"><Icon name="search" size="sm" className="text-gray-300" /></div>
                    <span className="text-[15px] font-bold text-gray-600">My vendors for {selectedTask.category}</span>
                  </div>
                  <Icon name="chevronRight" size="xs" className="text-gray-300" />
                </button>
              </div>

              {/* Search Promo Card */}
              <div className="bg-gray-50/70 rounded-[28px] border border-gray-100 p-7 relative overflow-hidden mb-8">
                <div className="relative z-10">
                  <h3 className="text-[17px] font-black text-gray-900 leading-tight mb-4">Still looking for your vendor team?</h3>
                  <button
                    onClick={() => navigate(`/user/vendors/${selectedTask.category.toLowerCase()}`)}
                    className="text-[11px] font-black text-rose-600 uppercase tracking-widest hover:underline decoration-2"
                  >
                    SEARCH {selectedTask.category.toUpperCase()}
                  </button>
                  <p className="mt-8 text-[11px] font-bold text-gray-400">Booked this vendor?</p>
                </div>
                <button className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 active:scale-95 transition-all">
                  <Icon name="close" size="sm" />
                </button>
              </div>

              {/* Expense Row */}
              <button className="flex items-center gap-4 group mb-12">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <Icon name="plus" size="xs" />
                </div>
                <span className="text-sm font-black text-rose-600">Add related expense</span>
              </button>

              {/* Recommended Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 leading-none">Recommended For You</h4>
                  <p className="text-lg font-black text-gray-900 leading-tight">{selectedTask.category}s in Hyderabad</p>
                </div>

                {/* Horizontal Scroller */}
                <div className="flex gap-4 overflow-x-auto pb-10 scrollbar-hide -mx-6 px-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="min-w-[240px] group cursor-pointer">
                      <div className="aspect-[4/3] rounded-[20px] overflow-hidden bg-gray-100 mb-3 relative shadow-sm">
                        <img
                          src={`https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=600&auto=format&fit=crop`}
                          alt="Vendor"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h5 className="text-sm font-black text-gray-900 px-1 leading-snug">Grand Heritage {selectedTask.category}</h5>
                      <div className="flex items-center gap-1.5 px-1 mt-1.5">
                        <Icon name="star" size="xs" className="text-amber-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">4.8 (120 reviews)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Checklist Header */}
      <div className="sticky top-0 z-30 px-4 py-4 border-b flex items-center justify-between" style={{ backgroundColor: theme.semantic.background.primary, borderColor: theme.semantic.border.light }}>
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-3 p-1">
            <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.semantic.text.primary }}>Checklist</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-full transition-transform active:scale-90"
          style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
        >
          <Icon name="plus" size="sm" />
        </button>
      </div>

      {/* Stats Section */}
      <div className="px-4 py-6">
        <p className="text-sm font-medium mb-3" style={{ color: theme.semantic.text.secondary }}>
          You have completed <span className="font-bold" style={{ color: theme.semantic.text.primary }}>{completedCount}</span> out of <span className="font-bold">{totalCount}</span> tasks
        </p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              backgroundColor: theme.colors.primary[500]
            }}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 pb-4 border-b" style={{ borderColor: theme.semantic.border.light }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium" style={{ color: theme.semantic.text.secondary }}>Filter by:</span>
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center space-x-1 text-sm font-bold"
                style={{ color: theme.colors.primary[500] }}
              >
                <span>{statusFilter}</span>
                <Icon name="chevronDown" size="xs" />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 py-2 w-32 bg-white rounded-lg shadow-xl z-40 border" style={{ borderColor: theme.semantic.border.light }}>
                  {['All', 'Pending', 'Completed'].map(status => (
                    <button
                      key={status}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Chips - Scrollable */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border`}
              style={{
                backgroundColor: activeCategory === category ? `${theme.colors.primary[500]}10` : 'transparent',
                borderColor: activeCategory === category ? theme.colors.primary[500] : theme.semantic.border.light,
                color: activeCategory === category ? theme.colors.primary[500] : theme.semantic.text.secondary
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Task List - Grouped by Timeframe */}
      <div className="px-4 py-6">
        {timeframes.map(timeframe => {
          const timeframeTasks = filteredTasks.filter(t => t.timeframe === timeframe);
          if (timeframeTasks.length === 0) return null;

          return (
            <div key={timeframe} className="mb-8 last:mb-0">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: theme.semantic.text.primary }}>
                {timeframe}
              </h2>
              <div className="space-y-4">
                {timeframeTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl shadow-sm border overflow-hidden"
                    style={{ borderColor: theme.semantic.border.light }}
                  >
                    <div
                      className="p-4 flex items-start space-x-3 cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id);
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                      >
                        {task.completed && <Icon name="check" size="xs" color="white" />}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : ''}`} style={{ color: theme.semantic.text.primary }}>
                          {task.task}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: theme.semantic.text.secondary }}>{task.category}</p>
                      </div>
                      <Icon name="chevronDown" size="xs" className="-rotate-90" style={{ color: theme.semantic.text.tertiary }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6" style={{ color: theme.semantic.text.primary }}>Add New Task</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: theme.semantic.text.secondary }}>Task Name</label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  style={{ borderColor: theme.semantic.border.light }}
                  placeholder="e.g. Book a photographer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: theme.semantic.text.secondary }}>Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border outline-none cursor-pointer"
                    style={{ borderColor: theme.semantic.border.light }}
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: theme.semantic.text.secondary }}>Timeframe</label>
                  <select
                    value={newTask.timeframe}
                    onChange={(e) => setNewTask({ ...newTask, timeframe: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border outline-none cursor-pointer"
                    style={{ borderColor: theme.semantic.border.light }}
                  >
                    {timeframes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: theme.semantic.text.secondary }}>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border outline-none min-h-[100px] resize-none"
                  style={{ borderColor: theme.semantic.border.light }}
                  placeholder="Add some details about this task..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3.5 rounded-xl font-bold transition-colors"
                style={{ backgroundColor: theme.semantic.background.accent, color: theme.semantic.text.primary }}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="flex-2 py-3.5 px-10 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: theme.colors.primary[500], color: 'white' }}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeddingChecklist;
