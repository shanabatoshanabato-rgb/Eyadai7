
import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Loader2, 
  Sparkles, 
  AlignLeft,
  Image as ImageIcon,
  Globe,
  Link as LinkIcon,
  FileSearch,
  BookOpenCheck
} from 'lucide-react';
import { generateText, generateImage } from '../services/geminiService';
import { useTranslation } from '../translations';
import { Language } from '../types';

export const DocumentPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState(1000);
  const [includeImages, setIncludeImages] = useState(true);
  const [useSearch, setUseSearch] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [doc, setDoc] = useState<{ title: string; content: string; imageUrl?: string | null } | null>(null);
  const t = useTranslation();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setDoc(null);

    // تحديد اللغة المستهدفة بناءً على إعدادات المستخدم
    const currentLang = localStorage.getItem('eyad-ai-lang') || Language.EN;
    const langNames: Record<string, string> = {
      [Language.EN]: "English",
      [Language.AR]: "Standard Arabic",
      [Language.EG]: "Egyptian Arabic (Ammiya dialect)",
      [Language.FR]: "French",
      [Language.ES]: "Spanish"
    };
    const targetLangName = langNames[currentLang as Language] || "English";

    try {
      // برومبت متطور لضمان العمق الأكاديمي والتوثيق
      const prompt = `أنت الآن "إياد"، باحث أكاديمي محترف. قم بكتابة تقرير بحثي شامل ومعمق حول: "${topic}".
      
      التعليمات الصارمة:
      1. اللغة: يجب كتابة التقرير بالكامل بلغة: ${targetLangName}.
      2. العمق: استهدف حوالي ${wordCount} كلمة. كن مفصلاً ودقيقاً.
      3. البحث والمصادر: يجب عليك استخدام أداة البحث للعثور على أحدث البيانات. يجب أن يتضمن التقرير قسماً خاصاً في النهاية بعنوان "المصادر والمراجع" يحتوي على 3 روابط Markdown حقيقية على الأقل [اسم المصدر](URL).
      4. التنسيق: استخدم تنسيق Markdown احترافي (H1 للعنوان، H2 للأقسام الرئيسية، H3 للأقسام الفرعية، النقاط للتعداد، والخط العريض للكلمات المفتاحية).
      
      هيكل التقرير المطلوب:
      - العنوان الرئيسي (H1)
      - ملخص تنفيذي (Executive Summary)
      - مقدمة شاملة
      - التحليل والمناقشة (Analysis & Discussion) مقسمة لعناوين فرعية
      - الخاتمة والتوصيات
      - قائمة المراجع (References) مع روابط حقيقية`;

      const textResponse = await generateText(prompt, { 
        useSearch: useSearch,
        systemInstruction: `أنت مساعد بحثي فائق الذكاء تلتزم تماماً باللغة المطلوبة: ${targetLangName}. وظيفتك هي تقديم محتوى موثق بروابط حقيقية وتنسيق أكاديمي فاخر.`
      });
      
      // استخراج العنوان من أول سطر
      const title = textResponse.split('\n')[0].replace(/[#*]/g, '').trim() || 'Eyad AI Research';
      
      let imageUrl = null;
      if (includeImages) {
        imageUrl = await generateImage(`Professional academic book cover for a report titled "${topic}". High-quality, 4k, minimalistic, intellectual atmosphere.`);
      }

      setDoc({ title, content: textResponse, imageUrl });
    } catch (err) {
      console.error("Document Gen Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsWord = () => {
    if (!doc) return;
    
    // إعداد ترويسة ملف الوورد مع CSS احترافي للطباعة
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.title}</title>
        <style>
          @page { margin: 1in; }
          body { 
            font-family: 'Segoe UI', 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #2d3748; 
            direction: ${localStorage.getItem('eyad-ai-lang') === 'en' ? 'ltr' : 'rtl'};
          }
          h1 { color: #1e40af; font-size: 28pt; border-bottom: 3px solid #1e40af; padding-bottom: 10px; margin-bottom: 30px; text-align: center; }
          h2 { color: #2b6cb0; font-size: 20pt; margin-top: 35px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          h3 { color: #4a5568; font-size: 16pt; margin-top: 25px; }
          p { margin-bottom: 15px; text-align: justify; font-size: 12pt; }
          ul, ol { margin-bottom: 15px; margin-right: 20px; margin-left: 20px; }
          li { margin-bottom: 8px; font-size: 11pt; }
          a { color: #3182ce; text-decoration: underline; }
          strong { font-weight: bold; color: #1a202c; }
          .cover-container { text-align: center; margin-bottom: 50px; page-break-after: always; }
          .cover-img { width: 100%; max-width: 600px; border-radius: 15px; border: 1px solid #e2e8f0; }
          .footer { margin-top: 60px; font-size: 10pt; color: #a0aec0; text-align: center; border-top: 1px solid #edf2f7; padding-top: 15px; }
        </style>
      </head>
      <body>
    `;
    
    const footer = `
        <div class="footer">تم الإنشاء بواسطة إياد AI - شريكك الذكي في البحث والتعلم</div>
      </body>
      </html>
    `;
    
    // تحويل Markdown إلى HTML بشكل نظيف واحترافي
    let htmlContent = doc.content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/^\s*[\-\*]\s+(.*)$/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    if (!htmlContent.startsWith('<h')) htmlContent = '<p>' + htmlContent;
    htmlContent = htmlContent + '</p>';

    // دمج الغلاف إذا كان موجوداً
    const imgHtml = doc.imageUrl ? `<div class="cover-container"><h1>${doc.title}</h1><img src="${doc.imageUrl}" class="cover-img" alt="Cover" /></div>` : '';
    const fullHtml = header + imgHtml + htmlContent + footer;
    
    // إنشاء الملف وتحميله
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^\u0600-\u06FF\w\s-]/g, '').replace(/\s+/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10">
      {/* قسم الإدخال */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-14 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="relative z-10 space-y-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
              <BookOpenCheck className="w-4 h-4" /> Professional Research Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter flex items-center justify-center md:justify-start gap-4">
              {t('docTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{t('docSubTitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">{t('docTopicLabel')}</label>
                <div className="relative group">
                  <AlignLeft className="absolute left-5 top-5 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t('docTopicPlaceholder')}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-600/20 rounded-3xl outline-none text-slate-900 dark:text-white font-bold text-lg shadow-inner transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setUseSearch(!useSearch)}
                  className={`py-5 rounded-2xl font-black flex items-center justify-center gap-3 border-2 transition-all ${useSearch ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  <Globe className="w-5 h-5" />
                  {useSearch ? t('googleSearchActive') : t('offlineMode')}
                </button>
                <button
                  onClick={() => setIncludeImages(!includeImages)}
                  className={`py-5 rounded-2xl font-black flex items-center justify-center gap-3 border-2 transition-all ${includeImages ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  <ImageIcon className="w-5 h-5" />
                  {t('coverImage')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">{t('docLengthLabel')}</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { val: 500, label: t('shortArticle'), icon: FileText },
                    { val: 1000, label: t('standardResearch'), icon: FileSearch },
                    { val: 2000, label: t('detailedReport'), icon: BookOpenCheck }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setWordCount(opt.val)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold ${wordCount === opt.val ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <opt.icon className="w-5 h-5" />
                        <span>{opt.label}</span>
                      </div>
                      <span className="text-xs opacity-50">~{opt.val} w</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl hover:bg-blue-700 shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8 fill-white" />}
                {isGenerating ? t('generatingDoc') : t('startBuilding')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* قسم عرض المستند والتحميل */}
      {doc && (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-14 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors animate-in fade-in slide-in-from-bottom-12 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 border-b dark:border-slate-800 pb-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-xs">
                <LinkIcon className="w-4 h-4" /> Ready for Download
              </div>
              <h2 className="text-4xl font-black dark:text-white leading-tight">{doc.title}</h2>
            </div>
            <button 
              onClick={downloadAsWord} 
              className="group relative px-10 py-5 bg-blue-700 text-white rounded-3xl font-black text-xl flex items-center gap-4 hover:bg-blue-800 transition-all shadow-xl hover:shadow-blue-600/40 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Download className="w-7 h-7 relative z-10" /> 
              <span className="relative z-10">{t('downloadWord')}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              {doc.imageUrl && (
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 sticky top-24 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <img src={doc.imageUrl} className="w-full h-auto" alt="Research Cover" />
                </div>
              )}
            </div>
            
            <div className="lg:col-span-8">
              <article className="prose prose-xl dark:prose-invert max-w-none font-serif leading-relaxed">
                <div className="whitespace-pre-wrap dark:text-slate-200 text-slate-800 bg-slate-50 dark:bg-slate-800/30 p-8 md:p-12 rounded-[2.5rem] shadow-inner">
                  {doc.content}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
