import { loginUser } from "@/app/action";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  // Login function is now handled by loginUser from action.js

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
        <form action={loginUser} className="space-y-3">
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

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm text-center">
                {error === "missing-fields" &&
                  "Email dan password harus diisi."}
                {error === "invalid-credentials" &&
                  "Email atau password salah."}
                {error === "user-exists" && "Email sudah terdaftar."}
                {![
                  "missing-fields",
                  "invalid-credentials",
                  "user-exists",
                ].includes(error) && "Terjadi kesalahan. Silakan coba lagi."}
              </p>
            </div>
          )}

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
        <a
          href="/api/auth/google"
          className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm text-gray-700 font-medium">
            Sign in with Google
          </span>
        </a>

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
