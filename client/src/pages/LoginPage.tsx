import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/resources/errorMessages';
import { ApiErrorResponse, ErrorCodes, LoginReqSchema } from '@fullstack/common';
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

    const result = LoginReqSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues.map(issue => issue.message).join('<br>'));
      setIsLoggingIn(false);
      return;
    }

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
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: 'url(/backgroundImages/landing.webp)' }}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
        <Card className="w-full max-w-sm p-5 flex flex-col gap-6 shadow-lg bg-card/90">
          <h2 className="text-2xl font-bold text-center">Log In</h2>
          {error && (
            <div dangerouslySetInnerHTML={{__html: error || ''}} className="text-sm p-2 bg-destructive/10 border border-destructive text-destructive rounded">
            </div>
          )}
          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
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
    </div>
  );
// Removed duplicate JSX block
}

export default LoginPage;
