import React, { useState } from 'react';
import { History, Trash2, Download, Search, AlertOctagon, Star, Plus } from 'lucide-react';
import { CustomerHistoryRecord, BlacklistWhitelistItem } from '../types';

interface HistoryBlacklistTabProps {
  history: CustomerHistoryRecord[];
  blacklistWhitelist: BlacklistWhitelistItem[];
  onClearHistory: () => void;
  onRemoveBlacklistWhitelist: (phone: string) => void;
  onAddBlacklistWhitelist: (item: BlacklistWhitelistItem) => void;
}

export const HistoryBlacklistTab: React.FC<HistoryBlacklistTabProps> = ({
  history,
  blacklistWhitelist,
  onClearHistory,
  onRemoveBlacklistWhitelist,
  onAddBlacklistWhitelist,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'blacklist' | 'whitelist'>('history');
  const [searchFilter, setSearchFilter] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newListType, setNewListType] = useState<'blacklist' | 'whitelist'>('blacklist');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredHistory = history.filter((h) => h.phone.includes(searchFilter));
  const filteredList = blacklistWhitelist.filter(
    (item) =>
      item.phone.includes(searchFilter) &&
      (activeSubTab === 'blacklist' ? item.type === 'blacklist' : item.type === 'whitelist')
  );

  const handleExportHistoryCSV = () => {
    if (history.length === 0) return;
    const headers = ['Phone', 'Timestamp', 'Total Orders', 'Delivered', 'Cancelled', 'Success Rate', 'Risk Level'];
    const rows = history.map((h) => [
      h.phone,
      `"${h.timestamp}"`,
      h.totalOrders,
      h.delivered,
      h.cancelled,
      `${h.successRate}%`,
      h.riskLevel,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_check_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    onAddBlacklistWhitelist({
      phone: newPhone.trim(),
      type: newListType,
      note: newNote.trim() || (newListType === 'blacklist' ? 'Manual blacklist entry' : 'Manual whitelist entry'),
      date: new Date().toLocaleDateString(),
    });
    setNewPhone('');
    setNewNote('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            ইতিহাস ও ব্ল্যাকলিস্ট ম্যানেজমেন্ট
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            আপনার চেক করা শেষ ১০০ কাস্টমারের তালিকা এবং ম্যানুয়াল ব্ল্যাকলিস্ট/হোয়াইটলিস্ট পরিচালনা করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'history' && history.length > 0 && (
            <>
              <button
                onClick={handleExportHistoryCSV}
                className="px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV এক্সপোর্ট</span>
              </button>
              <button
                onClick={onClearHistory}
                className="px-3.5 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>হিস্ট্রি মুছুন</span>
              </button>
            </>
          )}

          {(activeSubTab === 'blacklist' || activeSubTab === 'whitelist') && (
            <button
              onClick={() => {
                setNewListType(activeSubTab);
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন যুক্ত করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab Buttons & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl">
        <div className="flex space-x-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            সার্চ হিস্ট্রি ({history.length})
          </button>
          <button
            onClick={() => setActiveSubTab('blacklist')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'blacklist'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ব্ল্যাকলিস্ট ({blacklistWhitelist.filter((i) => i.type === 'blacklist').length})
          </button>
          <button
            onClick={() => setActiveSubTab('whitelist')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'whitelist'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            হোয়াইটলিস্ট ({blacklistWhitelist.filter((i) => i.type === 'whitelist').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Content View */}
      {activeSubTab === 'history' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">কোনো সার্চ হিস্ট্রি পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3.5 px-6">মোবাইল নম্বর</th>
                    <th className="py-3.5 px-6">সময়</th>
                    <th className="py-3.5 px-6 text-center">মোট অর্ডার</th>
                    <th className="py-3.5 px-6 text-center">সফল</th>
                    <th className="py-3.5 px-6 text-center">বাতিল</th>
                    <th className="py-3.5 px-6 text-center">সফলতার হার</th>
                    <th className="py-3.5 px-6">রিস্ক লেভেল</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredHistory.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {item.phone}
                        {item.cached && <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 px-1.5 py-0.5 rounded">Cached</span>}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{item.timestamp}</td>
                      <td className="py-4 px-6 text-center font-mono text-slate-700 dark:text-slate-300">{item.totalOrders}</td>
                      <td className="py-4 px-6 text-center font-mono text-emerald-600 font-semibold">{item.delivered}</td>
                      <td className="py-4 px-6 text-center font-mono text-rose-600 font-semibold">{item.cancelled}</td>
                      <td className="py-4 px-6 text-center font-mono font-bold">{item.successRate}%</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          item.riskLevel === 'safe' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          item.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {item.riskLevel.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              {activeSubTab === 'blacklist' ? <AlertOctagon className="w-12 h-12 mx-auto mb-3 opacity-40 text-rose-500" /> : <Star className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-500" />}
              <p className="text-sm font-medium">কোনো নম্বর পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3.5 px-6">মোবাইল নম্বর</th>
                    <th className="py-3.5 px-6">নোট / কারণ</th>
                    <th className="py-3.5 px-6">সংযোজনের তারিখ</th>
                    <th className="py-3.5 px-6 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredList.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {item.type === 'blacklist' ? <AlertOctagon className="w-4 h-4 text-rose-600" /> : <Star className="w-4 h-4 text-emerald-600" />}
                        {item.phone}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">{item.note}</td>
                      <td className="py-4 px-6 text-xs text-slate-400">{item.date}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onRemoveBlacklistWhitelist(item.phone)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="তালিকা থেকে সরান"
                          aria-label="তালিকা থেকে সরান"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {newListType === 'blacklist' ? '🚫 ব্ল্যাকলিস্টে নম্বর যোগ করুন' : '⭐ হোয়াইটলিস্টে নম্বর যোগ করুন'}
            </h3>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">মোবাইল নম্বর:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="01712345678"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">নোট বা কারণ:</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="যেমন: বারবার ফেক অর্ডার করে"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
