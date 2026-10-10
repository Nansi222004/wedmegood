import { useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
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
    x: dir > 0 ? 16 : -16,
    y: 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      x: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
    },
  },
  // The outgoing page must clear quickly: with mode="wait" its exit delays showing the next page
  exit: () => ({
    x: 0,
    y: 0,
    opacity: 0,
    transition: {
      opacity: { duration: 0.07, ease: 'linear' },
    },
  }),
};

import { useAuth } from '../contexts/AuthContext';
const Welcome = lazy(() => import('../components/welcome/Welcome'));
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PageLoader from '../components/common/PageLoader';
const Signup = lazy(() => import('../modules/user/auth/Signup'));
const Login = lazy(() => import('../modules/user/auth/Login'));
const ForgotPassword = lazy(() => import('../modules/user/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../modules/user/auth/ResetPassword'));
const UserHome = lazy(() => import('../modules/user/home/UserHome'));
const RequirementsForm = lazy(() => import('../modules/user/requirements/RequirementsForm'));
const PlanningDetails = lazy(() => import('../modules/user/requirements/PlanningDetails'));
const WeddingForm = lazy(() => import('../modules/user/requirements/WeddingForm'));
const WeddingDetailsForm = lazy(() => import('../modules/user/requirements/WeddingDetailsForm'));
const PlanningDashboard = lazy(() => import('../modules/user/requirements/PlanningDashboard'));
const VendorsMain = lazy(() => import('../modules/user/vendors/VendorsMain'));
const VendorsList = lazy(() => import('../modules/user/vendors/VendorsList'));
const VendorDetail = lazy(() => import('../modules/user/vendors/VendorDetail'));
const VendorComparison = lazy(() => import('../modules/user/vendors/VendorComparison'));
const Cart = lazy(() => import('../modules/user/cart/Cart'));
const Checkout = lazy(() => import('../modules/user/cart/Checkout'));
const Account = lazy(() => import('../modules/user/account/Account'));
const Profile = lazy(() => import('../modules/user/account/Profile'));
const Contact = lazy(() => import('../modules/user/account/Contact'));
const Reviews = lazy(() => import('../modules/user/account/Reviews'));
const Payments = lazy(() => import('../modules/user/account/Payments'));
const Privacy = lazy(() => import('../modules/user/settings/Privacy'));
const Language = lazy(() => import('../modules/user/settings/Language'));
const Notifications = lazy(() => import('../modules/user/settings/Notifications'));
const ChatsList = lazy(() => import('../modules/user/chats/ChatsList'));
const VendorChat = lazy(() => import('../modules/user/chats/VendorChat'));
const Search = lazy(() => import('../modules/user/search/Search'));
const News = lazy(() => import('../modules/user/news/News'));
const BudgetPlanner = lazy(() => import('../modules/user/tools/BudgetPlanner'));
const WeddingChecklist = lazy(() => import('../modules/user/tools/WeddingChecklist'));
const WeddingTimeline = lazy(() => import('../modules/user/tools/WeddingTimeline'));
const GuestList = lazy(() => import('../modules/user/tools/GuestList'));
const VendorManagement = lazy(() => import('../modules/user/tools/VendorManagement'));
const InspirationBoard = lazy(() => import('../modules/user/tools/InspirationBoard'));
const AIAssistant = lazy(() => import('../modules/user/ai/AIAssistant'));
const QuotationComparison = lazy(() => import('../modules/user/quotes/QuotationComparison'));
const FamilyContacts = lazy(() => import('../modules/user/family/FamilyContacts'));
const CreateGroup = lazy(() => import('../modules/user/family/CreateGroup'));
const GroupChat = lazy(() => import('../modules/user/family/GroupChat'));
const FamilyGroups = lazy(() => import('../modules/user/family/FamilyGroups'));
const JoinFamilyGroup = lazy(() => import('../modules/user/family/JoinFamilyGroup'));
const JoinFamilyGroupGeneral = lazy(() => import('../modules/user/family/JoinFamilyGroupGeneral'));
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
const PlaceholderPage = lazy(() => import('../components/common/PlaceholderPage'));
const Inspirations = lazy(() => import('../modules/user/inspirations/Inspirations'));
const InspirationDetail = lazy(() => import('../modules/user/inspirations/InspirationDetail'));
const BridalLooks = lazy(() => import('../modules/user/inspirations/BridalLooks'));
const DecorIdeas = lazy(() => import('../modules/user/inspirations/DecorIdeas'));
const FeaturedVideo = lazy(() => import('../modules/user/inspirations/FeaturedVideo'));
const RealWedding = lazy(() => import('../modules/user/inspirations/RealWedding'));
const EInvites = lazy(() => import('../modules/user/invites/EInvites'));
const EditInvite = lazy(() => import('../modules/user/invites/EditInvite'));
const PreviewInvite = lazy(() => import('../modules/user/invites/PreviewInvite'));
const PublicInvite = lazy(() => import('../modules/user/invites/PublicInvite'));
const Photographers = lazy(() => import('../modules/user/photographers/Photographers'));
const PhotographerDetail = lazy(() => import('../modules/user/photographers/PhotographerDetail'));
const PhotographerCollection = lazy(() => import('../modules/user/photographers/PhotographerCollection'));
const VenueCollection = lazy(() => import('../modules/user/venues/VenueCollection'));
const VenueBooking = lazy(() => import('../modules/user/venues/VenueBooking'));
const Makeup = lazy(() => import('../modules/user/makeup/Makeup'));
const MakeupDetail = lazy(() => import('../modules/user/makeup/MakeupDetail'));
const SpecialOffers = lazy(() => import('../modules/user/offers/SpecialOffers'));
const VenueBookingOffer = lazy(() => import('../modules/user/offers/VenueBookingOffer'));
const GenieServices = lazy(() => import('../modules/user/services/GenieServices'));
const Decorators = lazy(() => import('../modules/user/decorators/Decorators'));
const DecoratorDetail = lazy(() => import('../modules/user/decorators/DecoratorDetail'));
const Trending = lazy(() => import('../modules/user/trending/Trending'));
const Festivals = lazy(() => import('../modules/user/calendar/Festivals'));
const Horoscope = lazy(() => import('../modules/user/calendar/Horoscope'));
const WeddingCalendar = lazy(() => import('../modules/user/calendar/WeddingCalendar'));
const ThemeSystemTest = lazy(() => import('../components/demo/ThemeSystemTest'));
const Shortlist = lazy(() => import('../modules/user/shortlist/Shortlist'));
const Favourites = lazy(() => import('../modules/user/favourites/Favourites'));
const Help = lazy(() => import('../modules/user/help/Help'));
const Dashboard = lazy(() => import('../modules/user/dashboard/Dashboard'));
const MyBookings = lazy(() => import('../modules/user/bookings/MyBookings'));
const FakeVendors = lazy(() => import('../modules/user/fakeVendors/FakeVendors'));
const VendorRoutes = lazy(() => import('../modules/vendor/routes'));
const AdminRoutes = lazy(() => import('../modules/admin/routes'));

