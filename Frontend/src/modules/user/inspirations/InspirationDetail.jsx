import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Toast from '../../../components/ui/Toast';

const InspirationDetail = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Extended mock data
  const inspirationData = {
    '1': { title: 'Red Bridal Lehenga', category: 'Bridal', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1200&fit=crop&q=80', saves: 1234, views: 5678, description: 'Stunning red bridal lehenga with intricate golden embroidery. Perfect for traditional wedding ceremonies.', vendor: 'Sabyasachi', tags: ['Bridal', 'Traditional', 'Red'] },
    '2': { title: 'Pink Bridal Lehenga', category: 'Bridal', image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=1200&fit=crop&q=80', saves: 987, views: 4321, description: 'Elegant pink bridal lehenga with delicate floral embroidery. Ideal for modern brides.', vendor: 'Anita Dongre', tags: ['Bridal', 'Modern', 'Pink'] },
    '3': { title: 'Golden Bridal Lehenga', category: 'Bridal', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1200&fit=crop&q=80', saves: 2345, views: 8765, description: 'Luxurious golden bridal lehenga with royal embellishments. Perfect for grand celebrations.', vendor: 'Manish Malhotra', tags: ['Bridal', 'Luxury', 'Golden'] },
    '4': { title: 'Intricate Bridal Mehndi', category: 'Mehndi', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&h=1200&fit=crop&q=80', saves: 3456, views: 12345, description: 'Beautiful intricate bridal mehndi design covering full hands and arms. Traditional patterns with modern elements.', vendor: 'Mehndi by Karuna', tags: ['Mehndi', 'Bridal', 'Intricate'] },
    '5': { title: 'Arabic Mehndi Design', category: 'Mehndi', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&h=1200&fit=crop&q=80', saves: 2876, views: 9876, description: 'Elegant Arabic mehndi design with bold patterns and floral motifs. Perfect for contemporary styles.', vendor: 'Henna Art Studio', tags: ['Mehndi', 'Arabic', 'Modern'] }
  };

  const item = inspirationData[id] || inspirationData['1'];

  const relatedItems = [
    { id: 10, title: 'Mandap Decoration', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80' },
    { id: 11, title: 'Floral Decor Ideas', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80' },
    { id: 12, title: 'Stage Decoration', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80' },
    { id: 13, title: 'Entrance Decor', image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=600&fit=crop&q=80' }
  ];

  const handleSave = () => {
    setIsSaved(!isSaved);
    setToastMessage(isSaved ? 'Removed from saved' : 'Saved to your collection');
    setShowToast(true);
  };

  const handleShare = () => {
    setToastMessage('Link copied to clipboard');
    setShowToast(true);
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: theme.semantic.background.primary }}>
      {/* Editorial Header */}
      <div 
        className="sticky top-0 z-50 px-6 py-6 border-b backdrop-blur-md bg-opacity-90"
        style={{ 
          backgroundColor: theme.semantic.background.primary,
          borderBottomColor: theme.semantic.border.light
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ backgroundColor: theme.semantic.background.accent }}
          >
            <Icon name="chevronLeft" size="sm" style={{ color: theme.semantic.text.primary }} />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ backgroundColor: theme.semantic.background.accent }}
            >
              <Icon name="share" size="sm" style={{ color: theme.semantic.text.primary }} />
            </button>
            <button
              onClick={handleSave}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ 
                backgroundColor: isSaved ? theme.colors.primary[500] : theme.semantic.background.accent 
              }}
            >
              <Icon name="heart" size="sm" style={{ color: isSaved ? 'white' : theme.semantic.text.primary }} />
            </button>
          </div>
        </div>
      </div>

      {/* Immersive Visual Content */}
      <div className="relative">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-[65vh] object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        
        {/* Floating Contextual Info */}
        <div className="absolute bottom-10 left-8 right-8 text-white space-y-4">
           <div className="inline-flex px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black uppercase tracking-widest">
              {item.category} Inspiration
           </div>
           <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
             {item.title}
           </h1>
           <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest opacity-80">
              <span className="flex items-center gap-2"><Icon name="heart" size="xs" /> {item.saves} Saves</span>
              <span className="flex items-center gap-2"><Icon name="eye" size="xs" /> {item.views} Views</span>
           </div>
        </div>
      </div>

      {/* Editorial Details Container */}
      <div className="px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-10 space-y-10">
           {/* Section 1: Philosophy */}
           <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Creative Context</h2>
              <p className="text-lg text-gray-600 leading-relaxed italic" style={{ fontFamily: '"Outfit", sans-serif' }}>
                 "{item.description}"
              </p>
           </div>

           {/* Section 2: Featured Creator */}
           <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-gray-100">
              <div>
                 <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Curation by</p>
                 <p className="text-xl font-bold text-gray-800" style={{ fontFamily: '"Playfair Display", serif' }}>{item.vendor}</p>
              </div>
              <button 
                onClick={() => navigate('/user/vendors')}
                className="px-6 py-3 rounded-full bg-[#3D2B2B] text-white text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                 View Profile
              </button>
           </div>

           {/* Section 3: Semantic Identifiers */}
           <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Classifications</h2>
              <div className="flex flex-wrap gap-2">
                 {item.tags.map((tag, index) => (
                   <span 
                     key={index}
                     className="px-5 py-2 rounded-full bg-gray-100 text-[10px] font-bold text-gray-800 hover:bg-gray-200 transition-colors"
                   >
                     #{tag}
                   </span>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Recommended Discovery */}
      <div className="px-8 mt-16 space-y-8">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: '"Playfair Display", serif' }}>Continue Exploring</h2>
            <Icon name="arrowRight" size="sm" color="primary" />
         </div>

         <div className="grid grid-cols-2 gap-4">
            {relatedItems.map((related) => (
              <div 
                key={related.id}
                onClick={() => navigate(`/user/inspirations/${related.id}`)}
                className="group cursor-pointer space-y-3"
              >
                 <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-sm">
                    <img 
                      src={related.image} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      alt={related.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest text-center px-4">{related.title}</p>
              </div>
            ))}
         </div>
      </div>

      {/* Toast Engagement */}
      {showToast && (
        <Toast
          isVisible={showToast}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default InspirationDetail;
