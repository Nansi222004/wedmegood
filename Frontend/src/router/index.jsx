import { useEffect, useLayoutEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Instantly resets scroll position on page mount before browser paint
const ScrollReset = () => {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  return null;
};

// Determines horizontal index of route (0 = leftmost tab, 4 = rightmost tab)
const getRouteIndex = (path) => {
  if (!path) return 0;
  if (path === '/user/home' || path === '/user/dashboard' || path === '/user/legacy-dashboard') return 0;

  // Discover & Vendor category
  if (
    path.startsWith('/user/vendor') ||
    path.startsWith('/user/search') ||
    path.startsWith('/user/photographer') ||
    path.startsWith('/user/venue') ||
    path.startsWith('/user/makeup') ||
    path.startsWith('/user/decorator') ||
    path.startsWith('/user/inspiration') ||
    path.startsWith('/user/trending') ||
    path.startsWith('/user/bridal-looks') ||
    path.startsWith('/user/decor') ||
    path.startsWith('/user/special-offers') ||
    path.startsWith('/user/news')
  ) {
    return 1;
  }

  // Create Event & Planning Tools category
  if (
    path.startsWith('/user/requirements') ||
    path.startsWith('/user/planning') ||
    path.startsWith('/user/wedding-') ||
    path.startsWith('/user/tools') ||
    path.startsWith('/user/budget') ||
    path.startsWith('/user/checklist') ||
    path.startsWith('/user/guest') ||
    path.startsWith('/user/timeline') ||
    path.startsWith('/user/calendar') ||
    path.startsWith('/user/festivals') ||
    path.startsWith('/user/horoscope') ||
    path.startsWith('/user/e-invite') ||
    path.startsWith('/user/ai-assistant') ||
    path.startsWith('/user/genie-services')
  ) {
    return 2;
  }

  // Saved / Favourites / Bookings category
  if (
    path.startsWith('/user/favourite') ||
    path.startsWith('/user/shortlist') ||
    path.startsWith('/user/booking') ||
    path.startsWith('/user/quote') ||
    path.startsWith('/user/cart') ||
    path.startsWith('/user/checkout')
  ) {
    return 3;
  }

  // Profile & Account & Settings category
  if (
    path.startsWith('/user/account') ||
    path.startsWith('/user/family') ||
    path.startsWith('/user/chat') ||
    path.startsWith('/user/notification') ||
    path.startsWith('/user/privacy') ||
    path.startsWith('/user/language') ||
    path.startsWith('/user/help') ||
    path.startsWith('/user/faq')
  ) {
    return 4;
  }

  return 2;
};

// Directional page animation variants - strictly horizontal with locked Y-axis
const pageTransitionVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 40 : -40,
    y: 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 380, damping: 34, mass: 0.6 },
      opacity: { duration: 0.20, ease: [0.22, 1, 0.36, 1] },
    },
  },
  exit: (dir) => ({
    x: dir > 0 ? -40 : 40,
    y: 0,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 380, damping: 34, mass: 0.6 },
      opacity: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
    },
  }),
};

