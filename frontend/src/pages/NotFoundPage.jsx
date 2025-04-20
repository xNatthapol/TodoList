import React from "react";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="text-center mt-20 px-4">
      <h2 className="text-6xl font-extrabold text-indigo-600 mb-4">404</h2>
      <h3 className="text-2xl font-semibold text-gray-800 mb-3">
        Oops! Page Not Found.
      </h3>
      <p className="text-gray-600 mb-8">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link
        to="/"
        className="inline-block py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-md transition duration-150 ease-in-out"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
