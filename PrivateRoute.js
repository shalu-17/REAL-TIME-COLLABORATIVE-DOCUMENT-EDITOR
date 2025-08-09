import React from "react";
import { Navigate } from "react-router-dom";

// PrivateRoute component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  // Check if a token exists in localStorage (indicating user is logged in)
  const token = localStorage.getItem("token");

  // If token exists, render the protected component (children)
  // Otherwise, redirect user to the login page
  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