import { useAuth } from '../contexts/AuthContext';
import Welcome from '../components/welcome/Welcome';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Signup from '../modules/user/auth/Signup';
import Login from '../modules/user/auth/Login';
import ForgotPassword from '../modules/user/auth/ForgotPassword';
import ResetPassword from '../modules/user/auth/ResetPassword';
import UserHome from '../modules/user/home/UserHome';
import RequirementsForm from '../modules/user/requirements/RequirementsForm';
import PlanningDetails from '../modules/user/requirements/PlanningDetails';
import WeddingForm from '../modules/user/requirements/WeddingForm';
import WeddingDetailsForm from '../modules/user/requirements/WeddingDetailsForm';
import PlanningDashboard from '../modules/user/requirements/PlanningDashboard';
import VendorsMain from '../modules/user/vendors/VendorsMain';
import VendorsList from '../modules/user/vendors/VendorsList';
import VendorDetail from '../modules/user/vendors/VendorDetail';
import VendorComparison from '../modules/user/vendors/VendorComparison';
import Cart from '../modules/user/cart/Cart';
import Checkout from '../modules/user/cart/Checkout';
import Account from '../modules/user/account/Account';
import Profile from '../modules/user/account/Profile';
import Contact from '../modules/user/account/Contact';
import Reviews from '../modules/user/account/Reviews';
import Payments from '../modules/user/account/Payments';
import Privacy from '../modules/user/settings/Privacy';
import Language from '../modules/user/settings/Language';
import Notifications from '../modules/user/settings/Notifications';
import ChatsList from '../modules/user/chats/ChatsList';
import VendorChat from '../modules/user/chats/VendorChat';
import Search from '../modules/user/search/Search';
import News from '../modules/user/news/News';
import BudgetPlanner from '../modules/user/tools/BudgetPlanner';
import WeddingChecklist from '../modules/user/tools/WeddingChecklist';
import WeddingTimeline from '../modules/user/tools/WeddingTimeline';
import GuestList from '../modules/user/tools/GuestList';
import VendorManagement from '../modules/user/tools/VendorManagement';
import InspirationBoard from '../modules/user/tools/InspirationBoard';
import AIAssistant from '../modules/user/ai/AIAssistant';
import QuotationComparison from '../modules/user/quotes/QuotationComparison';
import FamilyContacts from '../modules/user/family/FamilyContacts';
import CreateGroup from '../modules/user/family/CreateGroup';
import GroupChat from '../modules/user/family/GroupChat';
import FamilyGroups from '../modules/user/family/FamilyGroups';
import JoinFamilyGroup from '../modules/user/family/JoinFamilyGroup';
import JoinFamilyGroupGeneral from '../modules/user/family/JoinFamilyGroupGeneral';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import PlaceholderPage from '../components/common/PlaceholderPage';
import Inspirations from '../modules/user/inspirations/Inspirations';
import InspirationDetail from '../modules/user/inspirations/InspirationDetail';
import BridalLooks from '../modules/user/inspirations/BridalLooks';
import DecorIdeas from '../modules/user/inspirations/DecorIdeas';
import FeaturedVideo from '../modules/user/inspirations/FeaturedVideo';
import RealWedding from '../modules/user/inspirations/RealWedding';
import EInvites from '../modules/user/invites/EInvites';
import EditInvite from '../modules/user/invites/EditInvite';
import PreviewInvite from '../modules/user/invites/PreviewInvite';
import PublicInvite from '../modules/user/invites/PublicInvite';
import Photographers from '../modules/user/photographers/Photographers';
import PhotographerDetail from '../modules/user/photographers/PhotographerDetail';
import PhotographerCollection from '../modules/user/photographers/PhotographerCollection';
import VenueCollection from '../modules/user/venues/VenueCollection';
import VenueBooking from '../modules/user/venues/VenueBooking';
import Makeup from '../modules/user/makeup/Makeup';
import MakeupDetail from '../modules/user/makeup/MakeupDetail';
import SpecialOffers from '../modules/user/offers/SpecialOffers';
import VenueBookingOffer from '../modules/user/offers/VenueBookingOffer';
import GenieServices from '../modules/user/services/GenieServices';
import Decorators from '../modules/user/decorators/Decorators';
import DecoratorDetail from '../modules/user/decorators/DecoratorDetail';
import Trending from '../modules/user/trending/Trending';
import Festivals from '../modules/user/calendar/Festivals';
import Horoscope from '../modules/user/calendar/Horoscope';
import WeddingCalendar from '../modules/user/calendar/WeddingCalendar';
import ThemeSystemTest from '../components/demo/ThemeSystemTest';
import Shortlist from '../modules/user/shortlist/Shortlist';
import Favourites from '../modules/user/favourites/Favourites';
import Help from '../modules/user/help/Help';
import Dashboard from '../modules/user/dashboard/Dashboard';
import MyBookings from '../modules/user/bookings/MyBookings';
import VendorRoutes from '../modules/vendor/routes';
import AdminRoutes from '../modules/admin/routes';

