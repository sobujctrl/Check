import React, { useState } from 'react';
import { Layers, Play, Download, RefreshCw } from 'lucide-react';
import { normalizePhone } from '../utils/phone';
import { calculateRisk, RiskAnalysisResult } from '../utils/risk';
import { fetchFraudData } from '../services/fraudApi';
import { AppSettings, CustomerHistoryRecord, BlacklistWhitelistItem, CacheEntry, NormalizedFraudResponse } from '../types';

interface BulkCheckTabProps {
  settings: AppSettings;
  blacklistWhitelist: BlacklistWhitelistItem[];
  cache: Record<string, CacheEntry>;
  onUpdateCache: (phone: string, data: NormalizedFraudResponse) => void;
  onAddHistory: (record: CustomerHistoryRecord) => void;
  onIncrementUsage: () => void;
  onUpdateQuota: (quota: number | null) => void;
}

interface BulkResultItem {
  phone: string;
  normalized: string;
  valid: boolean;
  analysis?: RiskAnalysisResult;
  loading: boolean;
  error?: string;
}

export const BulkCheckTab: React.FC<BulkCheckTabProps> = ({
  settings,
  blacklistWhitelist,
  cache,
  onUpdateCache,
  onAddHistory,
  onIncrementUsage,
  onUpdateQuota,
}) => {
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<BulkResultItem[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleBulkCheck = async () => {
    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    if (!settings.demoMode && (!settings.webhookUrl || !settings.webhookUrl.trim())) {
      alert('Settings-এ Webhook URL সেট করুন।');
      return;
    }

    const targetLines = lines.slice(0, 50); // limit to 50
    setProcessing(true);
    setProgress({ current: 0, total: targetLines.length });

    const initialItems: BulkResultItem[] = targetLines.map((line) => {
      const normalized = normalizePhone(line);
      return {
        phone: line,
        normalized: normalized || '',
        valid: normalized !== null,
        loading: normalized !== null,
      };
    });

    setResults(initialItems);

    let completed = 0;
    const updated = [...initialItems];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (!item.valid || !item.normalized) {
        completed++;
        setProgress({ current: completed, total: targetLines.length });
        continue;
      }

      // Small delay between requests to simulate smooth processing and respect rate limits
      if (i > 0) {
        await new Promise((res) => setTimeout(res, 300));
      }

      try {
        let responseData: NormalizedFraudResponse;
        const cachedEntry = cache[item.normalized];
        const now = Date.now();
        const TEN_MINUTES = 10 * 60 * 1000;

        if (cachedEntry && now - cachedEntry.timestamp < TEN_MINUTES) {
          responseData = cachedEntry.data;
        } else {
          responseData = await fetchFraudData(item.normalized, settings);
          onUpdateCache(item.normalized, responseData);
          onIncrementUsage();
        }

        if (responseData.remaining_quota !== null) {
          onUpdateQuota(responseData.remaining_quota);
        }

        const riskRes = calculateRisk(responseData.couriers, item.normalized, settings, blacklistWhitelist);

        updated[i] = {
          ...item,
          analysis: riskRes,
          loading: false,
        };

        onAddHistory({
          phone: item.normalized,
          timestamp: new Date().toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }),
          rawTimestamp: Date.now(),
          totalOrders: riskRes.totalOrders,
          delivered: riskRes.delivered,
          cancelled: riskRes.cancelled,
          successRate: riskRes.successRate,
          riskLevel: riskRes.riskLevel,
          couriers: responseData.couriers,
        });
      } catch (err: any) {
        updated[i] = {
          ...item,
          loading: false,
          error: err.message || 'Error',
        };
      }

      completed++;
      setProgress({ current: completed, total: targetLines.length });
      setResults([...updated]);
    }

    setProcessing(false);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ['Phone', 'Total Orders', 'Delivered', 'Cancelled', 'Success Rate', 'Risk Level'];
    const rows = results
      .filter((r) => r.valid && r.analysis)
      .map((r) => [
        r.normalized,
        r.analysis?.totalOrders,
        r.analysis?.delivered,
        r.analysis?.cancelled,
        `${r.analysis?.successRate}%`,
        r.analysis?.riskLevel,
      ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bulk_order_check_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 dark:from-teal-900 dark:to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
          <Layers className="w-7 h-7" />
          বাল্ক ফোন নম্বর চেক (Bulk Check)
        </h2>
        <p className="text-teal-100 text-sm sm:text-base mb-6 max-w-xl">
          একসাথে একাধিক কাস্টমারের মোবাইল নম্বর পেস্ট করুন (প্রতি লাইনে একটি)। অ্যাপ স্বয়ংক্রিয়ভাবে সবার ডেলিভারি হিস্ট্রি চেক করবে।
        </p>

        {/* Textarea Input */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            মোবাইল নম্বর তালিকা (প্রতি লাইনে ১টি নম্বর):
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={'01712345678\n01812345678\n01912345678'}
            rows={5}
            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden"
          />
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              সর্বোচ্চ ৫০টি নম্বর একসাথে চেক করা যাবে
            </span>
            <button
              onClick={handleBulkCheck}
              disabled={processing || !inputText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>চেক হচ্ছে ({progress.current}/{progress.total})...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>বাল্ক চেক শুরু করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">চেক ফলাফল (Bulk Results)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">মোট {results.length}টি নম্বরের বিশ্লেষণ সম্পন্ন হয়েছে</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV ডাউনলোড করুন</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-6">নম্বর</th>
                  <th className="py-3.5 px-6 text-center">মোট অর্ডার</th>
                  <th className="py-3.5 px-6 text-center">সফল</th>
                  <th className="py-3.5 px-6 text-center">বাতিল</th>
                  <th className="py-3.5 px-6 text-center">সফলতার হার</th>
                  <th className="py-3.5 px-6">স্ট্যাটাস / রিস্ক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {results.map((r, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      {r.phone}
                    </td>
                    {!r.valid ? (
                      <td colSpan={5} className="py-4 px-6 text-rose-600 dark:text-rose-400 text-xs font-medium">
                        ❌ ভুল বা অবৈধ নম্বর বিন্যাস
                      </td>
                    ) : r.loading ? (
                      <td colSpan={5} className="py-4 px-6 text-slate-400 text-xs flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> চেক করা হচ্ছে...
                      </td>
                    ) : r.error ? (
                      <td colSpan={5} className="py-4 px-6 text-rose-500 text-xs">{r.error}</td>
                    ) : r.analysis ? (
                      <>
                        <td className="py-4 px-6 text-center font-mono text-slate-700 dark:text-slate-300">{r.analysis.totalOrders}</td>
                        <td className="py-4 px-6 text-center font-mono text-emerald-600 font-semibold">{r.analysis.delivered}</td>
                        <td className="py-4 px-6 text-center font-mono text-rose-600 font-semibold">{r.analysis.cancelled}</td>
                        <td className="py-4 px-6 text-center font-mono font-bold">{r.analysis.successRate}%</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${r.analysis.recommendation.color} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs`}>
                            {r.analysis.recommendation.badgeText}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td colSpan={5} className="py-4 px-6 text-slate-400">ডেটা নেই</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
