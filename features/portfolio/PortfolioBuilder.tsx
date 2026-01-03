
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../hooks/useSettings';
import { PortfolioProfile, PortfolioResponse, PortfolioProjectItem, Attachment, TemplateType } from '../../types';
import { generatePortfolio, parseResumeFromFile } from '../../services/geminiService';
import { 
  XIcon, HamburgerIcon, WorldIcon, UserIcon, 
  PaperclipIcon, CrownIcon, PaletteIcon, DownloadIcon, CodeIcon, EditIcon, PlusIcon, TrashIcon, FileIcon, PrinterIcon
} from '../../components/ui/Icons';

type PortfolioStep = 'templates' | 'basic' | 'about' | 'skills' | 'projects';

const getInitialProfile = (): PortfolioProfile => ({
  name: '',
  headline: '',
  location: '',
  tagline: '',
  about: '',
  experienceYears: 1,
  targetAudience: '',
  skills: [{ category: 'المهارات التقنية', items: [] }],
  projects: [{ title: '', description: '', role: '', techStack: [], url: '', highlight: '', media: [] }],
  extras: { testimonials: [], certifications: [], contactLinks: [] },
  preferredLanguage: 'ar',
  template: 'modern'
});

const TEMPLATE_CONFIGS: Record<TemplateType, { name: string; desc: string; colors: string; icon: React.ReactNode }> = {
  minimal: { name: 'بسيط (Minimal)', desc: 'تصميم هادئ، تركيز عالي على المحتوى.', colors: 'bg-white text-black', icon: <UserIcon /> },
  modern: { name: 'عصري (Modern)', desc: 'تأثيرات حيوية وتنسيق بساطة.', colors: 'bg-[#f8f9fa] text-slate-900', icon: <PaletteIcon /> },
  creative: { name: 'إبداعي (Creative)', desc: 'جريء، ألوان حيوية وتنسيق غير تقليدي.', colors: 'bg-[#fff5f9] text-[#2d1b4a]', icon: <CrownIcon /> },
  corporate: { name: 'احترافي (Corporate)', desc: 'هيكل منظم، مناسب للشركات الرسمية.', colors: 'bg-[#f4f7fa] text-[#1a2b3c]', icon: <WorldIcon /> },
  dark: { name: 'تقني مظلم (Dark Tech)', desc: 'أسود عميق، لمسات نيون، طابع برمجي.', colors: 'bg-[#0a0a0a] text-zinc-100', icon: <CodeIcon /> }
};

