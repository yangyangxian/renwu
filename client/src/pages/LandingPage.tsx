import React from 'react';
import { Button } from '@/components/ui-kit/Button';
import { useNavigate } from 'react-router-dom';
import { LOGIN_PATH, SIGNUP_PATH } from '@/routes/routeConfig';
import { Label } from '@/components/ui-kit/Label';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
      <Label className="mb-4 text-center font-bold text-4xl">Welcome to Task Manager</Label>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-xl">
        Organize your tasks, manage your projects, and boost your productivity with a modern, collaborative task management app.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => navigate(LOGIN_PATH)} size="lg">Log In</Button>
        <Button onClick={() => navigate(SIGNUP_PATH)} size="lg" variant="outline">Sign Up</Button>
      </div>
    </div>
  );
};

export default LandingPage;
