import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard"); // go to dashboard after login
    } catch (err) {
      setError(err.message); // show only error message without "Firebase: " prefix
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-cyan-800 mb-6 text-center">
          Welcome Back, Please Login
        </h2>

        {error && (
          <p className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <input type="checkbox" id="remember-me" className="mr-2" />
          <label htmlFor="remember-me" className="text-sm text-gray-600">
            Remember me
          </label>

          <button
            type="submit"
            className="w-full bg-cyan-800 hover:bg-cyan-700 text-white py-2 rounded-lg font-medium transition duration-200"
          >
            Login
          </button>
          <p className="text-md text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-800">
              create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
