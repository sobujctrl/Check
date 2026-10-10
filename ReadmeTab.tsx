import React from 'react';
import { BookOpen, Terminal, Webhook, Shield, Key } from 'lucide-react';

export const ReadmeTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 dark:from-emerald-950 dark:to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="w-7 h-7" />
          API Integration Guide & README
        </h2>
        <p className="text-emerald-100 text-sm sm:text-base max-w-2xl">
          ফেক অর্ডার চেকার (Fake Order Checker) অ্যাপটির ওয়েবহুক ইন্টিগ্রেশন এবং কোড স্ট্রাকচার গাইড।
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Section 1: Webhook Request & Response */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-600" />
            1. Webhook Request & Response Format
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            অ্যাপটি আপনার কনফিগার করা Webhook URL-এ POST রিকোয়েস্ট পাঠায়।
          </p>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Request Payload (POST):</span>
            <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-slate-800 dark:text-slate-200 overflow-x-auto">
{`{
  "phone": "01712345678"
}`}
            </pre>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Expected Response Format (JSON):</span>
            <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-slate-800 dark:text-slate-200 overflow-x-auto">
{`{
  "couriers": [
    { "courier": "Steadfast", "total": 5, "delivered": 4, "cancelled": 1 },
    { "courier": "Pathao", "total": 3, "delivered": 3, "cancelled": 0 },
    { "courier": "Redx", "total": 2, "delivered": 1, "cancelled": 1 },
    { "courier": "Carrybee", "total": 0, "delivered": 0, "cancelled": 0 },
    { "courier": "Paperfly", "total": 0, "delivered": 0, "cancelled": 0 }
  ],
  "remaining_quota": 450
}`}
            </pre>
          </div>
        </div>

        {/* Section 2: Where to edit normalizeResponse */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-teal-600" />
            2. Where to Edit <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">normalizeResponse</code>
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            যদি আপনার থার্ড-পার্টি এপিআই রেসপন্স ফরম্যাট ভিন্ন হয়, তবে আপনি <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">src/services/fraudApi.ts</code> ফাইলের ভিতরে অবস্থিত <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">normalizeResponse(raw)</code> ফাংশনটি এডিট করে সহজেই আপনার এপিআইয়ের সাথে মেলাতে পারবেন।
          </p>
        </div>

        {/* Section 3: API Keys Security */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            3. API Keys Security Note
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            নিরাপত্তা নিশ্চিত করতে এপিআই কি (API keys) বা সিক্রেট টোকেন কখনোই ফ্রন্টএন্ড সোর্স কোডে হার্ডকোড করা হয় না। ব্যবহারকারী Settings পেজে যে সিক্রেট টোকেন দেন তা নিরাপদে ব্রাউজারের <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">localStorage</code>-এ সংরক্ষিত থাকে এবং রিকোয়েস্টের সময় Authorization হেডার হিসেবে পাস হয়।
          </p>
        </div>
      </div>
    </div>
  );
};
