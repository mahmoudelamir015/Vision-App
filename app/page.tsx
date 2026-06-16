'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { User, Users, GraduationCap, Lock, ArrowRight, Eye, EyeOff, Moon, Sun, Phone } from 'lucide-react';

type Role = 'student' | 'teacher' | 'parent';
type ViewState = 'login' | 'signup' | 'forgot_password';

export default function AuthPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<ViewState>('login');
  const [role, setRole] = useState<Role>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  const [studentStage, setStudentStage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'teacher') {
      router.push('/teacher/dashboard');
    } else if (role === 'student') {
      router.push('/student/dashboard');
    } else {
      router.push('/parent/dashboard');
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#0A2540] flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut", repeatType: "reverse", repeat: Infinity }}
          className="relative"
        >
          {/* Outer glow */}
          <div className="absolute inset-0 bg-[#D4AF37] blur-[100px] opacity-20 rounded-full"></div>
          <div className="text-white text-4xl font-extrabold text-center relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]">
            <Image 
              src="/logo.png" 
              alt="Vision Educational Center" 
              width={256}
              height={256}
              className="w-48 h-48 md:w-64 md:h-64 object-contain mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  const roleData = [
    { id: 'student', label: 'طالب', icon: User },
    { id: 'parent', label: 'ولي أمر', icon: Users },
    { id: 'teacher', label: 'معلم', icon: GraduationCap },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#061524] flex flex-col items-center justify-center p-4 relative overflow-hidden font-cairo transition-colors duration-300" dir="rtl">
      
      {/* Theme Toggle Top Left */}
      <div className="absolute top-6 left-6 z-50">
        <button onClick={toggleDarkMode} className="p-3 bg-white dark:bg-[#061524] text-slate-600 dark:text-slate-300 rounded-full border border-black/5 dark:border-white/5 shadow-sm hover:scale-105 transition-transform">
           {isDarkMode ? <Sun className="w-6 h-6 text-[#D4AF37]" /> : <Moon className="w-6 h-6 text-[#0A2540]" />}
        </button>
      </div>

      {/* Glassmorphism Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Glass Card */}
        <div className="bg-white/70 dark:bg-[#0A2540]/60 backdrop-blur-xl border border-white/50 dark:border-white/20 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden transition-colors">
          
          {/* Inner subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>

          {/* Logo Heading */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={96}
              height={96}
              className="mb-4 h-24 w-24 object-contain drop-shadow-xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="text-3xl font-extrabold text-[#0A2540] dark:text-white text-center tracking-tight">
              {view === 'login' ? 'تسجيل الدخول' : view === 'signup' ? 'إنشاء حساب جديد' : 'استعادة كلمة المرور'}
            </h1>
            <p className="text-slate-500 dark:text-white/60 text-sm mt-2 font-bold">
              {view === 'forgot_password' ? 'أدخل رقم الهاتف المرتبط بحسابك' : 'مرحباً بك في منصة رؤية التعليمية'}
            </p>
          </div>

          {/* Role Switcher Tabs */}
          {view !== 'forgot_password' && (
            <div className="flex p-1 bg-slate-200/50 dark:bg-black/20 rounded-2xl mb-8 backdrop-blur-sm border border-black/5 dark:border-white/5 relative">
              {roleData.map((r) => {
                const Icon = r.icon;
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 relative z-10 transition-colors duration-300 ${isActive ? 'text-white dark:text-[#0A2540]' : 'text-slate-500 dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-bold">{r.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="role-pill"
                        className="absolute inset-0 bg-[#0A2540] dark:bg-gradient-to-br dark:from-[#D4AF37] dark:to-yellow-500 rounded-xl -z-10 shadow-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form 
              key={`${view}-${role}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLoginSubmit}
              className="space-y-5"
            >
              {view === 'signup' && role === 'student' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">الاسم الرباعي</label>
                    <div className="relative">
                      <input type="text" className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="أدخل اسمك الكامل" />
                    </div>
                  </div>
                  <div>
                     <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">المرحلة الدراسية</label>
                     <select value={studentStage} onChange={(e) => setStudentStage(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] appearance-none">
                       <option value="" className="text-slate-500">اختر المرحلة</option>
                       <option value="prep" className="text-black">المرحلة الإعدادية</option>
                       <option value="sec" className="text-black">المرحلة الثانوية</option>
                     </select>
                  </div>
                  {studentStage === 'sec' && (
                    <div>
                       <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">القسم</label>
                       <select className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] appearance-none">
                         <option value="" className="text-slate-500">اختر القسم</option>
                         <option value="sci-math" className="text-black">علمي رياضة</option>
                         <option value="sci-bio" className="text-black">علمي علوم</option>
                         <option value="art" className="text-black">أدبي</option>
                       </select>
                    </div>
                  )}
                </div>
              )}

              {view === 'signup' && role === 'parent' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">أسم ولي الأمر</label>
                    <div className="relative">
                      <input type="text" className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="الاسم الكامل" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">رقم الهاتف</label>
                    <div className="relative">
                      <input type="tel" className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="01X XXXX XXXX" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">كود الطالب للربط</label>
                    <div className="relative">
                      <input type="text" className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium font-mono" placeholder="مثال: VIS-12345" />
                    </div>
                  </div>
                </div>
              )}

              {view === 'signup' && role === 'teacher' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">الاسم</label>
                    <div className="relative">
                      <input type="text" className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="أدخل اسمك" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">رقم الهاتف</label>
                    <div className="relative">
                      <input type="tel" className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="01X XXXX XXXX" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">المادة التي تدرسها</label>
                    <div className="relative">
                       <input type="text" className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="مثال: الرياضيات، الفيزياء" />
                    </div>
                  </div>
                </div>
              )}

              {view === 'forgot_password' ? (
                <div>
                  <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">رقم الهاتف المرتبط بالحساب</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <Phone className="w-5 h-5 text-slate-400 dark:text-white/40" />
                    </div>
                    <input type="tel" required className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 pr-11 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="01X XXXX XXXX" />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold mb-1.5 block">رقم الهاتف أو كود الدخول</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <Phone className="w-5 h-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input type="text" required className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 pr-11 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="01X XXXX XXXX" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[#0A2540]/80 dark:text-white/80 text-sm font-bold block">كلمة المرور</label>
                      {view === 'login' && (
                        <button type="button" onClick={() => setView('forgot_password')} className="text-xs font-bold text-[#D4AF37] hover:underline">نسيت كلمة المرور؟</button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-400 dark:text-white/40" />
                      </div>
                      <input type={showPassword ? "text" : "password"} required className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[#0A2540] dark:text-white placeholder-slate-400 dark:placeholder-white/30 rounded-xl px-4 py-3.5 pr-11 pl-11 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium" placeholder="••••••••"/>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-white/40 hover:text-[#0A2540] dark:hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type={view === 'forgot_password' ? 'button' : 'submit'}
                onClick={() => {
                  if (view === 'forgot_password') {
                    alert('تم إرسال رمز الاستعادة إلى رقم الهاتف.');
                    setView('login');
                  }
                }}
                className="w-full bg-[#0A2540] dark:bg-gradient-to-r dark:from-[#D4AF37] dark:to-yellow-600 text-white dark:text-[#0A2540] font-extrabold text-lg py-4 rounded-xl shadow-lg dark:shadow-[0_10px_20px_rgba(212,175,55,0.3)] hover:shadow-xl dark:hover:shadow-[0_15px_30px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 mt-4 transition-all"
              >
                {view === 'login' ? 'تأكيد الدخول' : view === 'signup' ? 'إنشاء حساب جديد' : 'إرسال رمز الاستعادة'} 
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-8 text-center">
            {view === 'forgot_password' ? (
              <p className="text-slate-500 dark:text-white/60 text-sm font-bold">
                تذكرت كلمة المرور؟{' '}
                <button 
                  onClick={() => setView('login')}
                  className="text-[#0A2540] dark:text-[#D4AF37] hover:text-black dark:hover:text-white transition-colors underline decoration-2 underline-offset-4 ml-1"
                >
                  العودة لتسجيل الدخول
                </button>
              </p>
            ) : (
              <p className="text-slate-500 dark:text-white/60 text-sm font-bold">
                {view === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
                <button 
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                  className="text-[#0A2540] dark:text-[#D4AF37] hover:text-black dark:hover:text-white transition-colors underline decoration-2 underline-offset-4 ml-1"
                >
                  {view === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                </button>
              </p>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
