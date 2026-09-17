import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-bold text-campus-600 font-mono">404</h1>
      <h2 className="text-xl font-bold text-slate-900 mt-4">Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
};
