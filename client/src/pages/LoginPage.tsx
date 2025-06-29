import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/resources/errorMessages';
import { ApiErrorResponse, ErrorCodes } from '@fullstack/common';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { Card } from '@/components/ui-kit/Card';
import { SIGNUP_PATH } from '@/routes/routeConfig';

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
      navigate('/');
    } catch (err) {
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <Card className="w-full max-w-sm p-8 flex flex-col gap-6 shadow-lg">
        <h2 className="text-2xl font-bold text-center">Log In</h2>
        {error && (
          <div className="text-sm mb-2 p-2 bg-destructive/10 border border-destructive text-destructive rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            disabled={isLoggingIn}
            autoFocus
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            disabled={isLoggingIn}
          />
          <Button type="submit" disabled={isLoggingIn} className="w-full">
            {isLoggingIn ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
        <Button
          variant="link"
          className="w-full text-center text-primary mt-2"
          type="button"
          onClick={() => navigate(SIGNUP_PATH)}
        >
          Don&apos;t have an account? Sign Up
        </Button>
      </Card>
    </div>
  );
}

export default LoginPage;
