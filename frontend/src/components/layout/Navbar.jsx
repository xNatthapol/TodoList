import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4 mb-6 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="font-bold text-2xl hover:opacity-90 transition-opacity"
        >
          TodoList
        </Link>
        <div className="space-x-4">
          {isAuthenticated ? (
            <>
              <span className="mr-4 hidden sm:inline">Welcome!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded transition duration-150 ease-in-out text-sm font-medium cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-violet-200 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-1 px-4 rounded transition duration-150 ease-in-out text-sm font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
