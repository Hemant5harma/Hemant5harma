import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Big gradient 404 label */}
      <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-9xl font-extrabold text-transparent drop-shadow-lg sm:text-[200px]">
        404
      </h1>
      <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-300 md:text-xl">
        Oops! The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Back to home button */}
      <Link
        to="/"
        className="mt-10 inline-block rounded-md bg-gradient-to-r from-primary to-secondary px-8 py-3 text-base font-semibold text-white shadow transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-secondary"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
