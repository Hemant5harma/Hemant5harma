import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-6 inline-flex rounded-full bg-red-50 p-4 dark:bg-red-900/20">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="mb-2 text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
          404
        </h1>
        
        <h2 className="mb-4 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
          Page Not Found
        </h2>
        
        <p className="mb-8 text-text-light-secondary dark:text-text-dark-secondary">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border-light bg-card-light px-6 py-3 font-semibold text-text-light-primary transition-colors hover:bg-background-light dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary dark:hover:bg-background-dark"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            <Home className="h-5 w-5" />
            Go Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

