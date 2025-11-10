
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { I18nProvider } from './hooks/useI18n';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import LetterListPage from './components/letters/LetterListPage';
import LetterDetailPage from './components/letters/LetterDetailPage';
import LetterChatPage from './components/letters/LetterChatPage';
import Layout from './components/layout/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LetterListPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/letter/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LetterDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/letter/:id/chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LetterChatPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
