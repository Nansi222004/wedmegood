import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const InspirationBoard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [inspirationData, setInspirationData] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('decor');
  const [newNotes, setNewNotes] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchInspirations = async () => {
    try {
      setIsLoading(true);
      const res = await userApi.getInspirations();
      if (res.success) {
        setInspirationData(res.stats || {
          totalSaved: 0,
          categories: [],
          recentActivity: [],
          monthlyStats: []
        });
        setSavedItems(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching inspiration board data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspirations();
  }, []);

  const handleUploadInspiration = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.warning('Please enter a title for this inspiration idea');
      return;
    }
    if (!newImageFile) {
      toast.warning('Please select an image to upload');
      return;
    }

    setIsUploading(true);
    try {
      const uploadRes = await userApi.uploadImage(newImageFile);
      if (!uploadRes.success || !uploadRes.data?.url) {
        throw new Error(uploadRes.message || 'Image upload failed');
      }

      const saveRes = await userApi.saveInspiration({
        title: newTitle.trim(),
        image: uploadRes.data.url,
        category: newCategory,
        notes: newNotes.trim()
      });

      if (saveRes.success) {
        setIsUploadModalOpen(false);
        setNewTitle('');
        setNewCategory('decor');
        setNewNotes('');
        setNewImageFile(null);
        setNewImagePreview('');
        toast.success('Inspiration saved to your board!');
        await fetchInspirations();
      } else {
        throw new Error(saveRes.message || 'Failed to save inspiration');
      }
    } catch (err) {
      console.error('Inspiration upload error:', err);
      toast.error(getFriendlyErrorMessage(err, 'Failed to upload inspiration'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = (id) => {
    setItemToDelete(id);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setDeletingId(id);
    try {
      const res = await userApi.deleteInspiration(id);
      if (res.success) {
        toast.success('Inspiration removed successfully');
        await fetchInspirations();
      } else {
        throw new Error(res.message || 'Failed to delete inspiration');
      }
    } catch (err) {
      console.error('Error deleting inspiration:', err);
      toast.error(getFriendlyErrorMessage(err, 'Could not remove inspiration'));
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const handleBack = () => {
    navigate('/user/planning-dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
        <div className="px-4 py-6">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mr-3"></div>
            <div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="w-24 h-4 bg-gray-200 rounded mb-4"></div>
                <div className="w-full h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasItems = inspirationData && inspirationData.totalSaved > 0;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-3 p-2 rounded-full"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="chevronDown" size="sm" className="rotate-90" style={{ color: theme.semantic.text.primary }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.semantic.text.primary }}>
                Inspiration Board
              </h1>
              <p className="text-sm mt-1" style={{ color: theme.semantic.text.secondary }}>
                Your saved wedding ideas and inspiration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white shadow-sm hover:bg-slate-900 transition-all flex items-center gap-1.5"
            >
              <Icon name="camera" size="xs" />
              <span>+ Upload</span>
            </button>
            <button
              onClick={() => navigate('/user/inspirations')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all"
              style={{ backgroundColor: theme.colors.primary[500] }}
            >
              + Explore Ideas
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Total Ideas Saved
            </p>
            <p className="text-3xl font-black text-slate-900">
              {inspirationData?.totalSaved || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center">
            <Icon name="heart" size="md" />
          </div>
        </div>
      </div>

      {!hasItems ? (
        <div className="px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-400 flex items-center justify-center mx-auto mb-4">
            <Icon name="heart" size="lg" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.semantic.text.primary }}>
            No Inspirations Saved Yet
          </h2>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: theme.semantic.text.secondary }}>
            Explore decor, bridal looks, and themes to build your personalized wedding moodboard.
          </p>
          <button
            onClick={() => navigate('/user/inspirations')}
            className="px-6 py-3 rounded-xl font-semibold text-white shadow-md shadow-pink-200"
            style={{ backgroundColor: theme.colors.primary[500] }}
          >
            Browse Wedding Ideas
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {/* Saved Items Gallery */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800">
                Saved Ideas ({savedItems.length})
              </h3>
              <span className="text-xs text-slate-400 font-medium">MongoDB Synced</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {savedItems.map((item) => (
                <div
                  key={item._id}
                  className="group relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    disabled={deletingId === item._id}
                    title="Remove from board"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-red-500 flex items-center justify-center text-xs transition-colors shadow"
                  >
                    {deletingId === item._id ? (
                      <div className="w-3 h-3 border border-white border-t-transparent animate-spin rounded-full" />
                    ) : (
                      '✕'
                    )}
                  </button>

                  {/* Title & Category */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white backdrop-blur-md mb-1 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <p className="text-xs font-bold text-white truncate drop-shadow-sm">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          {inspirationData.categories && inspirationData.categories.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-base text-slate-800 mb-4">
                Ideas by Category
              </h3>
              <div className="space-y-3">
                {inspirationData.categories.map((category) => (
                  <div key={category.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-slate-700">{category.name}</span>
                      </div>
                      <span className="text-slate-500">{category.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${(category.count / inspirationData.totalSaved) * 100}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {inspirationData.recentActivity && inspirationData.recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-base text-slate-800 mb-3">
                Recent Activity
              </h3>
              <div className="space-y-2.5">
                {inspirationData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                        <Icon name="bookmark" size="xs" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {activity.action} "{activity.item}"
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {activity.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Inspiration Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center shadow-sm">
                  <Icon name="camera" size="sm" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Add Inspiration</h3>
                  <p className="text-xs text-slate-500">Upload wedding decor, outfit, or theme ideas</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadInspiration} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Photo / Image <span className="text-red-500">*</span>
                </label>
                {newImagePreview ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 mb-2">
                    <img src={newImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setNewImageFile(null);
                        setNewImagePreview('');
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 hover:border-pink-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
                    <Icon name="camera" size="md" className="text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-600">Select Image to Upload</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewImageFile(file);
                          setNewImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Idea Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bohemian Mandap with Fairy Lights"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-pink-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-pink-500 focus:bg-white transition-all capitalize"
                  >
                    <option value="decor">Decor Ideas</option>
                    <option value="bridal">Bridal Looks</option>
                    <option value="venues">Venue Styles</option>
                    <option value="photography">Photography</option>
                    <option value="outfits">Outfits</option>
                    <option value="mehndi">Mehndi</option>
                    <option value="jewelry">Jewelry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Notes / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Evening reception"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-pink-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-200 transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Save to Board</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="h-8"></div>

      {/* Delete Inspiration Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Remove Saved Inspiration"
        message="Are you sure you want to remove this saved inspiration from your board?"
        confirmText={deletingId ? 'Removing...' : 'Remove'}
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};

export default InspirationBoard;