const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Track horizontal navigation direction between routes
  const lastPathRef = useRef(location.pathname);
  const directionRef = useRef(1);

  if (lastPathRef.current !== location.pathname) {
    const prevIdx = getRouteIndex(lastPathRef.current);
    const currIdx = getRouteIndex(location.pathname);
    if (currIdx !== prevIdx) {
      directionRef.current = currIdx > prevIdx ? 1 : -1;
    } else {
      const prevDepth = lastPathRef.current.split('/').filter(Boolean).length;
      const currDepth = location.pathname.split('/').filter(Boolean).length;
      directionRef.current = currDepth >= prevDepth ? 1 : -1;
    }
    lastPathRef.current = location.pathname;
  }

  const direction = directionRef.current;

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-card">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root - Home for logged-in users, Welcome otherwise (ProtectedRoute redirects guests here, so this must not redirect back) */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/user/home" replace /> : <Welcome />} />

      {/* Public Digital Wedding Invitation Route (No Auth Required) */}
      <Route path="/invite/:slug" element={<PublicInvite />} />

      {/* Public Family Group Invitation Route (No Auth Required for Preview) */}
      <Route path="/family/join/:token" element={<JoinFamilyGroup />} />
      <Route path="/user/family/join/:token" element={<JoinFamilyGroup />} />
      <Route path="/family/join-group/:token" element={<JoinFamilyGroupGeneral />} />
      <Route path="/user/family/join-group/:token" element={<JoinFamilyGroupGeneral />} />

      {/* Route alias for vender misspelling */}
      <Route path="/vender/*" element={<Navigate to="/vendor" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to={new URLSearchParams(location.search).get('redirect') || "/user/home"} replace />
        ) : <Login />
      } />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/signup" element={
        isAuthenticated ? (
          <Navigate to={new URLSearchParams(location.search).get('redirect') || "/user/wedding-details"} replace />
        ) : <Signup />
      } />
      <Route path="/register" element={
        isAuthenticated ? (
          <Navigate to={new URLSearchParams(location.search).get('redirect') || "/user/wedding-details"} replace />
        ) : <Signup />
      } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/user/forgot-password" element={<ForgotPassword />} />
      <Route path="/user/reset-password" element={<ResetPassword />} />

      <Route path="/vendor/*" element={<VendorRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* Protected Routes */}
      <Route path="/user/*" element={
        <ProtectedRoute>
          <Routes>
            {/* Wedding Details - No Header/BottomNav */}
            <Route path="wedding-details" element={<WeddingDetailsForm />} />

            {/* All other routes with Header/BottomNav */}
            <Route path="*" element={
              <div className="min-h-screen relative overflow-x-hidden max-w-full">
                <div 
                  className="fixed inset-0 z-[-1]" 
                  style={{ 
                    backgroundImage: location.pathname === '/user/legacy-dashboard' ? "url('/dashboardbackgroundimage.png')" : 'none', 
                    backgroundSize: '100% 100%', 
                    backgroundPosition: 'center', 
                    backgroundColor: (location.pathname.startsWith('/user/family/group/') || location.pathname.startsWith('/user/chats/'))
                      ? '#ffffff'
                      : (location.pathname.startsWith('/user/vendor/') || location.pathname.startsWith('/user/photographer/') || location.pathname.startsWith('/user/decorator/') || location.pathname.startsWith('/user/makeup/'))
                        ? '#FAF7F2'
                        : '#EDE8E1',
                    backgroundRepeat: 'no-repeat'
                  }} 
                />
                <Header />
                <main className={(
                  location.pathname.startsWith('/user/family/group/') ||
                  location.pathname.startsWith('/user/chats/') ||
                  location.pathname.startsWith('/user/vendor/') ||
                  location.pathname.startsWith('/user/photographer/') ||
                  location.pathname.startsWith('/user/decorator/') ||
                  location.pathname.startsWith('/user/makeup/') ||
                  location.pathname === '/user/home' ||
                  location.pathname === '/user/dashboard'
                ) ? "relative z-0 min-h-[calc(100vh-140px)] overflow-x-hidden" : "pb-16 md:pb-0 relative z-0 min-h-[calc(100vh-140px)] overflow-x-hidden"}>
                  <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.div
                      key={location.pathname}
                      custom={direction}
                      variants={pageTransitionVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full"
                      style={{ transformOrigin: 'top center' }}
                    >
                      <ScrollReset />
                      <Routes location={location}>
                    <Route path="dashboard" element={<UserHome />} />
                    <Route path="home" element={<UserHome />} />
                    <Route path="legacy-dashboard" element={<Dashboard />} />
                    <Route path="search" element={<Search />} />
                    <Route path="news" element={<News />} />
                    <Route path="requirements" element={<RequirementsForm />} />
                    <Route path="requirements/planning-details" element={<PlanningDetails />} />
                    <Route path="wedding-form" element={<WeddingForm />} />
                    <Route path="planning-dashboard" element={<PlanningDashboard />} />
                    <Route path="vendors" element={<VendorsMain />} />
                    <Route path="vendors/:category" element={<VendorsList />} />
                    <Route path="vendor/:vendorId" element={<VendorDetail />} />
                    <Route path="vendor-comparison" element={<VendorComparison />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="chats" element={<ChatsList />} />
                    <Route path="chats/:vendorId" element={<VendorChat />} />
                    <Route path="ai-assistant" element={<AIAssistant />} />

                    {/* Family Group Routes */}
                    <Route path="family/contacts" element={<FamilyContacts />} />
                    <Route path="family/create-group" element={<CreateGroup />} />
                    <Route path="family/group/:groupId" element={<GroupChat />} />
                    <Route path="family/groups" element={<FamilyGroups />} />
                    <Route path="family/join/:token" element={<JoinFamilyGroup />} />
                    <Route path="family/join-group/:token" element={<JoinFamilyGroupGeneral />} />

                    <Route path="account" element={<Account />} />
                    <Route path="account/profile" element={<Profile />} />
                    <Route path="account/contact" element={<Contact />} />
                    <Route path="account/reviews" element={<Reviews />} />
                    <Route path="account/payments" element={<Payments />} />

                    {/* Settings Routes */}
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="language" element={<Language />} />
                    <Route path="notifications" element={<Notifications />} />

                    {/* Planning Tools Routes */}
                    <Route path="tools/budget" element={<BudgetPlanner />} />
                    <Route path="tools/checklist" element={<WeddingChecklist />} />
                    <Route path="tools/timeline" element={<WeddingTimeline />} />
                    <Route path="tools/guests" element={<GuestList />} />
                    <Route path="tools/vendors" element={<VendorManagement />} />
                    <Route path="tools/inspiration" element={<InspirationBoard />} />

                    {/* Quick Access Routes */}
                    <Route path="bookings" element={<MyBookings initialTab="bookings" />} />
                    <Route path="quotes" element={<MyBookings initialTab="quotes" />} />
                    <Route path="quotes/compare" element={<QuotationComparison />} />
                    <Route path="shortlist" element={<Shortlist />} />
                    <Route path="favourites" element={<Favourites />} />

                    {/* Inspiration & Ideas Routes */}
                    <Route path="inspirations" element={<Inspirations />} />
                    <Route path="inspirations/:id" element={<InspirationDetail />} />
                    <Route path="real-weddings/:id" element={<RealWedding />} />
                    <Route path="bridal-looks/:category" element={<BridalLooks />} />
                    <Route path="decor/:category" element={<DecorIdeas />} />
                    <Route path="trending/:category" element={<PlaceholderPage title="Trending Now" description="Discover what's trending in weddings" icon="trending" />} />
                    <Route path="feed/:id" element={<PlaceholderPage title="Wedding Feed" description="Explore wedding ideas and trends" icon="grid" />} />
                    <Route path="reads/:id" element={<PlaceholderPage title="Wedding Article" description="Read interesting wedding tips and guides" icon="book" />} />

                    {/* Vendor Collection Routes */}
                    <Route path="photographers/:collection" element={<PhotographerCollection />} />
                    <Route path="venues/:collection" element={<VenueCollection />} />
                    <Route path="makeup/:id" element={<PlaceholderPage title="Makeup Artist" description="View makeup artist profile and portfolio" icon="makeup" />} />
                    <Route path="decorator/:id" element={<PlaceholderPage title="Decorator" description="View decorator profile and work" icon="palette" />} />
                    <Route path="photographer/:id" element={<PhotographerDetail />} />

                    {/* Service Routes */}
                    <Route path="special-offers" element={<SpecialOffers />} />
                    <Route path="venue-booking-offer" element={<VenueBookingOffer />} />
                    <Route path="genie-services" element={<GenieServices />} />
                    <Route path="venue-booking" element={<VenueBooking />} />
                    <Route path="photographers" element={<Photographers />} />
                    <Route path="makeup" element={<Makeup />} />
                    <Route path="makeup/:vendorId" element={<MakeupDetail />} />
                    <Route path="decorators" element={<Decorators />} />
                    <Route path="decorator/:vendorId" element={<DecoratorDetail />} />
                    <Route path="trending" element={<Trending />} />
                    <Route path="featured-video" element={<FeaturedVideo />} />
                    <Route path="reads" element={<PlaceholderPage title="Wedding Reads" description="Browse all wedding articles and guides" icon="book" />} />

                    {/* Traditional Calendar Routes */}
                    <Route path="calendar" element={<WeddingCalendar />} />
                    <Route path="festivals" element={<Festivals />} />
                    <Route path="horoscope" element={<Horoscope />} />

                    {/* Wedding Planning Tools */}
                    <Route path="budget-planner" element={
                      <PlaceholderPage
                        title="Budget Planner"
                        description="Plan and track your wedding expenses with our smart budget management tool."
                        icon="money"
                      />
                    } />
                    <Route path="checklist" element={
                      <PlaceholderPage
                        title="Wedding Checklist"
                        description="Never miss a detail with our comprehensive wedding planning checklist."
                        icon="checkList"
                      />
                    } />
                    <Route path="guest-list" element={
                      <PlaceholderPage
                        title="Guest List Manager"
                        description="Organize your guest list, track RSVPs, and manage invitations effortlessly."
                        icon="users"
                      />
                    } />
                    <Route path="timeline" element={
                      <PlaceholderPage
                        title="Wedding Timeline"
                        description="Create and manage your wedding day timeline to ensure everything runs smoothly."
                        icon="clock"
                      />
                    } />
                    <Route path="vendor-comparison" element={
                      <PlaceholderPage
                        title="Vendor Comparison"
                        description="Compare vendors side by side to make the best choice for your wedding."
                        icon="compare"
                      />
                    } />
                    <Route path="e-invites" element={<EInvites />} />
                    <Route path="e-invites/create" element={<PlaceholderPage title="Create E-Invite" description="Design your custom digital invitation" icon="edit" />} />
                    <Route path="e-invites/edit/:id" element={<EditInvite />} />
                    <Route path="e-invites/preview/:id" element={<PreviewInvite />} />
                    <Route path="e-invites/customize/:templateId" element={<PlaceholderPage title="Customize Template" description="Customize your chosen template" icon="edit" />} />

                    {/* Premium Services */}
                    <Route path="hire-planner" element={<PlaceholderPage title="Hire Planner" description="Connect with planners" icon="user" />} />

                    {/* Support & Settings */}
                    <Route path="help" element={<Help />} />
                    <Route path="faqs" element={<PlaceholderPage title="FAQs" description="Answers to questions" icon="question" />} />

                    <Route path="language" element={<Language />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="privacy" element={<Privacy />} />

                    {/* Redirect unknown user routes to home */}
                    <Route path="*" element={<Navigate to="/user/home" replace />} />
                  </Routes>
                    </motion.div>
                  </AnimatePresence>
                </main>
                <BottomNav />
              </div>
            } />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Legacy/Misc Routes */}
      <Route path="/theme-test" element={<ThemeSystemTest />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
