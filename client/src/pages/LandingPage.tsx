import React from 'react';
import { Button } from '@/components/ui-kit/Button';
import { useNavigate } from 'react-router-dom';
import { LOGIN_PATH, SIGNUP_PATH } from '@/routes/routeConfig';
import { Label } from '@/components/ui-kit/Label';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: 'url(/backgroundImages/landing.webp)' }}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
        <Label className="mb-4 text-center font-bold text-4xl text-white drop-shadow">Welcome to Renwu</Label>
        <p className="text-lg mb-8 text-center max-w-xl text-white drop-shadow">
          A task manager to organize your tasks, manage your projects, and boost your productivity with a modern, collaborative task management app.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate(LOGIN_PATH)} size="lg">Log In</Button>
          <Button onClick={() => navigate(SIGNUP_PATH)} size="lg" variant="outline">Sign Up</Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
