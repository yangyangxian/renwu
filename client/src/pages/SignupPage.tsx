import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { getErrorMessage } from '@/resources/errorMessages';
import { ApiErrorResponse, ErrorCodes } from '@fullstack/common';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { Card } from '@/components/ui-kit/Card';

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSigningUp(true);
    try {
      await signup(email, password);
      navigate('/');
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        const apiError = err as ApiErrorResponse;
        setError(getErrorMessage(apiError.code as ErrorCodes));
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: 'url(/backgroundImages/landing.webp)' }}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
        <Card className="w-full max-w-sm p-5 flex flex-col gap-6 shadow-lg bg-card/90">
          <h2 className="text-2xl font-bold text-center">Sign Up</h2>
          {error && (
            <div className="text-sm mb-2 p-2 bg-destructive/10 border border-destructive text-destructive rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={isSigningUp}
              autoFocus
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={isSigningUp}
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
              disabled={isSigningUp}
            />
            <Button type="submit" disabled={isSigningUp} className="w-full">
              {isSigningUp ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full text-center text-primary"
            type="button"
            onClick={() => navigate('/home/login')}
          >
            Already have an account? Log In
          </Button>
        </Card>
      </div>
    </div>
  );
// Removed duplicate JSX block
}

export default SignupPage;
