import { createContext, useContext } from 'react'
import { district } from './districts'
import type { Report } from './types'

export type Lang = 'en' | 'ar'

const en = {
  title: 'Baghdad Pothole Map',
  tagline: 'Every hole on the map. Every day counted.',
  statOpen: 'open potholes', statDays: 'avg. days unfixed', statFixed: 'fixed',
  tabMap: 'Map', tabList: 'Worst streets',
  legendFresh: 'under 30 days', legendOld: '30 to 90 days', legendAncient: 'over 90 days', legendFixed: 'fixed',
  demo: 'Demo mode: reports are saved in this browser only. Connect Supabase to share them.',
  emptyTitle: 'No potholes reported yet',
  emptyBody: 'Tap “Report a pothole”, take a photo, and pin it on the map. It appears for everyone with its own days-unfixed counter.',
  worstDistricts: 'Districts with the most unfixed potholes', oldest: 'Waiting longest for repair',
  report: 'Report a pothole', close: 'Close',
  photo: 'Photo', photoTap: 'Tap to take or choose a photo',
  gpsYes: "Location read from the photo's GPS. Check the pin below.",
  gpsNo: 'This photo has no GPS location. Tap the map to place the pin.',
  useMyLocation: 'Use my location', locating: 'Finding you…', locationDenied: "Couldn't get your location. Tap the map instead.",
  where: 'Where is it?', whereHint: 'Tap the map to move the pin.', district: 'District',
  road: 'Type of road', street: 'City street', streetHint: 'Neighbourhood roads, main streets',
  highway: 'Highway or expressway', highwayHint: 'Mohammed al-Qasim, airport road, ring roads',
  responsible: 'Responsible', noteLabel: 'Street name or landmark (optional)', notePlaceholder: 'e.g. Near Arasat al-Hindiya, outside the bakery',
  post: 'Post to the map', posting: 'Posting…', needBoth: 'Add a photo and a pin to post.', posted: 'Posted. Your pothole is on the map.',
  outside: 'That spot is outside Baghdad. Move the pin inside the city.',
  dailyLimit: 'You have reached today’s limit of 10 reports. Try again tomorrow.',
  saveFailed: "That didn't save. Check your connection and try again.",
  badPhoto: "That file isn't a photo we can read. Try a JPG or PNG.",
  daysUnfixed: 'days unfixed', dayUnfixed: 'day unfixed', days: 'days', open: 'open',
  reported: 'Reported', note: 'Note',
  confirm: "I've seen it too", confirmed: 'You confirmed this', confirmations: 'people confirmed',
  share: 'Share', shareHint: 'Officials react to viral posts. Save the image for Facebook, TikTok or Instagram, or send it straight to WhatsApp, Telegram or X.',
  saveImage: 'Save share image', copyText: 'Copy text', copied: 'Copied',
  fixedQ: 'Has it been fixed?', fixedHint: 'Add an after photo and credit whoever fixed it.',
  afterPhoto: 'After photo (optional)', fixedBy: 'Fixed by (optional)', fixedByPlaceholder: 'e.g. Amanat Baghdad, or a sponsor',
  markFixed: 'Mark as fixed', fixedAfter: 'Fixed after', before: 'Before', after: 'After', fixedCredit: 'Fixed by',
  cardFixed: 'FIXED', cityName: 'Baghdad', hashtag: '#BaghdadPotholes',
  highwayBody: 'Ministry of Construction & Housing, Roads and Bridges Directorate',
  streetBody: (m: string) => `Amanat Baghdad, ${m} municipality`,
  shareText: (d: string, n: string, body: string) =>
    `This pothole in ${d}, Baghdad has gone ${n} days without repair. Responsible: ${body}. #BaghdadPotholes`,
  switchLang: 'عربي',
}

type Strings = typeof en

