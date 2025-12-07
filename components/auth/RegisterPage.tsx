import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate('/');
      // eslint-disable-next-line
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const registerLoginText = t('register.login');
  const registerLoginParts = registerLoginText.split(/[?？]/);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <LanguageSwitcher className="absolute top-4 right-4" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="justify-center" />
          <p className="mt-2 text-slate-600">{t('login.slogan')} 🤖</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">{t('register.title')}</h2>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
             <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">{t('register.displayName')}</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('login.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">{t('login.password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900"
              />
            </div>
            <div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : t('register.button')}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {registerLoginParts.length > 1 ? (
                <>
                {registerLoginParts[0]}?{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                    {registerLoginParts[1]}
                </Link>
                </>
            ) : (
                <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                {registerLoginText}
                </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;