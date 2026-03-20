
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppStep, ProductInfo, AdAngle, UploadedFile, GenerationMode, Language } from './types';
import { CAMPAIGN_GOALS } from './constants';
import { brandArchetypes } from './data/brandArchetypes';
import { generateAdAngles, generateAdVisuals, generateCaptions, generateAdVideo, generateSuggestedPrompt } from './services/geminiService';
import SparklesIcon from './components/icons/SparklesIcon';
import UploadIcon from './components/icons/UploadIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import Loader from './components/Loader';
import VideoIcon from './components/icons/VideoIcon';

declare var JSZip: any;
declare var saveAs: any;
declare var window: any;

const PinkDolphinLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" {...props}>
    <path d="M15 65C15 65 20 45 40 40C60 35 85 45 85 65C85 65 75 60 65 60C55 60 45 70 30 70C15 70 15 65 15 65Z" fill="#ff4db8" />
    <path d="M40 40C40 40 43 25 50 20C45 25 43 35 43 40" fill="#ff4db8" />
    <path d="M85 65C85 65 95 70 95 80C95 80 90 75 85 73" stroke="#ff4db8" strokeWidth="3" strokeLinecap="round" />
    <circle cx="65" cy="48" r="2.5" fill="white" />
    <path d="M30 70C30 70 25 80 15 85C25 83 30 75 30 70Z" fill="#ff4db8" />
    <circle cx="50" cy="50" r="48" stroke="#ff4db8" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.2" />
  </svg>
);

