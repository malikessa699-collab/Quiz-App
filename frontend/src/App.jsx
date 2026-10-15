import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuizGenerator from './pages/QuizGenerator';
import QuizInstructions from './pages/QuizInstructions';
import ActiveQuiz from './pages/ActiveQuiz';
import QuizResults from './pages/QuizResults';
import AnswerReview from './pages/AnswerReview';
import Analytics from './pages/Analytics';
import History from './pages/History';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import LoadingScreen from './components/ui/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate"
        element={
          <ProtectedRoute>
            <Layout>
              <QuizGenerator />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/:id/instructions"
        element={
          <ProtectedRoute>
            <Layout>
              <QuizInstructions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/:id/take"
        element={
          <ProtectedRoute>
            <ActiveQuiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:attemptId"
        element={
          <ProtectedRoute>
            <Layout>
              <QuizResults />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/review/:attemptId"
        element={
          <ProtectedRoute>
            <Layout>
              <AnswerReview />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <History />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <Admin />
            </Layout>
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;