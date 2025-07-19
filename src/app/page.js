import { getSession } from "../lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  
  // Jika sudah login, cek onboarding dulu
  if (session?.user) {
    const { prisma } = await import("../lib/prisma");
    const userWithOnboarding = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { onboarding: true },
    });
    
    // Redirect ke onboarding jika belum selesai, atau ke dashboard jika sudah
    if (!userWithOnboarding?.onboarding) {
      redirect("/onboarding");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">BodyGoal</div>
        <div className="flex gap-4">
          <a href="/login" className="text-gray-600 hover:text-blue-600 transition">
            Login
          </a>
          <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Daftar
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Capai Tujuan Kebugaran Anda dengan
            <span className="text-blue-600 block">BodyGoal</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Aplikasi web yang membantu Anda mencapai tujuan kebugaran - menurunkan berat badan, 
            membangun otot, atau menjaga kesehatan dengan rencana personal dan tracking kemajuan.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a href="/register" 
               className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg">
              🚀 Mulai Journey Anda
            </a>
            <a href="/login" 
               className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition">
              Sudah Punya Akun?
            </a>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Goal Setting</h3>
              <p className="text-gray-600 leading-relaxed">
                Atur tujuan kebugaran yang spesifik - lose weight, build muscle, atau maintain health 
                dengan target yang realistis.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Smart Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Hitung BMR, kebutuhan kalori harian, dan track progress dengan visualisasi 
                yang mudah dipahami.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">🥗</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Meal & Workout Plans</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate rencana makan dan latihan harian berdasarkan goal dan data tubuh Anda 
                secara otomatis.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Bagaimana Cara Kerjanya?</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold mb-2">Daftar & Login</h4>
                <p className="text-sm text-gray-600">Buat akun dengan Google OAuth</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold mb-2">Setup Goal</h4>
                <p className="text-sm text-gray-600">Input data tubuh dan pilih tujuan</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold mb-2">Get AI Plans</h4>
                <p className="text-sm text-gray-600">Dapatkan rencana meal & workout dari AI</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">4</span>
                </div>
                <h4 className="font-semibold mb-2">Track Progress</h4>
                <p className="text-sm text-gray-600">Monitor kemajuan harian Anda</p>
              </div>
            </div>
          </div>

          {/* AI Integration Highlight */}
          <div className="mt-20 bg-gradient-to-r from-purple-100 to-blue-100 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🤖 AI-Powered Personal Coach</h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Dapatkan rencana makan dan latihan yang dipersonalisasi berdasarkan data tubuh, 
              goal, dan preferensi Anda. AI kami akan membuat plan harian yang sesuai dengan 
              kebutuhan kalori dan target kebugaran Anda.
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">📈 Overview</h4>
                <p className="text-sm text-gray-600">Lihat progress harian, kalori, dan achievement badge</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">🤖 AI Plan</h4>
                <p className="text-sm text-gray-600">Generate meal & workout plans dengan AI</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">📊 Progress</h4>
                <p className="text-sm text-gray-600">Track berat badan dan history perubahan</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">🍽️ Meals</h4>
                <p className="text-sm text-gray-600">Log makanan harian dan hitung kalori</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">💪 Workouts</h4>
                <p className="text-sm text-gray-600">Track latihan dan durasi aktivitas</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-semibold text-gray-800 mb-2">⚙️ Settings</h4>
                <p className="text-sm text-gray-600">Atur profil dan preferensi personal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-4">BodyGoal</div>
          <p className="text-gray-400 mb-6">
            Transform your body, transform your life. Start your fitness journey today.
          </p>
          <div className="flex justify-center gap-6">
            <a href="/register" className="text-blue-400 hover:text-blue-300 transition">
              Get Started
            </a>
            <a href="/login" className="text-gray-400 hover:text-white transition">
              Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
