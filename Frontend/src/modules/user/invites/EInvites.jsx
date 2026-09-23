import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import userApi from '../../../services/userApi';
import { toast } from '../../../components/ui/Toast';
import { getFriendlyErrorMessage } from '../../../utils/errorHandler';

const EInvites = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [myInvites, setMyInvites] = useState([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchMyInvites = async () => {
    try {
      setIsLoadingInvites(true);
      const res = await userApi.getInvites();
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.invites || []);
        setMyInvites(list);
      }
    } catch (err) {
      console.error('Error fetching invites from MongoDB:', err);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchMyInvites();
  }, []);

  const handleCreateNewInvite = async (templateObj) => {
    const tName = templateObj?.name || 'Royal Elegance';
    const tThumb = templateObj?.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=600&fit=crop&q=80';
    setIsCreating(true);
    try {
      const res = await userApi.createInvite({
        title: `${tName} Invitation`,
        template: tName,
        eventDetails: {
          brideName: 'Priya Sharma',
          groomName: 'Rahul Verma',
          eventDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          venue: 'Royal Palace Banquets',
          venueAddress: 'AB Road, Indore, Madhya Pradesh'
        },
        design: {
          thumbnail: tThumb,
          themeColor: '#8B4513'
        },
        status: 'Draft'
      });
      const createdId = res.data?.invite?._id || res.data?._id;
      if (res.success && createdId) {
        navigate(`/user/e-invites/edit/${createdId}`);
      }
    } catch (err) {
      console.error('Failed to create invite:', err);
      toast.error(getFriendlyErrorMessage(err, 'Could not create invitation. Please try again.'));
    } finally {
      setIsCreating(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Templates', icon: 'grid' },
    { id: 'traditional', name: 'Traditional', icon: 'star' },
    { id: 'modern', name: 'Modern', icon: 'trending' },
    { id: 'floral', name: 'Floral', icon: 'heart' },
    { id: 'minimal', name: 'Minimal', icon: 'layout' },
    { id: 'luxury', name: 'Luxury', icon: 'crown' }
  ];

  const templates = [
    {
      id: 1,
      name: 'Royal Elegance',
      category: 'luxury',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=600&fit=crop&q=80',
      price: 'Free',
      isPremium: false,
      colors: ['#8B4513', '#FFD700', '#FFFFFF'],
      features: ['Animated', 'Music', 'RSVP']
    },
    {
      id: 2,
      name: 'Floral Dreams',
      category: 'floral',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80',
      price: 'Free',
      isPremium: false,
      colors: ['#FFB6C1', '#FFFFFF', '#90EE90'],
      features: ['Animated', 'RSVP']
    },
    {
      id: 3,
      name: 'Modern Chic',
      category: 'modern',
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=600&fit=crop&q=80',
      price: '₹299',
      isPremium: true,
      colors: ['#000000', '#FFFFFF', '#FF69B4'],
      features: ['Animated', 'Music', 'RSVP', 'Video']
    },
    {
      id: 4,
      name: 'Traditional Mandala',
      category: 'traditional',
      image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=600&fit=crop&q=80',
      price: 'Free',
      isPremium: false,
      colors: ['#FF6347', '#FFD700', '#8B0000'],
      features: ['Animated', 'Music', 'RSVP']
    },
    {
      id: 5,
      name: 'Minimalist White',
      category: 'minimal',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80',
      price: 'Free',
      isPremium: false,
      colors: ['#FFFFFF', '#000000', '#C0C0C0'],
      features: ['RSVP']
    },
    {
      id: 6,
      name: 'Golden Luxury',
      category: 'luxury',
      image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80',
      price: '₹499',
      isPremium: true,
      colors: ['#FFD700', '#000000', '#FFFFFF'],
      features: ['Animated', 'Music', 'RSVP', 'Video', 'Gallery']
    },
    {
      id: 7,
      name: 'Pastel Flowers',
      category: 'floral',
      image: 'https://images.unsplash.com/photo-1519167758481-83f29d8ae8e4?w=400&h=600&fit=crop&q=80',
      price: '₹199',
      isPremium: true,
      colors: ['#FFE4E1', '#E6E6FA', '#F0E68C'],
      features: ['Animated', 'Music', 'RSVP']
    },
    {
      id: 8,
      name: 'Contemporary Art',
      category: 'modern',
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80',
      price: '₹399',
      isPremium: true,
      colors: ['#4169E1', '#FFFFFF', '#FF1493'],
      features: ['Animated', 'Music', 'RSVP', 'Video']
    },
    {
      id: 9,
      name: 'Classic Red',
      category: 'traditional',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=600&fit=crop&q=80',
      price: 'Free',
      isPremium: false,
      colors: ['#DC143C', '#FFD700', '#FFFFFF'],
      features: ['Animated', 'RSVP']
    },
    {
      id: 10,
      name: 'Simple Elegance',
      category: 'minimal',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=600&fit=crop&q=80',
      price: 'Free',
      isPremium: false,
      colors: ['#F5F5F5', '#333333', '#D4AF37'],
      features: ['RSVP']
    },
    {
      id: 11,
      name: 'Rose Garden',
      category: 'floral',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=600&fit=crop&q=80',
      price: '₹299',
      isPremium: true,
      colors: ['#FF69B4', '#FFFFFF', '#32CD32'],
      features: ['Animated', 'Music', 'RSVP', 'Gallery']
    },
    {
      id: 12,
      name: 'Royal Palace',
      category: 'luxury',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=600&fit=crop&q=80',
      price: '₹599',
      isPremium: true,
      colors: ['#800080', '#FFD700', '#FFFFFF'],
      features: ['Animated', 'Music', 'RSVP', 'Video', 'Gallery', 'Timeline']
    }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const features = [
    { icon: 'edit', title: 'Easy Customization', description: 'Personalize every detail' },
    { icon: 'share', title: 'Easy Sharing', description: 'Share via WhatsApp, Email, SMS' },
    { icon: 'users', title: 'RSVP Tracking', description: 'Track guest responses' },
    { icon: 'chart', title: 'Analytics', description: 'View invitation statistics' },
    { icon: 'music', title: 'Add Music', description: 'Include your favorite songs' },
    { icon: 'image', title: 'Photo Gallery', description: 'Share your love story' }
  ];

  return (
    <div className="min-h-screen pb-32 relative bg-transparent">
      {/* Background Image for the whole page */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ backgroundImage: "url('/uservendorre%20page%20bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />

      {/* Header Container */}
      <div className="relative z-10 px-6 py-6 mb-8 mt-6 rounded-[3rem] bg-white/80 backdrop-blur-md shadow-sm border border-white mx-2 overflow-hidden">
        {/* Background floral accent for header */}
        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "url('/uservendorre%20page%20bg.png')", backgroundSize: 'cover', backgroundPosition: 'center -100px' }}></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#FDF4F7] shadow-sm border border-white shrink-0 active:scale-95 transition-transform"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B3C56" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div>
              <h1 className="text-[26px] font-bold text-[#301024] leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                Digital E-Invites
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#8E95A4]">
                Craft Your Legacy
              </p>
            </div>
          </div>
          
          <button
            onClick={() => handleCreateNewInvite(templates[0])}
            disabled={isCreating}
            className="w-11 h-11 rounded-full bg-[#4A1637] flex items-center justify-center shadow-lg shrink-0 active:scale-95 transition-transform"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white animate-spin rounded-full" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 space-y-10 relative z-10">
        
        {/* My Invitations (Kept functionality) */}
        {myInvites.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[26px] font-bold text-[#301024]" style={{ fontFamily: '"Playfair Display", serif' }}>Recent Works</h2>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E95A4]">Manage</span>
            </div>
            
            <div className="space-y-4">
              {myInvites.map((invite) => {
                const inviteId = invite._id || invite.id;
                const thumb = invite.design?.thumbnail || invite.thumbnail || templates[0].image;

                return (
                  <div key={inviteId} className="bg-white/90 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-sm border border-white flex flex-col sm:flex-row p-3 gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                      <img src={thumb} alt={invite.title || invite.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 py-1 flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-[#301024] mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
                        {invite.title || invite.name}
                      </h3>
                      <p className="text-[10px] font-bold text-[#8E95A4] uppercase tracking-wider mb-3">
                        {invite.status || 'Draft'}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/user/e-invites/edit/${inviteId}`)} className="flex-1 py-2 bg-[#FDF4F7] rounded-xl text-[10px] font-bold text-[#BE185D]">
                          Edit
                        </button>
                        <button onClick={() => navigate(`/user/e-invites/preview/${inviteId}`)} className="flex-1 py-2 bg-[#4A1637] rounded-xl text-[10px] font-bold text-white">
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Discovery Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[26px] font-bold text-[#301024]" style={{ fontFamily: '"Playfair Display", serif' }}>Discovery</h2>
            <div className="flex gap-2">
              {categories.slice(0, 3).map(c => (
                <button 
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${selectedCategory === c.id ? 'bg-[#4A1637] text-white shadow-md' : 'bg-white text-[#8E95A4] border border-white shadow-sm'}`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id} 
                className="bg-white/95 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer border border-white"
                onClick={() => handleCreateNewInvite(template)}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                     <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm text-[#6B3C56]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                     </button>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <h3 className="text-[15px] font-bold text-[#301024] mb-1.5 truncate" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {template.name}
                  </h3>
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-bold text-[#BE185D] tracking-wide">{template.price}</span>
                     <div className="flex gap-1.5">
                        {template.colors.slice(0, 3).map((c, i) => (
                          <div key={i} className="w-2.5 h-2.5 rounded-full border border-black/5" style={{ backgroundColor: c }} />
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EInvites;