const TRANSLATIONS: Record<Language, any> = {
  en: {
    landing_title: "UGC STUDIO PRO",
    landing_subtitle: "Ads that look human. Built with ai 🤖✨",
    btn_start: "🚀 Start Campaign",
    define_title: "Campaign DNA 🧬",
    label_name: "Product Name",
    placeholder_name: "e.g., Luminous Skincare",
    label_audience: "Target Audience",
    label_selling_points: "Benefits",
    label_goal: "Goal",
    label_platform: "Format",
    label_archetype: "Brand Soul",
    btn_angles: "⚡ Generate Angles",
    angles_title: "Select Strategy 🧠",
    angles_subtitle: "Choose the psychological hook for your ads.",
    studio_title: "Creative Studio 🎨",
    btn_produce: "✨ Create Magic",
    btn_back: "← Back",
    mode_static: "Static 🖼️",
    mode_video: "Motion 🎥",
    upload_main: "Main Asset",
    label_headline: "Headline",
    label_captions: "Ad Captions 📝",
    btn_new: "🔄 New Project",
    btn_select_key: "Select API Key 💳",
    activation_title: "Unlock Engine 🔑",
    activation_subtitle: "Please select a paid API key to power generations.",
    btn_magic_prompt: "✨ AI Suggest Prompt"
  },
  da: {
    landing_title: "UGC STUDIO PRO",
    landing_subtitle: "Ads der ser menneskelige ud. Bygget med ai 🤖✨",
    btn_start: "🚀 Start Kampagne",
    define_title: "Kampagne DNA 🧬",
    label_name: "Produkt Navn",
    placeholder_name: "f.eks. Luminous Skincare",
    label_audience: "Målgruppe",
    label_selling_points: "Fordele",
    label_goal: "Mål",
    label_platform: "Format",
    label_archetype: "Brand Sjæl",
    btn_angles: "⚡ Find Vinkler",
    angles_title: "Vælg Strategi 🧠",
    angles_subtitle: "Vælg den psykologiske krog til dine annoncer.",
    studio_title: "Creative Studio 🎨",
    btn_produce: "✨ Skab Magi",
    btn_back: "← Tilbage",
    mode_static: "Statisk 🖼️",
    mode_video: "Bevægelse 🎥",
    upload_main: "Hovedbillede",
    label_headline: "Overskrift",
    label_captions: "Annonce Tekster 📝",
    btn_new: "🔄 Nyt Projekt",
    btn_select_key: "Vælg API-Nøgle 💳",
    activation_title: "Lås Op 🔑",
    activation_subtitle: "Vælg venligst en betalt API-nøgle for at fortsætte.",
    btn_magic_prompt: "✨ AI Forslag til Prompt"
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    name: '', audience: '', sellingPoints: '', goal: CAMPAIGN_GOALS[0], brandArchetype: '', platform: 'Instagram'
  });
  const [angles, setAngles] = useState<AdAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<AdAngle | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('Image');
  const [mainAsset, setMainAsset] = useState<UploadedFile | null>(null);
  const [headline, setHeadline] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) setIsApiKeyReady(true);
        setIsCheckingApiKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        try { await window.aistudio.openSelectKey(); setIsApiKeyReady(true); setError(null); } catch (e) {}
    }
  };

  const handleError = (err: any) => {
    const msg = err?.message || String(err);
    if (msg.includes("Requested entity was not found")) {
      setError("API Key Error: Billing not active or project invalid. Re-select a valid key.");
      setIsApiKeyReady(false);
    } else {
      setError(msg);
    }
  };

  const fetchAngles = async () => {
    setIsLoading(true);
    setLoadingMessage("🧠 Brainstorming angles...");
    setError(null);
    try {
      const res = await generateAdAngles(productInfo, lang);
      setAngles(res);
      setStep(AppStep.SELECT_ANGLE);
    } catch (err) { handleError(err); } finally { setIsLoading(false); }
  };

  const handleMagicPrompt = async () => {
    setIsLoading(true);
    setLoadingMessage("✨ AI Thinking...");
    try {
        const suggestion = await generateSuggestedPrompt(productInfo, lang);
        setCustomPrompt(suggestion);
    } catch (err) { handleError(err); } finally { setIsLoading(false); }
  };

  const startGeneration = async () => {
    if (!mainAsset) { setError("Upload image! 📸"); return; }
    setIsLoading(true);
    setLoadingMessage(generationMode === 'Image' ? "🎨 Painting assets..." : "🎥 Rendering motion...");
    setError(null);
    try {
      if (generationMode === 'Image') {
        const imgs = await generateAdVisuals(selectedAngle, mainAsset, customPrompt, {
          numberOfImages: 4, aspectRatio: '1:1', useSuperRealism: true, headline: headline, platform: productInfo.platform, textStyle: 'Modern'
        });
        setGeneratedImages(imgs);
      } else {
        const vid = await generateAdVideo(selectedAngle, mainAsset, customPrompt, { resolution: '720p', aspectRatio: '9:16' });
        setGeneratedVideoUrl(vid);
      }
      if (selectedAngle) {
        const caps = await generateCaptions(productInfo, selectedAngle, lang);
        setCaptions(caps);
      }
    } catch (err) { handleError(err); } finally { setIsLoading(false); }
  };

  const renderLanding = () => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 mb-6 animate-float"><PinkDolphinLogo /></div>
      <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-4">{t.landing_title}</h1>
      <p className="text-content-secondary max-w-md mb-8">{t.landing_subtitle}</p>
      <button onClick={() => setStep(AppStep.DEFINE_PRODUCT)} className="bg-white text-background font-bold py-4 px-12 rounded-full hover:bg-brand-primary hover:text-white transition-all uppercase tracking-widest shadow-xl">{t.btn_start}</button>
    </div>
  );

  const renderDefineProduct = () => (
    <div className="w-full max-w-2xl bg-surface/30 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/5 space-y-6">
      <h2 className="text-2xl font-bold text-center uppercase tracking-tighter">{t.define_title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">{t.label_name}</label>
            <input value={productInfo.name} onChange={e => setProductInfo({...productInfo, name: e.target.value})} className="w-full bg-background/50 border border-white/10 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder={t.placeholder_name} />
        </div>
        <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">{t.label_audience}</label>
            <input value={productInfo.audience} onChange={e => setProductInfo({...productInfo, audience: e.target.value})} className="w-full bg-background/50 border border-white/10 p-3 rounded-xl outline-none" placeholder="e.g. Gamers" />
        </div>
        <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">{t.label_goal}</label>
            <select value={productInfo.goal} onChange={e => setProductInfo({...productInfo, goal: e.target.value})} className="w-full bg-background/50 border border-white/10 p-3 rounded-xl outline-none">
                {CAMPAIGN_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
        </div>
        <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">{t.label_platform}</label>
            <select value={productInfo.platform} onChange={e => setProductInfo({...productInfo, platform: e.target.value})} className="w-full bg-background/50 border border-white/10 p-3 rounded-xl outline-none">
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Facebook">Facebook</option>
                <option value="YouTube">YouTube</option>
            </select>
        </div>
        <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">{t.label_archetype}</label>
            <select value={productInfo.brandArchetype} onChange={e => setProductInfo({...productInfo, brandArchetype: e.target.value})} className="w-full bg-background/50 border border-white/10 p-3 rounded-xl outline-none">
                <option value="">Select Archetype</option>
                {Object.keys(brandArchetypes).map(key => (
                    <option key={key} value={key}>{brandArchetypes[key][lang].name}</option>
                ))}
            </select>
        </div>
        <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">{t.label_selling_points}</label>
            <textarea value={productInfo.sellingPoints} onChange={e => setProductInfo({...productInfo, sellingPoints: e.target.value})} className="w-full bg-background/50 border border-white/10 p-3 rounded-xl outline-none min-h-[80px]" placeholder="e.g. Organic, Fast-acting, Eco-friendly" />
        </div>
        <button onClick={fetchAngles} disabled={!productInfo.name || !productInfo.sellingPoints} className="md:col-span-2 w-full bg-brand-primary py-4 rounded-xl font-bold uppercase tracking-widest disabled:opacity-20 transition-all shadow-lg active:scale-95">{t.btn_angles}</button>
      </div>
    </div>
  );

  const renderSelectAngle = () => (
    <div className="w-full max-w-4xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold uppercase tracking-tighter">{t.angles_title}</h2>
        <p className="text-content-secondary">{t.angles_subtitle}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {angles.map((a, i) => (
          <button key={i} onClick={() => { setSelectedAngle(a); setStep(AppStep.GENERATE_VISUALS); }} className="bg-surface/30 backdrop-blur-xl border border-white/5 p-6 rounded-[1.5rem] text-left hover:border-brand-primary transition-all hover:bg-white/5 group">
            <div className="text-brand-primary mb-3"><SparklesIcon /></div>
            <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">{a.title}</h3>
            <p className="text-content-secondary text-sm leading-relaxed">{a.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderGenerateVisuals = () => {
    if (isLoading) return <Loader message={loadingMessage} />;
    
    if (generatedImages.length > 0 || generatedVideoUrl) {
        return (
            <div className="w-full max-w-5xl space-y-8 text-center pb-20">
                <h2 className="text-4xl font-bold uppercase tracking-tighter">Results 🏁</h2>
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="grid grid-cols-2 gap-4">
                        {generatedImages.map((img, i) => (
                            <img key={i} src={`data:image/png;base64,${img}`} className="w-full aspect-square object-cover rounded-2xl shadow-xl border border-white/10" />
                        ))}
                        {generatedVideoUrl && <video src={generatedVideoUrl} controls autoPlay loop className="col-span-2 w-full rounded-2xl shadow-2xl" />}
                    </div>
                    <div className="bg-surface/30 p-8 rounded-[2rem] text-left border border-white/5 space-y-6">
                        <h3 className="text-xl font-bold uppercase text-brand-primary">{t.label_captions}</h3>
                        {captions.map((c, i) => (
                            <div key={i} className="p-4 bg-background/50 rounded-xl border border-white/5 text-sm leading-relaxed italic">
                                "{c}"
                            </div>
                        ))}
                        <button onClick={resetApp} className="w-full bg-brand-primary py-4 rounded-xl font-bold uppercase tracking-widest">{t.btn_new}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl grid md:grid-cols-3 gap-6">
            <div className="bg-surface/30 p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="font-bold uppercase text-xs text-brand-primary">Assets 📸</h3>
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5">
                    {mainAsset ? <img src={URL.createObjectURL(mainAsset.file)} className="h-full object-contain rounded-xl" /> : <UploadIcon />}
                    <input type="file" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setMainAsset({ file, data: (reader.result as string).split(',')[1], mimeType: file.type });
                            reader.readAsDataURL(file);
                        }
                    }} />
                </label>
            </div>
            <div className="bg-surface/30 p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="font-bold uppercase text-xs text-brand-primary">Vibe 🎨</h3>
                <button onClick={handleMagicPrompt} className="text-[10px] uppercase text-brand-primary font-bold">{t.btn_magic_prompt}</button>
                <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Describe visual style..." className="w-full h-32 bg-background/50 p-4 rounded-xl outline-none text-xs" />
                <input value={headline} onChange={e => setHeadline(e.target.value)} className="w-full bg-background/50 p-3 rounded-xl outline-none text-xs" placeholder={t.label_headline} />
            </div>
            <div className="bg-surface/30 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="flex bg-background/50 p-1 rounded-full">
                        <button onClick={() => setGenerationMode('Image')} className={`flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${generationMode === 'Image' ? 'bg-white text-black' : ''}`}>Static</button>
                        <button onClick={() => setGenerationMode('Video')} className={`flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${generationMode === 'Video' ? 'bg-white text-black' : ''}`}>Motion</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {error && <p className="text-[#ff4db8] text-[10px] bg-[#ff4db8]/5 p-2 rounded">{error}</p>}
                    <button onClick={startGeneration} className="w-full bg-brand-primary py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"><SparklesIcon className="w-4 h-4" /> {t.btn_produce}</button>
                </div>
            </div>
        </div>
    );
  };

  /**
   * Fix: Added missing renderContent function to handle step-based rendering.
   */
  const renderContent = () => {
    switch (step) {
      case AppStep.LANDING:
        return renderLanding();
      case AppStep.DEFINE_PRODUCT:
        return renderDefineProduct();
      case AppStep.SELECT_ANGLE:
        return renderSelectAngle();
      case AppStep.GENERATE_VISUALS:
        return renderGenerateVisuals();
      default:
        return renderLanding();
    }
  };

  const resetApp = () => { setStep(AppStep.LANDING); setGeneratedImages([]); setGeneratedVideoUrl(null); setSelectedAngle(null); setError(null); };

  if (isCheckingApiKey) return <div className="min-h-screen flex items-center justify-center"><Loader message="Checking keys..." /></div>;

  if (!isApiKeyReady) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-xs space-y-6">
                <div className="w-16 h-16 mx-auto"><PinkDolphinLogo /></div>
                <h1 className="text-2xl font-bold uppercase tracking-tighter">{t.activation_title}</h1>
                <p className="text-content-secondary text-sm">{t.activation_subtitle}</p>
                {error && <p className="text-[#ff4db8] text-xs p-3 bg-[#ff4db8]/5 rounded">{error}</p>}
                <button onClick={handleSelectKey} className="w-full bg-white text-black py-4 rounded-full font-bold uppercase tracking-widest shadow-xl">{t.btn_select_key}</button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-content-primary p-4 md:p-12 flex flex-col items-center">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button onClick={() => setLang('en')} className={`px-3 py-1 text-[10px] font-bold rounded-full border ${lang === 'en' ? 'bg-white text-black' : 'border-white/20'}`}>EN</button>
            <button onClick={() => setLang('da')} className={`px-3 py-1 text-[10px] font-bold rounded-full border ${lang === 'da' ? 'bg-white text-black' : 'border-white/20'}`}>DA</button>
        </div>
        <main className="w-full flex flex-col items-center">{renderContent()}</main>
        <style>{`
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            .animate-float { animation: float 6s ease-in-out infinite; }
        `}</style>
    </div>
  );
};

export default App;
