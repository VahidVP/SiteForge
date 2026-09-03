import type { SiteFlags } from './site'

export interface Project {
  name: string
  description: string
  tags: string[]
}

export interface Service {
  icon: string
  title: string
  text: string
}

export interface TeamMember {
  name: string
  role: string
  bio: string
}

export interface SiteCopy {
  heroTitle: string
  tagline: string
  ctaLabel: string
  marqueeItems: string[]
  stats: { value: string; label: string }[]
  cardsTitle: string
  cards: { title: string; text: string }[]
  aboutTitle: string
  aboutParagraphs: string[]
  projectsTitle: string
  projects: Project[]
  servicesTitle: string
  services: Service[]
  team: TeamMember[]
}

const personalEn: SiteCopy = {
  heroTitle: 'Hi, I am glad you are here.',
  tagline: 'Designer and developer crafting small, sharp things for the web.',
  ctaLabel: 'See my work',
  marqueeItems: [],
  stats: [
    { value: '6+', label: 'Years building' },
    { value: '30+', label: 'Projects shipped' },
    { value: '100%', label: 'Coffee powered' }
  ],
  cardsTitle: 'What I do best',
  cards: [
    { title: 'Design', text: 'Clean interfaces that put content first and noise last.' },
    { title: 'Build', text: 'Reliable web apps with modern, boring-in-a-good-way tooling.' },
    { title: 'Ship', text: 'From idea to production without the drama.' }
  ],
  aboutTitle: 'About me',
  aboutParagraphs: [
    'I am a designer-developer who enjoys the whole journey of a product: the first sketch, the messy middle, and the polished release.',
    'When I am not pushing pixels or commits, I am probably hiking, sketching interfaces in a notebook, or teaching a friend to code.'
  ],
  projectsTitle: 'Selected work',
  projects: [
    { name: 'Nimbus Notes', description: 'A minimal note-taking app with offline sync.', tags: ['React', 'PWA'] },
    { name: 'Orbit Dashboard', description: 'Analytics dashboard with realtime charts.', tags: ['TypeScript', 'Charts'] },
    { name: 'Fable Landing', description: 'Story-driven landing page for an indie game.', tags: ['Animation', 'CSS'] },
    { name: 'Ledger Lite', description: 'Personal finance tracker that respects privacy.', tags: ['React', 'API'] }
  ],
  servicesTitle: '',
  services: [],
  team: []
}

const personalFa: SiteCopy = {
  heroTitle: 'سلام، خوشحالم که اینجا هستید.',
  tagline: 'طراح و توسعه‌دهنده؛ سازنده چیزهای کوچک و دقیق برای وب.',
  ctaLabel: 'دیدن نمونه‌کارها',
  marqueeItems: [],
  stats: [
    { value: '+۶', label: 'سال تجربه' },
    { value: '+۳۰', label: 'پروژه تحویل شده' },
    { value: '۱۰۰٪', label: 'با قهوه!' }
  ],
  cardsTitle: 'کارهای من',
  cards: [
    { title: 'طراحی', text: 'رابط‌های تمیز که محتوا اول است و حاشیه آخر.' },
    { title: 'ساخت', text: 'اپلیکیشن‌های وب مطمئن با ابزارهای مدرن.' },
    { title: 'تحویل', text: 'از ایده تا محصول نهایی، بدون دردسر.' }
  ],
  aboutTitle: 'درباره من',
  aboutParagraphs: [
    'من طراح-توسعه‌دهنده‌ای هستم که از تمام مسیر یک محصول لذت می‌برم: از اولین طرح روی کاغذ تا انتشار نهایی.',
    'وقتی مشغول کد زدن یا طراحی نیستم، احتمالاً در حال کوهنوردی، اسکچ رابط کاربری در دفترچه، یا آموزش برنامه‌نویسی به دوستانم هستم.'
  ],
  projectsTitle: 'نمونه‌کارهای منتخب',
  projects: [
    { name: 'نیمبوس نوتس', description: 'اپ یادداشت مینیمال با همگام‌سازی آفلاین.', tags: ['ری‌اکت', 'PWA'] },
    { name: 'اوربین داشبورد', description: 'داشبورد تحلیلی با نمودارهای زنده.', tags: ['تایپ‌اسکریپت', 'نمودار'] },
    { name: 'فِیبل لندینگ', description: 'صفحه فرود داستان‌محور برای یک بازی مستقل.', tags: ['انیمیشن', 'CSS'] },
    { name: 'لجر لایت', description: 'مدیریت مالی شخصی با حفظ حریم خصوصی.', tags: ['ری‌اکت', 'API'] }
  ],
  servicesTitle: '',
  services: [],
  team: []
}

