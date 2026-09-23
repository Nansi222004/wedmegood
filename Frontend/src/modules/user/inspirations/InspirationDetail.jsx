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
    <div className="min-h-screen pb-32 bg-transparent">
      {/* Immersive Visual Content */}
      <div className="relative w-full rounded-t-[40px] overflow-hidden mt-2 shadow-sm">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-[65vh] object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
        
        {/* Floating Action Buttons */}
        <div className="absolute top-6 left-0 right-0 px-5 flex items-start justify-between z-20">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-[#FDFBF9] shadow-sm flex items-center justify-center transition-all active:scale-95 text-[#4A2B42]"
          >
            <Icon name="chevronLeft" size="sm" />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-full bg-[#FDFBF9] shadow-sm flex items-center justify-center transition-all active:scale-95 text-[#4A2B42]"
            >
              <Icon name="share" size="sm" />
            </button>
            <button
              onClick={handleSave}
              className="w-11 h-11 rounded-full bg-[#FDFBF9] shadow-sm flex items-center justify-center transition-all active:scale-95"
            >
              <Icon name="heart" size="sm" style={{ color: isSaved ? '#9D3875' : '#4A2B42' }} />
            </button>
          </div>
        </div>

        {/* Floating Contextual Info */}
        <div className="absolute bottom-12 left-6 right-6 text-white space-y-3 z-20">
           <div className="inline-flex px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm border border-white/20">
              {item.category} Inspiration
           </div>
           <h1 className="text-[38px] font-bold leading-none text-white" style={{ fontFamily: '"Playfair Display", serif', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
             {item.title}
           </h1>
           <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest pt-1">
              <span className="flex items-center gap-2 drop-shadow-md"><Icon name="heart" size="xs" /> {item.saves} Saves</span>
              <span className="flex items-center gap-2 drop-shadow-md"><Icon name="eye" size="xs" /> {item.views} Views</span>
           </div>
        </div>
      </div>

      {/* Editorial Details Container */}
      <div className="px-6 -mt-8 relative z-10">
        <div 
          className="bg-[#FDFBF9] rounded-[32px] shadow-sm p-6 sm:p-8 space-y-8 relative overflow-hidden border border-white"
          style={{
            backgroundImage: "url('/invitation%20bg.png')",
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%'
          }}
        >
           {/* Section 1: Philosophy */}
           <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#9D7D9A] mb-4">Creative Context</h2>
              <div className="flex gap-4">
                 {/* Vertical line */}
                 <div className="w-[2px] bg-[#EAC397] flex-shrink-0 rounded-full mt-1 mb-1" />
                 
                 {/* Text and Quotes */}
                 <div className="relative pt-1 pb-1">
                    <span className="absolute -top-3 -left-1 text-[40px] text-[#F1D8E7] font-serif leading-none">“</span>
                    <p className="text-[15px] text-[#4A2B42] leading-relaxed italic z-10 relative px-5" style={{ fontFamily: '"Playfair Display", serif' }}>
                       {item.description}
                    </p>
                    <span className="absolute -bottom-4 right-0 text-[40px] text-[#F1D8E7] font-serif leading-none">”</span>
                 </div>
              </div>
           </div>

           {/* Section 2: Featured Creator */}
           <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-[24px] bg-[#F8EBEE] shadow-sm">
              <div className="flex items-center gap-3">
                 <img 
                   src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" 
                   alt={item.vendor} 
                   className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white"
                 />
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#9D7D9A] mb-1">Curation by</p>
                    <p className="text-[16px] font-bold text-[#4A2B42] leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{item.vendor}</p>
                    <p className="text-[10px] text-[#9D7D9A] mt-0.5">Celebrity Fashion Designer</p>
                 </div>
              </div>
              <button 
                onClick={() => navigate('/user/vendors')}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#561D42] text-white text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                 View Profile
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
           </div>

           {/* Section 3: Semantic Identifiers */}
           <div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#9D7D9A] mb-3">Classifications</h2>
              <div className="flex flex-wrap gap-2">
                 {item.tags.map((tag, index) => (
                   <span 
                     key={index}
                     className="px-4 py-2 rounded-full bg-[#F8EBEE] text-[12px] font-bold text-[#4A2B42] transition-colors"
                   >
                     #{tag}
                   </span>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Recommended Discovery */}
      <div className="px-4 mt-12 mb-8 space-y-6">
         {/* Header */}
         <div className="text-center relative">
            <div className="flex items-center justify-center gap-3 mb-2">
               <div className="h-[1px] bg-[#4A2B42]/30 w-16"></div>
               <svg className="text-[#D4AF37] w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C12 2 15 7 15 11C15 15 12 18 12 18C12 18 9 15 9 11C9 7 12 2 12 2ZM12 20C12 20 18 18 20 14C22 10 22 7 22 7C22 7 19 9 16 11C13 13 12 20 12 20ZM12 20C12 20 6 18 4 14C2 10 2 7 2 7C2 7 5 9 8 11C11 13 12 20 12 20Z" />
               </svg>
               <div className="h-[1px] bg-[#4A2B42]/30 w-16"></div>
            </div>
            <h2 className="text-[26px] font-bold text-[#4A2B42] leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
              Continue Exploring
            </h2>
            <p className="text-[13px] text-[#6B6C80] mt-1">
              Discover more ideas to make your day special
            </p>
         </div>

         <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {relatedItems.map((related) => {
              // Extract a mock subtitle based on title for the UI
              const subMap = {
                'Mandap Decoration': 'Elegant setups for your perfect vows',
                'Floral Decor Ideas': 'Fresh blooms for unforgettable moments',
                'Stage Decoration': 'Beautiful stages for bigger celebrations',
                'Entrance Decor': 'Make every entry memorable'
              };
              const subtitle = subMap[related.title] || 'Discover more wedding ideas';
              
              return (
              <div 
                key={related.id}
                onClick={() => navigate(`/user/inspirations/${related.id}`)}
                className="group cursor-pointer relative h-[260px] rounded-[28px] overflow-hidden shadow-sm"
              >
                 {/* Full Background Image */}
                 <img 
                   src={related.image} 
                   className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                   alt={related.title}
                 />
                 
                 {/* Overlapping Bottom Panel */}
                 <div 
                   className="absolute bottom-0 left-0 right-0 h-[110px] px-4 flex flex-col justify-center bg-[#FDFBF9] rounded-[28px]"
                   style={{
                     backgroundImage: "url('/exproler%20section%20bg.png')",
                     backgroundPosition: 'center',
                     backgroundRepeat: 'no-repeat',
                     backgroundSize: '100% 100%'
                   }}
                 >
                    <div className="flex items-center justify-between gap-2 relative z-10">
                       <div className="flex-1 pr-1">
                          <h3 className="text-[15px] font-bold text-[#4A2B42] leading-tight mb-1 line-clamp-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                            {related.title}
                          </h3>
                          <p className="text-[11px] text-[#6B6C80] leading-snug font-medium pr-2 line-clamp-2">
                            {subtitle}
                          </p>
                       </div>
                       <button className="w-8 h-8 flex-shrink-0 rounded-full bg-[#F4E8F8] flex items-center justify-center text-[#863773] shadow-[0_0_12px_rgba(255,255,255,1)]">
                          <Icon name="arrowRight" size="xs" />
                       </button>
                    </div>
                 </div>
              </div>
            )})}
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
