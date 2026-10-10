import React, { useState } from 'react';
import { Search, Phone, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Copy, Check, RefreshCw, AlertOctagon, Star, AlertCircle, Zap, Sparkles } from 'lucide-react';
import { normalizePhone, isValidPhone } from '../utils/phone';
import { calculateRisk, RiskAnalysisResult } from '../utils/risk';
import { fetchFraudData } from '../services/fraudApi';
import { AppSettings, CourierStat, CustomerHistoryRecord, BlacklistWhitelistItem, CacheEntry, NormalizedFraudResponse } from '../types';

interface SingleCheckTabProps {
  settings: AppSettings;
  blacklistWhitelist: BlacklistWhitelistItem[];
  cache: Record<string, CacheEntry>;
  onUpdateCache: (phone: string, data: NormalizedFraudResponse) => void;
  onAddHistory: (record: CustomerHistoryRecord) => void;
  onAddBlacklistWhitelist: (item: BlacklistWhitelistItem) => void;
  onIncrementUsage: () => void;
  onUpdateQuota: (quota: number | null) => void;
}

export const SingleCheckTab: React.FC<SingleCheckTabProps> = ({
  settings,
  blacklistWhitelist,
  cache,
  onUpdateCache,
  onAddHistory,
  onAddBlacklistWhitelist,
  onIncrementUsage,
  onUpdateQuota,
}) => {
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [couriers, setCouriers] = useState<CourierStat[] | null>(null);
  const [analysis, setAnalysis] = useState<RiskAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [showNoteModal, setShowNoteModal] = useState<'blacklist' | 'whitelist' | null>(null);

  // AI Plan state
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanText, setAiPlanText] = useState<string | null>(null);
  const [aiPlanError, setAiPlanError] = useState<string | null>(null);

  const sampleNumbers = [
    { label: 'রিস্কি কাস্টমার', phone: '01711000000' },
    { label: 'নিরাপদ কাস্টমার', phone: '01811111111' },
    { label: 'মাঝারি ঝুঁকি', phone: '01922222222' },
    { label: 'নতুন কাস্টমার', phone: '01355555555' },
  ];

  const handleCheck = async (phoneToTest?: string) => {
    const raw = phoneToTest !== undefined ? phoneToTest : inputPhone;
    const normalized = normalizePhone(raw);

    if (!normalized) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)');
      return;
    }

    setError(null);
    setLoading(true);
    setCurrentPhone(normalized);
    setIsCachedResult(false);
    setAiPlanText(null);
    setAiPlanError(null);

    try {
      const bwItem = blacklistWhitelist.find((item) => item.phone === normalized);
      const isBlacklisted = bwItem?.type === 'blacklist';

      let responseData: NormalizedFraudResponse;
      let cached = false;

      const cachedEntry = cache[normalized];
      const now = Date.now();
      const TEN_MINUTES = 10 * 60 * 1000;

      if (cachedEntry && now - cachedEntry.timestamp < TEN_MINUTES) {
        responseData = cachedEntry.data;
        cached = true;
        setIsCachedResult(true);
      } else {
        responseData = await fetchFraudData(normalized, settings);
        onUpdateCache(normalized, responseData);
        onIncrementUsage();
      }

      if (responseData.remaining_quota !== undefined) {
        onUpdateQuota(responseData.remaining_quota);
      }

      const riskResult = calculateRisk(responseData.couriers, normalized, settings, blacklistWhitelist);
      setCouriers(responseData.couriers);
      setAnalysis(riskResult);

      const record: CustomerHistoryRecord = {
        phone: normalized,
        timestamp: new Date().toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }),
        rawTimestamp: Date.now(),
        totalOrders: riskResult.totalOrders,
        delivered: riskResult.delivered,
        cancelled: riskResult.cancelled,
        successRate: riskResult.successRate,
        riskLevel: riskResult.riskLevel,
        couriers: responseData.couriers,
        cached,
      };
      onAddHistory(record);
    } catch (err: any) {
      setError(err.message || 'ডেটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setCouriers(null);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiPlan = async () => {
    if (!analysis || !currentPhone) return;
    setAiPlanLoading(true);
    setAiPlanError(null);

    try {
      const response = await fetch('/.netlify/functions/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentPhone,
          totalOrders: analysis.totalOrders,
          delivered: analysis.delivered,
          cancelled: analysis.cancelled,
          successRate: analysis.successRate,
          riskLevel: analysis.riskLevel,
        }),
      });

      if (!response.ok) {
        throw new Error('AI Serverless function error');
      }

      const data = await response.json();
      if (data && data.plan) {
        setAiPlanText(data.plan);
      } else {
        throw new Error('No plan generated');
      }
    } catch (err: any) {
      setAiPlanError('এআই এনালাইসিস জেনারেট করতে সমস্যা হয়েছে। সার্ভার ফাংশন চেক করুন।');
    } finally {
      setAiPlanLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!analysis || !currentPhone) return;
    const text = `📱 মোবাইল নম্বর: ${currentPhone}
📦 মোট অর্ডার: ${analysis.totalOrders}
✅ সফল ডেলিভারি: ${analysis.delivered}
❌ রিটার্ন/ক্যান্সেল: ${analysis.cancelled}
📊 সফলতার হার: ${analysis.successRate}%
🛡️ স্ট্যাটাস: ${analysis.recommendation.badgeText}
💡 পরামর্শ: ${analysis.recommendation.en} (${analysis.recommendation.bn})
---
Checked via Fake Order Checker (COD Shield)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitListAction = (type: 'blacklist' | 'whitelist') => {
    if (!currentPhone) return;
    onAddBlacklistWhitelist({
      phone: currentPhone,
      type,
      note: noteInput || (type === 'blacklist' ? 'Manual blacklist by seller' : 'Manual trusted whitelist'),
      date: new Date().toLocaleDateString(),
    });
    setShowNoteModal(null);
    setNoteInput('');
    handleCheck(currentPhone);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 dark:from-emerald-900 dark:to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">কাস্টমার ডেলিভারি হিস্ট্রি চেক করুন</h2>
        <p className="text-emerald-100 text-sm sm:text-base mb-6 max-w-xl">
          বাংলাদেশের শীর্ষস্থানীয় কুরিয়ার সার্ভিসগুলোর ডেটা যাচাই করে নিশ্চিত হোন ক্যাশ অন ডেলিভারি (COD) নিরাপদ কি না।
        </p>

        {/* Search Bar Input */}
        <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl shadow-lg flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="মোবাইল নম্বর লিখুন (যেমন: 01712345678)"
              className="w-full pl-11 pr-4 py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden text-base sm:text-lg font-medium"
            />
          </div>
          <button
            onClick={() => handleCheck()}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>চেক করুন</span>
          </button>
        </div>

        {/* Error message with Retry button */}
        {error && (
          <div className="mt-4 bg-rose-500/20 border border-rose-300/30 text-rose-100 px-4 py-3 rounded-lg text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-200" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleCheck()}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Sample Numbers Quick Test */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-200 font-medium">ডেমো টেস্ট নম্বর:</span>
          {sampleNumbers.map((s) => (
            <button
              key={s.phone}
              onClick={() => {
                setInputPhone(s.phone);
                handleCheck(s.phone);
              }}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md transition-colors border border-white/10 flex items-center gap-1 cursor-pointer"
            >
              <span>{s.label}</span>
              <span className="opacity-75 font-mono">({s.phone})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {analysis && couriers && currentPhone && (
        <div className="space-y-6 animate-fade-in">
          {/* Demo Mode Bright Yellow Banner */}
          {settings.demoMode && (
            <div className="bg-amber-300 dark:bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-md flex items-center gap-3 border border-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0 text-slate-950" />
              <span className="text-sm sm:text-base">⚠️ এটি ডেমো ডেটা, আসল নয়।</span>
            </div>
          )}

          {/* Cache Notice */}
          {isCachedResult && (
            <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5 w-fit">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>কোট্টা বাঁচাতে সাম্প্রতিক ক্যাশড ফলাফল দেখানো হচ্ছে (১০ মিনিটের মধ্যে চেক করা)।</span>
            </div>
          )}

          {/* Main Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Top Status Header */}
            <div className={`p-6 border-b ${analysis.recommendation.bgColor} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-lg">{currentPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-xs ${analysis.recommendation.color} bg-white dark:bg-slate-900`}>
                    {analysis.recommendation.badgeText}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Copy & Blacklist */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyResult}
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'কপি হয়েছে!' : 'ফলাফল কপি করুন'}</span>
                </button>

                {!analysis.isBlacklisted ? (
                  <button
                    onClick={() => setShowNoteModal('blacklist')}
                    className="px-3.5 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>ব্ল্যাকলিস্ট করুন</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowNoteModal('whitelist')}
                    className="px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Star className="w-4 h-4" />
                    <span>হোয়াইটলিস্ট করুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">সেলারদের জন্য পরামর্শ (Recommendation)</h4>
                <p className={`text-base font-semibold ${analysis.recommendation.color}`}>
                  {analysis.recommendation.bn}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                  {analysis.recommendation.en}
                </p>
                {analysis.blacklistNote && (
                  <div className="mt-3 text-xs bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
                    <strong>ব্ল্যাকলিস্ট নোট:</strong> {analysis.blacklistNote}
                  </div>
                )}
              </div>

              {/* AI Gemini Serverless Function Button */}
              <button
                onClick={handleGenerateAiPlan}
                disabled={aiPlanLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {aiPlanLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>এআই ফ্রড অ্যানালাইসিস পান</span>
              </button>
            </div>

            {/* AI Plan Display Area */}
            {(aiPlanText || aiPlanError) && (
              <div className="p-6 bg-teal-50/50 dark:bg-teal-950/20 border-b border-teal-100 dark:border-teal-900/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Gemini AI Serverless Strategy & Analysis</span>
                </div>
                {aiPlanError ? (
                  <p className="text-xs text-rose-600">{aiPlanError}</p>
                ) : (
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line bg-white dark:bg-slate-900 p-4 rounded-xl border border-teal-200 dark:border-teal-900/50">
                    {aiPlanText}
                  </div>
                )}
              </div>
            )}

            {/* Summary Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="p-6 text-center">
                <span className="block text-xs font-medium text-slate-400 mb-1">মোট অর্ডার</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono">{analysis.totalOrders}</span>
              </div>
              <div className="p-6 text-center">
                <span className="block text-xs font-medium text-slate-400 mb-1">সফল ডেলিভারি</span>
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{analysis.delivered}</span>
              </div>
              <div className="p-6 text-center">
                <span className="block text-xs font-medium text-slate-400 mb-1">ক্যানসেল/রিটার্ন</span>
                <span className="text-3xl font-bold text-rose-600 dark:text-rose-400 font-mono">{analysis.cancelled}</span>
              </div>
              <div className="p-6 text-center">
                <span className="block text-xs font-medium text-slate-400 mb-1">সফলতার হার (%)</span>
                <span className={`text-3xl font-bold font-mono ${
                  analysis.successRate >= settings.safeThreshold ? 'text-emerald-600' :
                  analysis.successRate >= settings.mediumThreshold ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {analysis.successRate}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pb-6 pt-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                <span>সফল ডেলিভারি অনুপাত</span>
                <span>{analysis.successRate}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${analysis.successRate}%` }}
                ></div>
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${100 - analysis.successRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Per-Courier Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">ক্যুরিয়ার অনুযায়ী বিবরণ (Per-Courier Breakdown)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Steadfast, Pathao, Redx, Carrybee এবং Paperfly পার্সেল হিস্ট্রি</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3.5 px-6">Courier</th>
                    <th className="py-3.5 px-6 text-center">Total</th>
                    <th className="py-3.5 px-6 text-center">Delivered</th>
                    <th className="py-3.5 px-6 text-center">Cancelled</th>
                    <th className="py-3.5 px-6 text-right">Success %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {couriers.map((c, index) => {
                    const successPct = c.total > 0 ? Math.round((c.delivered / c.total) * 100) : null;
                    return (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          {c.courier}
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-slate-700 dark:text-slate-300">{c.total}</td>
                        <td className="py-4 px-6 text-center font-mono text-emerald-600 font-semibold">{c.delivered}</td>
                        <td className="py-4 px-6 text-center font-mono text-rose-600 font-semibold">{c.cancelled}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold">
                          {successPct !== null ? (
                            <span className={`px-2.5 py-1 rounded-md text-xs ${
                              successPct >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                              successPct >= 60 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {successPct}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal for Blacklist/Whitelist */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {showNoteModal === 'blacklist' ? '🚫 ব্ল্যাকলিস্টে যুক্ত করুন' : '⭐ হোয়াইটলিস্টে যুক্ত করুন'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              নম্বর: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{currentPhone}</span>
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">নোট বা কারণ (ঐচ্ছিক):</label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={showNoteModal === 'blacklist' ? 'যেমন: পার্সেল রিসিভ করেনি, বারবার ফোন কেটে দেয়' : 'যেমন: বিশ্বস্ত নিয়মিত ক্রেতা'}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNoteModal(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={() => submitListAction(showNoteModal)}
                className={`px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-md cursor-pointer ${
                  showNoteModal === 'blacklist' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
