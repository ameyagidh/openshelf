import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';
import ShelvesPage from './pages/ShelvesPage.jsx';
import FeedPage from './pages/FeedPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-stone-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <BrowsePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/books/:id"
        element={
          <ProtectedLayout>
            <BookDetailPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/shelves"
        element={
          <ProtectedLayout>
            <ShelvesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedLayout>
            <FeedPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <ProtectedLayout>
            <ProfilePage />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}