const businessEn: SiteCopy = {
  heroTitle: 'Quality work, delivered on time.',
  tagline: 'We help ambitious teams design, build and launch digital products their customers love.',
  ctaLabel: 'Explore our services',
  marqueeItems: ['Trusted by teams', '14 industry awards', '98% returning clients', 'Senior people only'],
  stats: [
    { value: '120+', label: 'Projects delivered' },
    { value: '14', label: 'Industry awards' },
    { value: '98%', label: 'Clients who return' }
  ],
  cardsTitle: 'Why teams choose us',
  cards: [
    { title: 'Experience', text: 'A decade of shipping across fintech, retail and health.' },
    { title: 'Quality', text: 'Senior people on every engagement. No handoffs to juniors.' },
    { title: 'Support', text: 'A real human answers when you need us. Usually within hours.' }
  ],
  aboutTitle: 'Who we are',
  aboutParagraphs: [
    'Founded in 2016, we started as three engineers with a shared belief: software should be boring to operate and delightful to use.',
    'Today we are a distributed team of designers, engineers and strategists. We stay deliberately small so every client gets our best people.'
  ],
  projectsTitle: '',
  projects: [],
  servicesTitle: 'Services',
  services: [
    { icon: '🎨', title: 'Product Design', text: 'Research, UX flows and polished UI systems your team can maintain.' },
    { icon: '⚙️', title: 'Engineering', text: 'Web platforms and APIs built to scale, documented so anyone can take over.' },
    { icon: '📈', title: 'Growth & Analytics', text: 'Dashboards and experiments that turn traffic into decisions.' },
    { icon: '🛡️', title: 'Care Plans', text: 'Monitoring, backups and improvements after launch. Sleep well.' }
  ],
  team: [
    { name: 'Dana Whitfield', role: 'Founder / Engineering', bio: 'Previously led platform teams at two unicorns. Writes the hard parts.' },
    { name: 'Marcus Lee', role: 'Design Director', bio: 'Turns fuzzy ideas into interfaces. Obsessive about typography.' },
    { name: 'Priya Nair', role: 'Delivery Lead', bio: 'Keeps twelve projects moving without breaking a sweat.' }
  ]
}

const businessFa: SiteCopy = {
  heroTitle: 'کار باکیفیت، تحویل به‌موقع.',
  tagline: 'به تیم‌های جاه‌طلب کمک می‌کنیم محصولات دیجیتال را طراحی، ساخت و عرضه کنند.',
  ctaLabel: 'مشاهده خدمات',
  marqueeItems: ['مورد اعتماد تیم‌ها', '۱۴ جایزه صنعت', '۹۸٪ مشتریان وفادار', 'فقط افراد متخصص'],
  stats: [
    { value: '+۱۲۰', label: 'پروژه تحویل شده' },
    { value: '۱۴', label: 'جایزه صنعتی' },
    { value: '۹۸٪', label: 'مشتریان بازگشتی' }
  ],
  cardsTitle: 'چرا تیم‌ها ما را انتخاب می‌کنند',
  cards: [
    { title: 'تجربه', text: 'یک دهه اجرای پروژه در فین‌تک، خرده‌فروشی و سلامت.' },
    { title: 'کیفیت', text: 'در هر پروژه فقط افراد ارشد؛ نه واگذاری به تازه‌کارها.' },
    { title: 'پشتیبانی', text: 'یک انسان واقعی پاسخ می‌دهد؛ معمولاً ظرف چند ساعت.' }
  ],
  aboutTitle: 'ما که هستیم',
  aboutParagraphs: [
    'ما از سال ۲۰۱۶ با سه مهندس و یک باور مشترک شروع کردیم: نرم‌افزار باید در نگهداری ساده و در استفاده لذت‌بخش باشد.',
    'امروز تیمی توزیع‌شده از طراحان، مهندسان و استراتژیست‌ها هستیم. عمداً کوچک می‌مانیم تا هر مشتری بهترین‌های ما را دریافت کند.'
  ],
  projectsTitle: '',
  projects: [],
  servicesTitle: 'خدمات ما',
  services: [
    { icon: '🎨', title: 'طراحی محصول', text: 'تحقیق، جریان تجربه کاربری و سیستم‌های UI قابل نگهداری.' },
    { icon: '⚙️', title: 'مهندسی', text: 'پلتفرم‌ها و APIهای مقیاس‌پذیر با مستندات کامل.' },
    { icon: '📈', title: 'رشد و تحلیل', text: 'داشبورد و آزمایش‌هایی که ترافیک را به تصمیم تبدیل می‌کنند.' },
    { icon: '🛡️', title: 'پلن پشتیبانی', text: 'مانیتورینگ، بکاپ و بهبود پس از انتشار. خیالتان راحت.' }
  ],
  team: [
    { name: 'دانا ویتفیلد', role: 'بنیانگذار / مهندسی', bio: 'پیشتر رهبری تیم‌های پلتفرم را بر عهده داشت.' },
    { name: 'مارکوس لی', role: 'مدیر طراحی', bio: 'ایده‌های مبهم را به رابط کاربری تبدیل می‌کند.' },
    { name: 'پریا نیر', role: 'مدیر تحویل', bio: 'دوازده پروژه را بی‌وقفه پیش می‌برد.' }
  ]
}

