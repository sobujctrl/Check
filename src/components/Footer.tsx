import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">ফেক অর্ডার চেকার (COD Shield)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          বাংলাদেশের ই-কমার্স উদ্যোক্তা ও সেলারদের জন্য ক্যাশ অন ডেলিভারি ঝুঁকি হ্রাসের নির্ভরযোগ্য সহায়ক।
        </p>
        <p className="text-xs text-slate-400 font-mono">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
};
