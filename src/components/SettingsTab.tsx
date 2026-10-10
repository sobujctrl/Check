import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Key, Webhook, Trash2, Save, Check, Play, RotateCcw } from 'lucide-react';
import { AppSettings } from '../types';
import { fetchFraudData } from '../services/fraudApi';
import { DEFAULT_CONFIG } from '../config';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearAllData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onClearAllData,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('foc_settings', JSON.stringify(formData));
    localStorage.setItem('foc_settings_v2', JSON.stringify(formData));
    onUpdateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDefault = () => {
    const defaultSettings: AppSettings = {
      demoMode: DEFAULT_CONFIG.demoMode,
      webhookUrl: DEFAULT_CONFIG.webhookUrl,
      webhookToken: DEFAULT_CONFIG.webhookToken,
      secretToken: DEFAULT_CONFIG.webhookToken,
      safeThreshold: DEFAULT_CONFIG.safeThreshold,
      mediumThreshold: DEFAULT_CONFIG.mediumThreshold,
      minOrders: DEFAULT_CONFIG.minOrders,
      minOrderCount: DEFAULT_CONFIG.minOrders,
      darkMode: formData.darkMode,
    };
    setFormData(defaultSettings);
    localStorage.setItem('foc_settings', JSON.stringify(defaultSettings));
    localStorage.setItem('foc_settings_v2', JSON.stringify(defaultSettings));
    onUpdateSettings(defaultSettings);
    setShowResetConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!formData.webhookUrl || !formData.webhookUrl.trim()) {
      setTestStatus({ success: false, message: 'প্রথমে Webhook URL দিন।' });
      return;
    }

    setTesting(true);
    setTestStatus(null);
    try {
      await fetchFraudData('01711000000', formData);
      setTestStatus({ success: true, message: 'সফল! ওয়েবহুক কানেকশন কাজ করছে।' });
    } catch (err: any) {
      setTestStatus({ success: false, message: err.message || 'কানেকশন ব্যর্থ হয়েছে।' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-emerald-400" />
          অ্যাপ সেটিংস (Settings)
        </h2>
        <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
          ওয়েবহুক URL, টোকেন, ডেমো মোড এবং রিস্ক থ্রেশহোল্ড সেটিংস কাস্টমাইজ করুন।
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Demo Mode & Webhook */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-600" />
            ওয়েবহুক ও ডেমো মোড কনফিগারেশন
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="block font-semibold text-slate-900 dark:text-white text-sm">ডেমো মোড (Demo Mode)</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                অফ (OFF) অবস্থায় রিয়েল ওয়েবহুক কাজ করবে। অন করলে নির্দিষ্ট ডেমো ডেটা দেখাবে।
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.demoMode}
                onChange={(e) => setFormData((prev) => ({ ...prev, demoMode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Webhook URL (Fraud-check API URL):
              </label>
              <input
                type="url"
                value={formData.webhookUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://your-fraud-api.com/v1/check"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Webhook Token / Bearer Token:
              </label>
              <input
                type="password"
                value={formData.webhookToken || formData.secretToken || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, webhookToken: e.target.value, secretToken: e.target.value }))}
                placeholder="Bearer token or secret key"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden font-mono"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Authorization: Bearer 헤ডার হিসেবে পাঠানো হবে।
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {testing ? <Play className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>টেস্ট কানেকশন (Test Connection)</span>
              </button>

              {testStatus && (
                <span className={`text-xs font-medium ${testStatus.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {testStatus.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Risk Thresholds Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            রিস্ক থ্রেশহোল্ড ও স্লাইডিং নিয়ম
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                নিরাপদ (Safe %) থ্রেশহোল্ড: <span className="font-mono font-bold text-emerald-600">{formData.safeThreshold}%</span>
              </label>
              <input
                type="range"
                min="70"
                max="95"
                value={formData.safeThreshold}
                onChange={(e) => setFormData((prev) => ({ ...prev, safeThreshold: Number(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-xs text-slate-400 mt-1 block">এর বেশি সফলতার হার থাকলে ✅ Safe দেখাবে।</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                মাঝারি ঝুঁকি (Medium %) থ্রেশহোল্ড: <span className="font-mono font-bold text-amber-600">{formData.mediumThreshold}%</span>
              </label>
              <input
                type="range"
                min="40"
                max="75"
                value={formData.mediumThreshold}
                onChange={(e) => setFormData((prev) => ({ ...prev, mediumThreshold: Number(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <span className="text-xs text-slate-400 mt-1 block">এর কম হলে 🚨 High Risk দেখাবে।</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                ন্যূনতম অর্ডার সংখ্যা (Min Orders): <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.minOrders || formData.minOrderCount}</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.minOrders || formData.minOrderCount || 3}
                onChange={(e) => setFormData((prev) => ({ ...prev, minOrders: Number(e.target.value), minOrderCount: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden"
              />
              <span className="text-xs text-slate-400 mt-1 block">এর কম অর্ডার হলে অপর্যাপ্ত ডেটা হিসেবে গণ্য হবে।</span>
            </div>
          </div>
        </div>

        {/* Buttons: Reset Default, Clear Data, Save */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ডিফল্টে রিসেট করুন</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>সব ডেটা মুছুন</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            <span>{saved ? 'সেভ হয়েছে ✓' : 'সেভ করুন'}</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">ডিফল্টে রিসেট নিশ্চিত করুন</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              আপনি কি সমস্ত সেটিংস ডিফল্ট মানগুলোতে ফিরিয়ে নিতে চান?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md cursor-pointer"
              >
                রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">নিশ্চিত করুন</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              আপনি কি নিশ্চিত যে আপনার সমস্ত সার্চ হিস্ট্রি ও ক্যাশ মুছে ফেলতে চান?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md cursor-pointer"
              >
                সব মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
