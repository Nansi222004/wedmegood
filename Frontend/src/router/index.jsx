import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Welcome from '../components/welcome/Welcome';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Signup from '../modules/user/auth/Signup';
import Login from '../modules/user/auth/Login';
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
import FamilyContacts from '../modules/user/family/FamilyContacts';
import CreateGroup from '../modules/user/family/CreateGroup';
import GroupChat from '../modules/user/family/GroupChat';
import FamilyGroups from '../modules/user/family/FamilyGroups';
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
      {/* Root - Always show Welcome page on load */}
      <Route path="/" element={<Welcome />} />

      {/* Route alias for vender misspelling */}
      <Route path="/vender/*" element={<Navigate to="/vendor" replace />} />

      {/* Auth Routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/user/dashboard" replace /> : <Login />
      } />
      <Route path="/signup" element={
        isAuthenticated ? <Navigate to="/user/wedding-details" replace /> : <Signup />
      } />

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
              <div className="min-h-screen bg-theme-card">
                <Header />
                <main className="pb-16 md:pb-0">
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="home" element={<UserHome />} />
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
                    <Route path="bookings" element={<MyBookings />} />
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

                    {/* Redirect unknown user routes to dashboard */}
                    <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
                  </Routes>
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