const shopEn: SiteCopy = {
  heroTitle: 'Great products, fair prices.',
  tagline: 'Curated goods for everyday life. Free returns within 30 days, always.',
  ctaLabel: 'Browse products',
  marqueeItems: ['Free returns', 'Fast dispatch', 'Original goods', 'Support replies within a day'],
  stats: [
    { value: '4.9★', label: 'Average rating' },
    { value: '12k+', label: 'Happy customers' },
    { value: '48h', label: 'Fast dispatch' }
  ],
  cardsTitle: 'Why shop with us',
  cards: [
    { title: 'Curated products', text: 'Every item is hand-picked for quality by our team.' },
    { title: 'Fair prices', text: 'No hidden fees. No surprises at checkout. Ever.' },
    { title: 'Fast support', text: 'Questions? A real person replies within one day.' }
  ],
  aboutTitle: 'Our story',
  aboutParagraphs: [
    'We started this shop because we were tired of endless catalogs full of things nobody needed.',
    'So we do the opposite: a short list of products we use ourselves, tested for months before they earn a spot here.'
  ],
  projectsTitle: '',
  projects: [],
  servicesTitle: '',
  services: [],
  team: []
}

const shopFa: SiteCopy = {
  heroTitle: 'محصولات خوب، قیمت منصفانه.',
  tagline: 'کالاهای منتخب برای زندگی روزمره. ۳۰ روز ضمانت بازگشت بی‌قید و شرط.',
  ctaLabel: 'مشاهده محصولات',
  marqueeItems: ['ضمانت بازگشت', 'ارسال سریع', 'کالای اورجینال', 'پشتیبانی کمتر از یک روز'],
  stats: [
    { value: '۴.۹★', label: 'میانگین رضایت' },
    { value: '+۱۲هزار', label: 'مشتری خوشحال' },
    { value: '۴۸ ساعت', label: 'ارسال سریع' }
  ],
  cardsTitle: 'چرا از ما خرید کنید',
  cards: [
    { title: 'کالای منتخب', text: 'هر محصول توسط تیم ما بررسی و تأیید کیفیت شده است.' },
    { title: 'قیمت منصفانه', text: 'بدون هزینه پنهان؛ بدون غافلگیری در پرداخت.' },
    { title: 'پشتیبانی سریع', text: 'سوالی دارید؟ ظرف یک روز جواب می‌گیرید.' }
  ],
  aboutTitle: 'داستان ما',
  aboutParagraphs: [
    'این فروشگاه را ساختیم چون از کاتالوگ‌های بی‌پایان پر از چیزهایی که کسی لازمشان نداشت خسته شده بودیم.',
    'پس برعکس عمل می‌کنیم: لیستی کوتاه از محصولاتی که خودمان استفاده می‌کنیم و ماه‌ها تست شده‌اند.'
  ],
  projectsTitle: '',
  projects: [],
  servicesTitle: '',
  services: [],
  team: []
}

const byKey: Record<string, SiteCopy> = {
  'personal-en': personalEn,
  'personal-fa': personalFa,
  'business-en': businessEn,
  'business-fa': businessFa,
  'shop-en': shopEn,
  'shop-fa': shopFa
}

export function getCopy(siteType: string, lang: 'en' | 'fa'): SiteCopy {
  return byKey[`${siteType}-${lang}`] ?? byKey[`personal-${lang}`] ?? personalEn
}
