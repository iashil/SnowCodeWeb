import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ar";
type LanguageContextValue = { language: Language; isArabic: boolean; setLanguage: (language: Language) => void; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

const translations: Record<string, string> = {
  "Work": "الأعمال", "Approach": "منهجيتنا", "Services": "الخدمات", "Contact": "تواصل", "Admin": "الإدارة", "Home": "الرئيسية",
  "available for select projects": "متاحون لمشاريع مختارة", "independent digital studio · est. 2024": "استوديو رقمي مستقل · منذ 2024",
  "what we believe": "ما نؤمن به", "selected work": "أعمال مختارة", "the people": "الفريق", "have a good one?": "لديك فكرة؟",
  "Good ideas": "الأفكار الجيدة", "deserve": "تستحق", "good code.": "كودًا قويًا.", "Explore our work": "استكشف أعمالنا", "Start a conversation": "ابدأ محادثة",
  "Scroll to explore": "مرر للاستكشاف", "soft systems, sharp thinking": "أنظمة هادئة، تفكير دقيق", "the team mascot": "شخصية الفريق",
  "We make digital things feel": "نجعل الأشياء الرقمية تبدو", "inevitable.": "بديهية.", "How we work": "كيف نعمل",
  "Not louder.": "ليست أعلى صوتًا.", "Not busier.": "وليست أكثر ازدحامًا.", "Just clearer.": "بل أوضح.",
  "Craft over noise": "الإتقان فوق الضجيج", "Systems that breathe": "أنظمة تتنفس", "Momentum, calmly": "تقدم هادئ",
  "Built for the": "نبني للمستقبل", "long run.": "طويل المدى.", "All work": "كل الأعمال", "Operations platform": "منصة تشغيل", "E-commerce experience": "تجربة تجارة إلكترونية", "Analytics system": "نظام تحليلات",
  "More work available on request": "المزيد من الأعمال متاح عند الطلب", "See our GitHub": "شاهد GitHub الخاص بنا",
  "Good people": "أشخاص رائعون", "make good work.": "يصنعون عملًا رائعًا.", "OUR TEAM": "فريقنا",
  "Let’s make": "لنبنِ", "something": "شيئًا", "useful.": "مفيدًا.", "Your name": "اسمك", "Email address": "البريد الإلكتروني", "What are we making?": "ماذا سنبني؟",
  "Send the note": "إرسال الرسالة", "No sales pitch. No mailing list. Just a thoughtful reply.": "لا عروض مبيعات ولا قوائم بريدية، فقط رد مدروس.",
  "MESSAGE RECEIVED": "تم استلام الرسالة", "That’s a good start.": "هذه بداية جيدة.", "Send another note": "إرسال رسالة أخرى",
  "PRIVATE CONTENT DESK": "لوحة محتوى خاصة", "Welcome back.": "مرحبًا بعودتك.", "Admin email": "بريد المشرف", "Password": "كلمة المرور",
  "Remember me for 30 days": "تذكرني لمدة 30 يومًا", "Enter content desk": "دخول إلى لوحة المحتوى", "Checking...": "جارٍ التحقق...",
  "Sign out": "تسجيل الخروج", "Navigation": "التنقل", "Content desk": "لوحة المحتوى", "Public site": "الموقع العام",
  "published work": "الأعمال المنشورة", "new messages": "الرسائل الجديدة", "site visits": "زيارات الموقع", "SIMPLE STATISTICS": "إحصائيات مبسطة",
  "A quiet view of momentum.": "نظرة هادئة على التقدم.", "live counters": "عدادات مباشرة", "total messages": "إجمالي الرسائل", "projects in library": "المشاريع في المكتبة", "team members": "أعضاء الفريق", "tracked visits": "الزيارات المسجلة",
  "NEW PROJECT": "مشروع جديد", "EDIT PROJECT": "تعديل المشروع", "Add a new story.": "أضف مشروعًا جديدًا.", "Refine the story.": "حسّن تفاصيل المشروع.",
  "PROJECT LIBRARY": "مكتبة المشاريع", "What’s on the shelf.": "ما هو موجود في المكتبة.", "TEAM DIRECTORY": "دليل الفريق", "People behind the useful.": "الأشخاص خلف المنتجات المفيدة.",
  "SITE COLORS": "ألوان الموقع", "Set the atmosphere.": "اضبط أجواء الموقع.", "SECURITY": "الأمان", "Change your password.": "غيّر كلمة المرور.", "INBOX": "صندوق الرسائل", "Notes from good people.": "رسائل من أشخاص رائعين.",
  "Title": "العنوان", "Category / eyebrow": "التصنيف", "Description": "الوصف", "Preview URL": "رابط المعاينة", "Accent": "اللون المميز", "Tags": "الوسوم", "Project image": "صورة المشروع", "Visible on the public site": "إظهار في الموقع العام",
  "Save changes": "حفظ التغييرات", "Add project": "إضافة مشروع", "Name": "الاسم", "Role": "الدور الوظيفي", "Avatar URL": "رابط الصورة الشخصية", "Instagram": "إنستغرام", "WhatsApp": "واتساب", "GitHub": "جيت هب", "LinkedIn": "لينكدإن", "Show this member on the public site": "إظهار العضو في الموقع العام", "Save member": "حفظ العضو", "Add member": "إضافة عضو", "Cancel": "إلغاء",
  "Current password": "كلمة المرور الحالية", "New password": "كلمة المرور الجديدة", "Confirm new password": "تأكيد كلمة المرور الجديدة", "Update password": "تحديث كلمة المرور", "Save site colors": "حفظ ألوان الموقع", "Mark read": "تحديد كمقروءة", "Archive": "أرشفة",
  "No projects yet. Add the first story.": "لا توجد مشاريع بعد. أضف أول مشروع.", "Add the first team member.": "أضف أول عضو للفريق.", "Your inbox is quiet for now.": "صندوق الرسائل فارغ حاليًا.", "Messages": "الرسائل", "Hide menu": "إخفاء القائمة", "Show menu": "إظهار القائمة", "Dark theme": "الوضع الداكن", "Light theme": "الوضع الفاتح", "All messages": "كل الرسائل", "Unread": "غير مقروءة", "Read": "مقروءة", "Archived": "مؤرشفة", "All statuses": "كل الحالات", "Search by name, email, or message...": "ابحث بالاسم أو البريد أو الرسالة...", "Select visible": "تحديد الظاهر", "Clear selection": "إلغاء التحديد", "Delete selected": "حذف المحدد", "Quick reply": "رد سريع", "Delete": "حذف", "Loading messages...": "جارٍ تحميل الرسائل...", "No messages in this view.": "لا توجد رسائل في هذا العرض.", "Messages older than 10 days are removed automatically. Manual deletion is always available.": "تُحذف الرسائل الأقدم من 10 أيام تلقائيًا، ويتوفر الحذف اليدوي دائمًا.", "Write your reply...": "اكتب ردك...", "Open email reply": "فتح الرد عبر البريد", "Uses your configured email app to address": "سيستخدم تطبيق البريد المُعد لديك لإرسال الرد إلى",
  "Page Not Found": "الصفحة غير موجودة", "Sorry, the page you are looking for doesn't exist.": "عذرًا، الصفحة التي تبحث عنها غير موجودة.", "It may have been moved or deleted.": "ربما تم نقلها أو حذفها.", "Go Home": "العودة للرئيسية"
};

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function syncTranslation(language: Language) {
  const root = document.body;
  const applyText = (node: Text) => {
    const source = originalText.get(node) ?? node.nodeValue ?? "";
    if (!originalText.has(node)) originalText.set(node, source);
    let next = source;
    if (language === "ar") {
      for (const [english, arabic] of Object.entries(translations)) next = next.split(english).join(arabic);
    }
    if (node.nodeValue !== next) node.nodeValue = next;
  };
  const applyElement = (element: Element) => {
    const attrs = ["placeholder", "title", "aria-label"];
    const saved = originalAttributes.get(element) ?? new Map<string, string>();
    for (const attr of attrs) {
      const value = element.getAttribute(attr);
      if (value === null) continue;
      if (!saved.has(attr)) saved.set(attr, value);
      let next = saved.get(attr) ?? value;
      if (language === "ar") for (const [english, arabic] of Object.entries(translations)) next = next.split(english).join(arabic);
      if (value !== next) element.setAttribute(attr, next);
    }
    originalAttributes.set(element, saved);
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = (node as Text).parentElement;
    if (parent && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) applyText(node as Text);
  }
  root.querySelectorAll("*").forEach(applyElement);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem("snowcode-language") as Language) || "en");
  const setLanguage = (next: Language) => setLanguageState(next);
  const toggleLanguage = () => setLanguageState((current) => current === "en" ? "ar" : "en");
  useEffect(() => {
    localStorage.setItem("snowcode-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    syncTranslation(language);
    const observer = new MutationObserver(() => syncTranslation(language));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);
  return <LanguageContext.Provider value={{ language, isArabic: language === "ar", setLanguage, toggleLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
