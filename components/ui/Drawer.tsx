
import React, { useState } from 'react';
import { XIcon, CheckIcon, CrownIcon, BellIcon, WorldIcon, CodeIcon, SettingsIcon, UserIcon } from './Icons';
import { PanelId } from '../../types';
import { useSettings } from '../../hooks/useSettings';

export const Drawer: React.FC<{ activePanel: PanelId | null; onClose: () => void }> = ({ activePanel, onClose }) => {
  const { settings, updateSettings, t } = useSettings();

  if (!activePanel) return null;

  const renderPlans = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black mb-2">Select Your Plan</h3>
        <p className="text-sm text-secondaryText">Upgrade to unlock Gemini 3 Pro Power</p>
      </div>

      <div className="grid gap-4">
        {[
          { id: 'free', name: 'Standard', price: 'Free', color: 'border-borderColor', features: ['Gemini 3 Flash', 'Basic Search', '10 Files/Day'] },
          { id: 'pro', name: 'Professional', price: '$19/mo', color: 'border-brand bg-brand/5', premium: true, features: ['Gemini 3 Pro', 'Advanced RAG', 'Image Lab (Imagen 3)', 'Code Interpreter', 'Unlimited Voice'] },
          { id: 'team', name: 'Team Workspace', price: '$49/mo', color: 'border-emerald-500 bg-emerald-500/5', features: ['Everything in Pro', 'Collaborative Files', 'Team Analytics', 'Shared API Keys'] },
        ].map(plan => (
          <div key={plan.id} className={`p-6 border-2 rounded-[2.5rem] relative overflow-hidden transition-all hover:scale-[1.02] ${plan.color}`}>
            {plan.premium && <div className="absolute top-4 right-4 text-brand"><CrownIcon /></div>}
            <h4 className="font-black text-lg uppercase mb-1">{plan.name}</h4>
            <div className="text-2xl font-black mb-4">{plan.price}</div>
            <ul className="space-y-2 mb-8">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-xs font-bold opacity-70">
                  <CheckIcon className="text-emerald-500 scale-75" /> {f}
                </li>
              ))}
            </ul>
            <button className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${plan.id === 'pro' ? 'bg-brand text-white shadow-xl shadow-brand/20' : 'bg-hoverBg border border-borderColor'}`}>
              {plan.id === 'free' ? 'Current Plan' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[1000] backdrop-blur-sm" onClick={onClose} />
      <div dir={settings.lang === 'ar' ? 'rtl' : 'ltr'} className={`fixed top-0 ${settings.lang === 'ar' ? 'right-0' : 'left-0'} h-full w-[450px] max-w-full bg-sidebarBg border-borderColor shadow-2xl z-[1001] animate-slide-in p-8 overflow-y-auto custom-scrollbar`}>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black text-brand tracking-tighter uppercase">{activePanel}</h2>
          <button onClick={onClose} className="p-2 hover:bg-hoverBg rounded-full"><XIcon /></button>
        </div>
        {activePanel === 'plans' ? renderPlans() : <p className="text-center py-20 opacity-20 italic">Settings Content Coming Soon...</p>}
      </div>
    </>
  );
};
