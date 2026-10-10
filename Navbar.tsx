import React from 'react';
import { ShieldAlert, Search, Layers, History, Settings as SettingsIcon, BookOpen, Sun, Moon, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'single' | 'bulk' | 'history' | 'settings' | 'readme';
  setActiveTab: (tab: 'single' | 'bulk' | 'history' | 'settings' | 'readme') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  dailyUsageCount: number;
  remainingQuota: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  dailyUsageCount,
  remainingQuota,
}) => {
  const tabs = [
    { id: 'single', label: 'একক চেক', icon: Search },
    { id: 'bulk', label: 'বাল্ক চেক', icon: Layers },
    { id: 'history', label: 'হিস্ট্রি ও ব্ল্যাকলিস্ট', icon: History },
    { id: 'settings', label: 'সেটিংস', icon: SettingsIcon },
    { id: 'readme', label: 'API গাইড', icon: BookOpen },
  ] as const;

  return (
    <header className="sticky top-0 z-30 bg-emerald-900/95 text-white backdrop-blur-md border-b border-emerald-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('single')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/50 border border-emerald-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                ফেক অর্ডার চেকার <span className="text-xs px-2 py-0.5 bg-emerald-800 text-emerald-200 rounded-full font-medium">COD Shield</span>
              </h1>
              <p className="text-xs text-emerald-300">Fraud & Risk Detection for BD E-commerce</p>
            </div>
          </div>

          {/* Quota Counter Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-emerald-800/80 px-3.5 py-1.5 rounded-full text-xs font-medium border border-emerald-700">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>আজ ব্যবহার: <strong className="font-mono text-white">{dailyUsageCount}</strong></span>
            {remainingQuota !== null && (
              <span className="text-emerald-300 border-l border-emerald-700 pl-2">
                কোট্টা বাকি: <strong className="font-mono text-white">{remainingQuota}</strong>
              </span>
            )}
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-200 hover:bg-emerald-800/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Dark mode toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-emerald-200 hover:bg-emerald-800 transition-colors cursor-pointer"
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Quota & Nav Tabs */}
        <div className="flex flex-col md:hidden pb-2 space-y-2">
          <div className="flex lg:hidden items-center justify-center gap-2 bg-emerald-800/80 px-3 py-1 rounded-full text-xs font-medium border border-emerald-700 w-fit mx-auto">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>আজ ব্যবহার: <strong className="font-mono text-white">{dailyUsageCount}</strong></span>
            {remainingQuota !== null && (
              <span className="text-emerald-300 border-l border-emerald-700 pl-2">
                বাকি: <strong className="font-mono text-white">{remainingQuota}</strong>
              </span>
            )}
          </div>

          <div className="flex overflow-x-auto space-x-1 py-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'text-emerald-200 hover:bg-emerald-800/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
