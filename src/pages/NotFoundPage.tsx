import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-rose-500">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold font-heading text-white">
          404 — Page Not Found
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          The requested emergency coordination page does not exist or has been moved.
        </p>
      </div>
      <Link to="/dashboard">
        <Button size="sm" variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
