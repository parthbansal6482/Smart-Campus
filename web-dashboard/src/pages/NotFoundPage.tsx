import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
    <p className="text-[13px] text-ink-3">Error 404</p>
    <h1 className="font-serif text-[56px] leading-tight text-ink mt-2">Page not found</h1>
    <p className="text-sm text-ink-3 mt-3 max-w-sm">The page you’re looking for doesn’t exist or has moved.</p>
    <Link to="/" className="mt-8">
      <Button variant="secondary">Back to dashboard</Button>
    </Link>
  </div>
);