// Pages a signed-in user is most likely to open next. They are fetched in the background once the
// first screen is up, so tapping them later is instant instead of waiting for the download.
const PRELOAD_USER_PAGES = [
  () => import('../modules/user/home/UserHome'),
  () => import('../modules/user/vendors/VendorsMain'),
  () => import('../modules/user/vendors/VendorsList'),
  () => import('../modules/user/vendors/VendorDetail'),
  () => import('../modules/user/bookings/MyBookings'),
  () => import('../modules/user/account/Account'),
  () => import('../modules/user/chats/ChatsList'),
  () => import('../modules/user/tools/BudgetPlanner'),
  () => import('../modules/user/tools/WeddingChecklist')
];

const whenIdle = (fn) => (typeof window !== 'undefined' && window.requestIdleCallback
  ? window.requestIdleCallback(fn, { timeout: 4000 })
  : setTimeout(fn, 1500));

// Photos and videos uploaded by vendors and users should not be saved from the user app
const blockMediaSave = (e) => {
  if (e.target instanceof HTMLElement && e.target.closest('img, video')) e.preventDefault();
};

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

  // Warm the cache for the main user pages after the first screen has rendered
  useEffect(() => {
    if (!isAuthenticated || !location.pathname.startsWith('/user')) return undefined;
    let cancelled = false;
    const connection = typeof navigator !== 'undefined' ? navigator.connection : null;
    if (connection?.saveData) return undefined; // respect "data saver"
    const run = async () => {
      for (const load of PRELOAD_USER_PAGES) {
        if (cancelled) return;
        try { await load(); } catch (_) { /* a failed prefetch is harmless; the page loads on demand */ }
        await new Promise((resolve) => whenIdle(resolve));
      }
    };
    const handle = whenIdle(run);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle);
    };
    // Only once per signed-in session, not on every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-card">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
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
              <div
                className="min-h-screen relative overflow-x-hidden max-w-full protect-media"
                onContextMenu={blockMediaSave}
                onDragStart={blockMediaSave}
              >
                <div 
                  className="fixed inset-0 z-[-1]" 
                  style={{ 
                    backgroundImage: location.pathname === '/user/legacy-dashboard' ? "url('/dashboardbackgroundimage.webp')" : 'none', 
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
                      <Suspense fallback={<PageLoader />}>
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
                    <Route path="fake-vendors" element={<FakeVendors />} />

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
                      </Suspense>
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
    </Suspense>
  );
};

export default AppRouter;
