import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';

const PhotographerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('portfolio');

  // Mock data for a premium photographer
  const photographer = {
    id: id,
    name: "The Cinematic Weddings",
    location: "Indore, Madhya Pradesh",
    rating: 4.9,
    reviews: 124,
    experience: "8+ Years",
    price: "₹75,000",
    priceType: "starting price",
    speciality: ["Candid", "Cinematography", "Traditional"],
    description: "Capturing the soul of your celebration with a blend of editorial grace and cinematic depth. We don't just take pictures; we craft timeless legacies of your most cherished moments.",
    heroImage: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&h=800&fit=crop&q=90",
    portfolio: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600&h=800&fit=crop&q=80"
    ],
    stories: [
      { id: 1, title: 'Classic', thumb: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200&h=200&fit=crop&q=80' },
      { id: 2, title: 'Royal', thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop&q=80' },
      { id: 3, title: 'Modern', thumb: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&h=200&fit=crop&q=80' },
      { id: 4, title: 'Vintage', thumb: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200&h=200&fit=crop&q=80' }
    ]
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#EAE1D8' }}>
      {/* 1. Immersive Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <img 
          src={photographer.heroImage} 
          alt={photographer.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        
        {/* Navigation Overlays */}
        <div className="absolute top-6 left-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
          >
            <Icon name="arrowLeft" size="sm" color="white" />
          </button>
        </div>
        
        <div className="absolute top-6 right-4 flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Icon name="share" size="sm" color="white" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Icon name="heart" size="sm" color="white" />
          </button>
        </div>

        {/* Hero Info Overlay */}
        <div className="absolute bottom-10 left-6 right-6 text-white space-y-2">
           <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 bg-[#BE185D] rounded text-[8px] font-black uppercase tracking-widest">Editor's Choice</span>
             <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[8px] font-black uppercase tracking-widest"> Indores #1</span>
           </div>
           <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
             {photographer.name}
           </h1>
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-80">
              <span className="flex items-center gap-1"><Icon name="location" size="xs" /> {photographer.location}</span>
           </div>
        </div>
      </div>

      {/* 2. Portfolio Highlights - Arched Container */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="bg-white rounded-[3rem] shadow-xl p-8 space-y-8">
           {/* Quick Stats Grid */}
           <div className="grid grid-cols-3 gap-4 border-b border-[#EAE1D8] pb-8">
              <div className="text-center space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30">Reviews</p>
                 <p className="text-lg font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>{photographer.reviews}</p>
              </div>
              <div className="text-center border-x border-[#EAE1D8] space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30">Rating</p>
                 <p className="text-lg font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>{photographer.rating} ★</p>
              </div>
              <div className="text-center space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30">Pricing</p>
                 <p className="text-lg font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>{photographer.price}</p>
              </div>
           </div>

           {/* Cinematic Stories Row */}
           <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#3D2B2B]/40">Cinematic Stories</h3>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                 {photographer.stories.map(story => (
                   <div key={story.id} className="flex-shrink-0 text-center space-y-2">
                      <div className="w-16 h-16 rounded-full p-1 border-2 border-[#BE185D] ring-2 ring-white">
                         <img src={story.thumb} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <span className="text-[9px] font-bold text-[#3D2B2B]">{story.title}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Details Section */}
           <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>The Creative Philosophy</h3>
              <p className="text-sm leading-relaxed text-[#3D2B2B]/60 italic">
                "{photographer.description}"
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                 {photographer.speciality.map(s => (
                   <span key={s} className="px-4 py-1.5 rounded-full bg-[#EAE1D8]/30 text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]">
                     {s}
                   </span>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* 3. Portfolio Masterpieces - Masonry-style Grid */}
      <div className="px-5 mt-10 space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#3D2B2B]" style={{ fontFamily: '"Playfair Display", serif' }}>Portfolio</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#3D2B2B]/30">67 Media Assets</span>
         </div>

         <div className="columns-2 gap-4 space-y-4">
            {photographer.portfolio.map((img, i) => (
              <div key={i} className="rounded-3xl overflow-hidden shadow-sm ring-1 ring-black/5">
                 <img src={img} alt="Portfolio item" className="w-full h-auto object-cover" />
              </div>
            ))}
         </div>

         <button className="w-full py-4 rounded-3xl border border-[#3D2B2B]/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#3D2B2B]">
            Discover full gallery
         </button>
      </div>

      {/* 4. Editorial Contact Bar */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
         <div className="bg-[#3D2B2B] rounded-full p-2.5 flex items-center justify-between shadow-2xl">
            <div className="pl-6">
               <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Packages from</p>
               <p className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{photographer.price}</p>
            </div>
            
            <div className="flex gap-2">
               <button 
                onClick={() => window.open('https://wa.me/919876543210', '_blank')}
                className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center active:scale-95 transition-all"
               >
                  <Icon name="chat" size="sm" color="white" />
               </button>
               <button 
                className="px-8 py-4 rounded-full bg-white text-[#3D2B2B] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
               >
                  Contact Now
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PhotographerDetail;