const PortfolioBuilder: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const { t, settings } = useSettings();
  const [profile, setProfile] = useState<PortfolioProfile>(() => {
    const saved = localStorage.getItem('portfolio_profile');
    try { 
      const parsed = saved ? JSON.parse(saved) : getInitialProfile();
      return { 
        ...getInitialProfile(),
        ...parsed, 
        preferredLanguage: parsed?.preferredLanguage || settings.lang 
      };
    } catch { return getInitialProfile(); }
  });
  
  const [activeStep, setActiveStep] = useState<PortfolioStep>('basic');
  const [response, setResponse] = useState<PortfolioResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('portfolio_profile', JSON.stringify(profile)); }, [profile]);

  const updateProfile = (updates: Partial<PortfolioProfile>) => setProfile(prev => ({ ...prev, ...updates }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setErrorMsg(null);
    try {
      const reader = new FileReader();
      reader.onload = async (re) => {
        const base64Data = (re.target?.result as string).split(',')[1];
        try {
          const parsedData = await parseResumeFromFile({
            data: base64Data,
            mimeType: file.type,
            name: file.name
          }, settings.lang);
          
          setProfile(prev => ({ 
            ...prev, 
            ...parsedData,
            skills: parsedData?.skills || prev.skills,
            projects: parsedData?.projects || prev.projects
          }));
        } catch (apiErr: any) {
           const msg = (apiErr.message || "").toLowerCase();
           if (msg.includes("403") || msg.includes("permission")) {
             setErrorMsg("خطأ في الصلاحيات: يرجى اختيار مفتاح API مدفوع للمتابعة.");
           } else {
             setErrorMsg("خطأ في الاتصال: " + (apiErr.message || "فشل التحليل"));
           }
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(t('error') + ": " + (err?.message || "Unknown parsing error"));
      setIsParsing(false);
    }
  };

  const handleGenerate = async (refinement?: string) => {
    if (!profile.name) {
      alert(settings.lang === 'ar' ? 'يرجى إدخال الاسم أولاً' : 'Please enter your name first');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const result = await generatePortfolio({ ...profile, preferredLanguage: settings.lang }, refinement);
      setResponse(result);
      if (window.innerWidth < 1024) setActiveTab('preview');
    } catch (err: any) { 
      console.error(err);
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("403") || msg.includes("permission") || msg.includes("not found")) {
        setErrorMsg("خطأ 403: ليس لديك صلاحية لاستخدام هذا النموذج (Gemini Pro). يرجى التأكد من اختيار مفتاح API صالح من القائمة العلوية.");
      } else {
        setErrorMsg(err?.message || "حدث خطأ أثناء الاتصال بالخدمة. يرجى المحاولة مرة أخرى.");
      }
    } finally { setIsGenerating(false); }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const inputClasses = "w-full bg-inputBg border border-borderColor rounded-xl p-4 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-secondaryText text-right block appearance-none mb-4 shadow-sm";

  return (
    <div className="flex flex-col h-full bg-appBg overflow-hidden text-primaryText" dir="rtl">
      {/* Header Area */}
      <header className="no-print flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-borderColor bg-sidebarBg/50 backdrop-blur-xl z-40">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onOpenSidebar} className="lg:hidden p-2 text-secondaryText"><HamburgerIcon /></button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-brand tracking-tighter uppercase leading-none">{t('portfolioBuilder')}</h2>
            <span className="text-[10px] opacity-50 font-bold">{t('draftSaved')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {response && (
            <button 
              type="button"
              onClick={handleExportPDF} 
              className="p-3 text-brand hover:bg-brand/10 rounded-xl transition-all group relative" 
              title="تصدير النتائج لملف PDF"
            >
              <PrinterIcon />
              <span className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-[100]">حفظ PDF</span>
            </button>
          )}
          <button 
            type="button"
            onClick={() => handleGenerate()} 
            disabled={isGenerating || isParsing} 
            className="px-6 py-3 bg-brand text-white text-xs font-black rounded-2xl shadow-lg hover:shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isGenerating ? (settings.lang === 'ar' ? 'جاري الصياغة...' : 'Generating...') : t('generatePortfolio')}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`no-print flex-1 lg:max-w-[420px] flex flex-col border-borderColor border-l bg-appBg transition-all ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex p-2 gap-1 bg-sidebarBg/20 border-b border-borderColor overflow-x-auto custom-scrollbar">
            <button type="button" onClick={() => setActiveStep('templates')} className={`p-3 rounded-xl transition-all ${activeStep === 'templates' ? 'bg-brand text-white shadow-md' : 'text-secondaryText hover:bg-hoverBg'}`} title={t('theme')}><PaletteIcon /></button>
            {['basic', 'about', 'skills', 'projects'].map(step => (
              <button 
                type="button"
                key={step} 
                onClick={() => setActiveStep(step as any)} 
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all whitespace-nowrap ${activeStep === step ? 'bg-brand text-white shadow-md' : 'text-secondaryText hover:bg-hoverBg'}`}
              >
                {t(step as any)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-32 text-right">
            {activeStep === 'templates' && (
              <div className="space-y-4">
                {(Object.keys(TEMPLATE_CONFIGS) as TemplateType[]).map(t_id => (
                  <button 
                    type="button"
                    key={t_id} 
                    onClick={() => updateProfile({ template: t_id })} 
                    className={`w-full flex items-start gap-4 p-5 rounded-[24px] border-2 text-right transition-all ${profile.template === t_id ? 'border-brand bg-brand/5 shadow-lg scale-[1.02]' : 'border-borderColor bg-sidebarBg opacity-60 hover:opacity-100'}`}
                  >
                    <div className="p-3 bg-brand/10 text-brand rounded-2xl">{TEMPLATE_CONFIGS[t_id].icon}</div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm uppercase">{TEMPLATE_CONFIGS[t_id].name}</h4>
                      <p className="text-[10px] text-secondaryText mt-1 leading-tight">{TEMPLATE_CONFIGS[t_id].desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeStep === 'basic' && (
              <div className="space-y-4">
                <div className="p-6 bg-brand/5 border-2 border-dashed border-brand/20 rounded-3xl flex flex-col items-center gap-4 text-center group hover:border-brand/50 transition-all">
                  <div className="p-4 bg-brand/10 text-brand rounded-full group-hover:scale-110 transition-transform"><PaperclipIcon /></div>
                  <div className="space-y-1">
                    <p className="text-sm font-black">{t('autofillFromFile')}</p>
                    <p className="text-[10px] opacity-60">ارفع سيرتك الذاتية (PDF) لملء البيانات تلقائياً</p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full py-3 bg-brand text-white text-xs font-black rounded-xl hover:opacity-90 transition-all"
                  >
                    {isParsing ? "جاري التحليل..." : t('uploadResume')}
                  </button>
                </div>

                <div className="pt-4 space-y-2">
                  <label className="text-[10px] font-black uppercase text-brand mr-1">{t('fullName')}</label>
                  <input placeholder="مثال: محمد أحمد" value={profile.name} onChange={e => updateProfile({ name: e.target.value })} className={inputClasses} />
                  <label className="text-[10px] font-black uppercase text-brand mr-1">{t('headline')}</label>
                  <input placeholder="مثال: مصمم واجهات أول" value={profile.headline} onChange={e => updateProfile({ headline: e.target.value })} className={inputClasses} />
                  <label className="text-[10px] font-black uppercase text-brand mr-1">{t('location')}</label>
                  <input placeholder="المدينة، الدولة" value={profile.location} onChange={e => updateProfile({ location: e.target.value })} className={inputClasses} />
                </div>
              </div>
            )}

            {activeStep === 'about' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-brand mr-1">{t('aboutMe')}</label>
                <textarea 
                  placeholder="اكتب نبذة احترافية عن مسيرتك..." 
                  value={profile.about} 
                  onChange={e => updateProfile({ about: e.target.value })} 
                  className={inputClasses + " h-64 resize-none leading-relaxed"} 
                />
              </div>
            )}

            {activeStep === 'skills' && (
              <div className="space-y-6">
                {(profile.skills || []).map((skillGroup, gIdx) => (
                  <div key={gIdx} className="p-5 bg-sidebarBg/50 border border-borderColor rounded-[2rem] space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <input 
                        value={skillGroup.category} 
                        onChange={e => {
                          const newSkills = [...(profile.skills || [])];
                          newSkills[gIdx].category = e.target.value;
                          updateProfile({ skills: newSkills });
                        }}
                        className="bg-transparent border-none font-black text-xs uppercase outline-none focus:text-brand text-right placeholder:opacity-30"
                        placeholder="فئة المهارات"
                      />
                      <button type="button" onClick={() => updateProfile({ skills: (profile.skills || []).filter((_, i) => i !== gIdx) })} className="text-red-500/50 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"><TrashIcon /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(skillGroup.items || []).map((item, iIdx) => (
                        <div key={iIdx} className="flex items-center gap-2 bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-xl text-[11px] text-brand font-bold">
                          <span>{item}</span>
                          <button type="button" onClick={() => {
                            const newSkills = [...(profile.skills || [])];
                            newSkills[gIdx].items = newSkills[gIdx].items.filter((_, i) => i !== iIdx);
                            updateProfile({ skills: newSkills });
                          }} className="hover:text-red-500"><XIcon /></button>
                        </div>
                      ))}
                      <input 
                        placeholder="+ إضافة مهارة" 
                        className="bg-inputBg border border-borderColor rounded-xl px-3 py-1.5 text-[11px] w-28 text-right focus:border-brand/50 outline-none"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (!val) return;
                            const newSkills = [...(profile.skills || [])];
                            newSkills[gIdx].items = [...(newSkills[gIdx].items || []), val];
                            updateProfile({ skills: newSkills });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => updateProfile({ skills: [...(profile.skills || []), { category: 'تصنيف جديد', items: [] }] })} className="w-full py-4 border-2 border-dashed border-borderColor rounded-[2rem] text-xs font-black hover:bg-brand/5 hover:border-brand/30 transition-all">+ أضف فئة مهارات جديدة</button>
              </div>
            )}

            {activeStep === 'projects' && (
              <div className="space-y-6">
                {(profile.projects || []).map((project, pIdx) => (
                  <div key={pIdx} className="p-6 bg-sidebarBg/50 border border-borderColor rounded-[2.5rem] space-y-4 relative group shadow-sm">
                    <button type="button" onClick={() => updateProfile({ projects: (profile.projects || []).filter((_, i) => i !== pIdx) })} className="absolute top-6 left-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-xl"><TrashIcon /></button>
                    <label className="text-[10px] font-black uppercase text-brand mr-1">{t('projectTitle')}</label>
                    <input placeholder="اسم المشروع" value={project.title} onChange={e => {
                      const newProjects = [...(profile.projects || [])];
                      newProjects[pIdx].title = e.target.value;
                      updateProfile({ projects: newProjects });
                    }} className={inputClasses} />
                    <textarea placeholder="وصف المشروع" value={project.description} onChange={e => {
                      const newProjects = [...(profile.projects || [])];
                      newProjects[pIdx].description = e.target.value;
                      updateProfile({ projects: newProjects });
                    }} className={inputClasses + " h-32"} />
                  </div>
                ))}
                <button type="button" onClick={() => updateProfile({ projects: [...(profile.projects || []), { title: '', description: '', techStack: [] }] })} className="w-full py-5 border-2 border-dashed border-borderColor rounded-[2.5rem] text-sm font-black hover:bg-brand/5 hover:border-brand/30 transition-all">+ {t('addProject')}</button>
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 relative overflow-y-auto custom-scrollbar transition-all bg-appBg/50 ${activeTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          {!response && !errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center no-print">
               <div className="w-24 h-24 bg-brand/5 text-brand rounded-[2.5rem] flex items-center justify-center mb-6 animate-bounce duration-[3s]">
                 <PaletteIcon />
               </div>
               <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">{t('livePreview')}</h3>
               <p className="max-w-xs text-secondaryText text-sm leading-relaxed">{t('portfolioDesc')}</p>
            </div>
          ) : errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center no-print">
               <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                 <XIcon />
               </div>
               <h3 className="text-2xl font-black mb-4 text-red-500">فشل في الاتصال</h3>
               <p className="max-w-md text-secondaryText text-sm leading-relaxed mb-6">{errorMsg}</p>
               <button type="button" onClick={() => handleGenerate()} className="px-8 py-3 bg-brand text-white font-bold rounded-xl shadow-lg">إعادة المحاولة</button>
            </div>
          ) : (
            <div className={`print-content min-h-full w-full animate-in fade-in duration-1000 p-4 md:p-12 ${TEMPLATE_CONFIGS[response!.template].colors}`}>
               <div className="max-w-4xl mx-auto space-y-16">
                  {response!.sections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-24 group">
                      <div className="flex items-center gap-4 mb-8 no-print">
                         <div className="h-px flex-1 bg-brand/20"></div>
                         <h2 className="text-xs font-black uppercase tracking-[0.3em] text-brand">{section.title}</h2>
                         <div className="h-px flex-1 bg-brand/20"></div>
                      </div>
                      <div className="hidden print:block mb-4">
                         <h2 className="text-2xl font-black uppercase border-b-2 border-black pb-2">{section.title}</h2>
                      </div>
                      <div 
                        className="markdown-content portfolio-content"
                        dangerouslySetInnerHTML={{ __html: section.bodyHtml || '' }}
                      />
                    </section>
                  ))}
                  <footer className="pt-20 border-t border-brand/10 text-center opacity-30 text-[10px] font-bold tracking-widest uppercase">
                    Generated by Pro AI &bull; {profile.name} &bull; {new Date().getFullYear()}
                  </footer>
               </div>
            </div>
          )}
          
          {isGenerating && (
            <div className="no-print absolute inset-0 bg-appBg/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-8">
               <div className="w-20 h-20 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6"></div>
               <h3 className="text-2xl font-black mb-2 animate-pulse">جاري صياغة إبداعك...</h3>
               <p className="text-sm text-secondaryText max-w-xs leading-relaxed">يقوم Pro AI الآن بتنسيق الأقسام وتوليد المحتوى بناءً على خبراتك.</p>
            </div>
          )}
        </div>
      </div>

      <div className="no-print lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
         <button type="button" onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')} className="px-10 py-4 bg-brand text-white font-black rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
           {activeTab === 'form' ? <WorldIcon /> : <EditIcon />}
           {activeTab === 'form' ? 'معاينة النتيجة' : 'تعديل البيانات'}
         </button>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
