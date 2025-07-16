"use client";

import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg space-y-3">
        <h1 className="text-3xl font-semibold text-center tracking-wide bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          Body Goal
        </h1>
        <p className="text-center text-gray-500 text-sm">
          Welcome to Your AI Fitness Journey. <br />
          Please login to your account
        </p>

        {/* Manual Login Form */}
        <form action="/login-action" method="POST" className="space-y-3">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-grow border-t" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t" />
        </div>

        {/* Google Sign-In */}
        <form action="/api/auth/google">
          <button
            type="submit"
            className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition"
          >
            <img src="/google.png" alt="Google" className="h-5 w-5" />
            <span className="text-sm text-gray-700 font-medium">
              Sign in with Google
            </span>
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-2">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Register
          </a>
        </p>
      </div>
    </main>
  );
}