const ar: Strings = {
  title: 'خريطة حُفَر بغداد',
  tagline: 'كل حفرة على الخريطة. وكل يوم محسوب.',
  statOpen: 'حفرة مفتوحة', statDays: 'متوسط أيام بلا تصليح', statFixed: 'تم تصليحها',
  tabMap: 'الخريطة', tabList: 'أسوأ الشوارع',
  legendFresh: 'أقل من ٣٠ يوماً', legendOld: 'من ٣٠ إلى ٩٠ يوماً', legendAncient: 'أكثر من ٩٠ يوماً', legendFixed: 'تم التصليح',
  demo: 'وضع تجريبي: البلاغات محفوظة في هذا المتصفح فقط. اربط Supabase لمشاركتها.',
  emptyTitle: 'لا توجد حفر مُبلَّغ عنها بعد',
  emptyBody: 'اضغط «بلِّغ عن حفرة»، صوّرها وثبّت مكانها على الخريطة. ستظهر للجميع مع عدّاد الأيام بلا تصليح.',
  worstDistricts: 'المناطق الأكثر حفراً بلا تصليح', oldest: 'الأطول انتظاراً للتصليح',
  report: 'بلِّغ عن حفرة', close: 'إغلاق',
  photo: 'الصورة', photoTap: 'اضغط لالتقاط صورة أو اختيارها',
  gpsYes: 'تمت قراءة الموقع من نظام GPS في الصورة. تأكد من الدبوس أدناه.',
  gpsNo: 'لا يوجد موقع GPS في هذه الصورة. اضغط على الخريطة لوضع الدبوس.',
  useMyLocation: 'استخدم موقعي', locating: 'جارٍ تحديد موقعك…', locationDenied: 'تعذّر تحديد موقعك. اضغط على الخريطة بدلاً من ذلك.',
  where: 'أين الحفرة؟', whereHint: 'اضغط على الخريطة لتحريك الدبوس.', district: 'المنطقة',
  road: 'نوع الطريق', street: 'شارع داخل المدينة', streetHint: 'شوارع الأحياء والشوارع الرئيسية',
  highway: 'طريق سريع', highwayHint: 'محمد القاسم، طريق المطار، الطرق الحلقية',
  responsible: 'الجهة المسؤولة', noteLabel: 'اسم الشارع أو علامة دالة (اختياري)', notePlaceholder: 'مثلاً: قرب عرصات الهندية، أمام الفرن',
  post: 'انشر على الخريطة', posting: 'جارٍ النشر…', needBoth: 'أضف صورة وحدد الموقع للنشر.', posted: 'تم النشر. حفرتك على الخريطة الآن.',
  outside: 'هذا الموقع خارج بغداد. حرّك الدبوس داخل المدينة.',
  dailyLimit: 'وصلت إلى الحد اليومي وهو ١٠ بلاغات. حاول غداً.',
  saveFailed: 'لم يتم الحفظ. تحقق من الاتصال وحاول مجدداً.',
  badPhoto: 'تعذّرت قراءة هذا الملف كصورة. جرّب JPG أو PNG.',
  daysUnfixed: 'يوماً بلا تصليح', dayUnfixed: 'يوم بلا تصليح', days: 'يوماً', open: 'مفتوحة',
  reported: 'تاريخ البلاغ', note: 'ملاحظة',
  confirm: 'شفتها آني هم', confirmed: 'أكّدت هذه الحفرة', confirmations: 'أشخاص أكّدوها',
  share: 'شارك', shareHint: 'المسؤولون يتفاعلون مع المنشورات المنتشرة. احفظ الصورة لفيسبوك أو تيك توك أو إنستغرام، أو أرسلها مباشرة عبر واتساب أو تيليغرام أو X.',
  saveImage: 'احفظ صورة المشاركة', copyText: 'انسخ النص', copied: 'تم النسخ',
  fixedQ: 'هل تم تصليحها؟', fixedHint: 'أضف صورة بعد التصليح واذكر من قام به.',
  afterPhoto: 'صورة بعد التصليح (اختياري)', fixedBy: 'صلّحها (اختياري)', fixedByPlaceholder: 'مثلاً: أمانة بغداد، أو جهة راعية',
  markFixed: 'علّمها كمُصلَّحة', fixedAfter: 'صُلِّحت بعد', before: 'قبل', after: 'بعد', fixedCredit: 'صلّحها',
  cardFixed: 'تم التصليح', cityName: 'بغداد', hashtag: '#حفر_بغداد',
  highwayBody: 'وزارة الإعمار والإسكان، دائرة الطرق والجسور',
  streetBody: (m) => `أمانة بغداد، بلدية ${m}`,
  shareText: (d, n, body) => `هذه الحفرة في ${d} ببغداد بلا تصليح منذ ${n} يوماً. الجهة المسؤولة: ${body}. #حفر_بغداد`,
  switchLang: 'English',
}

export const STRINGS: Record<Lang, Strings> = { en, ar }

export interface I18n {
  lang: Lang
  t: Strings
  num: (n: number) => string
  districtName: (id: string) => string
  responsibleBody: (r: Pick<Report, 'road' | 'district'>) => string
  date: (ms: number) => string
}

export function makeI18n(lang: Lang): I18n {
  const t = STRINGS[lang]
  const locale = lang === 'ar' ? 'ar-IQ' : 'en-GB'
  const nf = new Intl.NumberFormat(locale)
  return {
    lang,
    t,
    num: (n) => nf.format(n),
    districtName: (id) => district(id)?.[lang] ?? id,
    responsibleBody: (r) => {
      if (r.road === 'highway') return t.highwayBody
      const d = district(r.district)
      return t.streetBody(d ? (lang === 'ar' ? d.municipalityAr : d.municipalityEn) : '')
    },
    date: (ms) => new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export const I18nContext = createContext<I18n>(makeI18n('en'))
export const useI18n = () => useContext(I18nContext)
