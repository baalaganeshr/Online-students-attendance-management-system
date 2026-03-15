/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import StudentPortal from './components/StudentPortal';
import AdminDashboard from './components/AdminDashboard';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [view, setView] = useState<'student' | 'admin'>('student');

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-zinc-900 selection:bg-zinc-200 relative overflow-hidden">
      {/* Subtle background gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-zinc-100/80 to-transparent pointer-events-none -z-10"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-50/50 blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-50/50 blur-[120px] pointer-events-none -z-10"></div>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-zinc-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md shadow-zinc-900/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-zinc-900 tracking-tight leading-none">GeoAttend</h1>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mt-0.5">Mahalakshmi College</p>
            </div>
          </div>
          
          <nav className="flex gap-1 bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/50">
            <button
              onClick={() => setView('student')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                view === 'student' 
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setView('admin')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                view === 'admin' 
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {view === 'student' ? <StudentPortal /> : <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
