import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/resources/errorMessages';
import { ApiErrorResponse, ErrorCodes } from '@fullstack/common';
import { DOCS_PATH, SIGNUP_PATH } from '@/routes/routeConfig';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      await login(email, password);
      navigate(DOCS_PATH);
    } catch (err) {
      // Use centralized error message handling
      if (err && typeof err === 'object' && 'code' in err) {
        const apiError = err as ApiErrorResponse;
        setError(getErrorMessage(apiError.code as ErrorCodes));
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
      <div className="p-8 bg-white shadow-xl rounded-lg w-full max-w-sm">
        <h2 className="text-3xl font-bold mb-6 text-slate-800 text-center">Log In</h2>
        {error && (
          <div className="text-sm mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            disabled={isLoggingIn}
            className="p-3 rounded-md border border-slate-300 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-slate-100" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            disabled={isLoggingIn}
            className="p-3 rounded-md border border-slate-300 text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-slate-100" 
          />
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="p-3 bg-green-600 text-white border-none rounded-lg font-semibold text-base cursor-pointer hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          <p>Demo users:</p>
          <p>• alice@demo.com / demo</p>
        </div>
        <button 
          onClick={() => navigate(SIGNUP_PATH)} 
          className="mt-6 bg-transparent border-none text-green-600 cursor-pointer text-base hover:underline w-full text-center"
        >
          Don't have an account? Sign Up
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
