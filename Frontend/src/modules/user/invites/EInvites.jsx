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
      if (res.success && Array.isArray(res.data)) {
        setMyInvites(res.data);
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
      if (res.success && res.data?._id) {
        navigate(`/user/e-invites/edit/${res.data._id}`);
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
    <div 
      className="min-h-screen pb-32"
      style={{ backgroundColor: '#EAE1D8' }}
    >
      {/* 1. Editorial Header */}
      <div 
        className="sticky top-0 z-20 px-6 py-10 rounded-b-[3rem] shadow-sm bg-white border-b border-[#3D2B2B]/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[#EAE1D8]/30 border border-[#EAE1D8]"
            >
              <Icon name="arrowLeft" size="sm" style={{ color: '#3D2B2B' }} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>
                Digital E-Invites
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30" style={{ fontFamily: '"Outfit", sans-serif' }}>
                 Craft Your Legacy
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCreateNewInvite(templates[0])}
            disabled={isCreating}
            className="w-12 h-12 rounded-full bg-[#3D2B2B] flex items-center justify-center shadow-xl active:scale-95 transition-all text-white"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <Icon name="plus" size="sm" color="white" />
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-10 space-y-12">
        {/* 2. My Invitations - Arched Cards */}
        {myInvites.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>Recent Works</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30">Manage Invites</span>
            </div>
            
            <div className="space-y-6">
              {myInvites.map((invite) => {
                const inviteId = invite._id || invite.id;
                const rsvpCount = invite.rsvpCount ?? (Array.isArray(invite.rsvps) ? invite.rsvps.length : 0);
                const thumb = invite.design?.thumbnail || invite.thumbnail || templates[0].image;
                const evDate = invite.eventDetails?.eventDate || invite.date || 'TBD';

                return (
                  <div key={inviteId} className="bg-white rounded-[3rem] overflow-hidden shadow-sm ring-1 ring-black/5 flex flex-col sm:flex-row">
                    <div className="sm:w-48 h-48 sm:h-auto relative">
                      <img
                        src={thumb}
                        alt={invite.title || invite.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${invite.status === 'Published' ? 'bg-[#25D366] text-white' : 'bg-[#EAE1D8] text-[#3D2B2B]'}`}>
                           {invite.status || 'Draft'}
                         </span>
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-center space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#3D2B2B] mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
                          {invite.title || invite.name}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30">
                          {invite.template} • {evDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Icon name="eye" size="xs" style={{ color: '#BE185D' }} />
                          <span className="text-[11px] font-bold text-[#3D2B2B]">{invite.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="users" size="xs" style={{ color: '#BE185D' }} />
                          <span className="text-[11px] font-bold text-[#3D2B2B]">{rsvpCount} RSVPs</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => navigate(`/user/e-invites/edit/${inviteId}`)}
                          className="flex-1 py-3 rounded-full bg-[#EAE1D8]/30 border border-[#EAE1D8] text-[9px] font-black uppercase tracking-widest text-[#3D2B2B] hover:bg-[#EAE1D8]/50 transition-colors"
                        >
                          Refine
                        </button>
                        <button
                          onClick={() => navigate(`/user/e-invites/preview/${inviteId}`)}
                          className="flex-1 py-3 rounded-full bg-[#3D2B2B] text-white text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-colors"
                        >
                          Presenter
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Browse Templates - Editorial Search */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>Discovery</h2>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.slice(0, 3).map(c => (
                <button 
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === c.id ? 'bg-[#3D2B2B] text-white shadow-lg' : 'bg-white text-[#3D2B2B]/40 border border-black/5'}`}
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
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm group active:scale-95 transition-all cursor-pointer"
                onClick={() => handleCreateNewInvite(template)}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {template.isPremium && (
                    <div className="absolute top-4 left-4">
                       <span className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                          <Icon name="crown" size="xs" style={{ color: '#F59E0B' }} />
                       </span>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-bold text-[#3D2B2B] truncate" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {template.name}
                  </h3>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-[#BE185D] underline">{template.price}</span>
                     <div className="flex gap-1">
                        {template.colors.slice(0, 2).map((c, i) => (
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
