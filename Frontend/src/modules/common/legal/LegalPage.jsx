import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import ContactAdmin from './ContactAdmin';
import { DOCUMENTS, LAST_UPDATED } from './legalContent';

const HEADING_SERIF = { fontFamily: '"Playfair Display", Georgia, serif' };
const HEADING_SANS = { fontFamily: '"Plus Jakarta Sans", "Poppins", sans-serif' };

// One layout, two looks: the customer app (warm wine and cream) and the vendor app (violet)
const THEMES = {
  user: {
    page: 'bg-[#FAF6F0] text-[#2E1026]',
    bar: 'bg-[#FAF6F0]/95 border-[#EDE3D6]',
    logo: '/utsavo_logo_transparent.webp',
    login: '/login',
    base: '/user',
    badge: 'bg-[#F3EBF9] text-[#551E43]',
    heading: 'text-[#551E43]',
    headingFont: HEADING_SERIF,
    body: 'text-[#3D2A38]',
    muted: 'text-[#7A6876]',
    link: 'text-[#551E43]',
    card: 'bg-white border-[#F2E5EC]',
    inner: 'bg-[#FAF6F0] border-[#EDE3D6]',
    field: 'border-[#E5D5DC] focus:border-[#551E43] text-[#2E1026]',
    primaryBtn: 'bg-[#551E43] hover:bg-[#401332]',
    ghostBtn: 'border-[#E5D5DC] text-[#401332] hover:bg-[#FAF6F0]',
    tabOn: 'bg-[#551E43] text-white border-[#551E43]',
    tabOff: 'bg-white text-[#551E43] border-[#E5D5DC] hover:bg-[#FAF6F0]',
    num: 'bg-[#F3EBF9] text-[#551E43]'
  },
  vendor: {
    page: 'bg-gradient-to-br from-[#f5f3ff] via-white to-[#f3e8ff] text-slate-800',
    bar: 'bg-white/90 border-violet-100',
    logo: '/assets/vendor/logo_theme.webp',
    login: '/vendor/login',
    base: '/vendor',
    badge: 'bg-violet-100 text-[#4F35C3]',
    heading: 'text-[#3b2a9a]',
    headingFont: HEADING_SANS,
    body: 'text-slate-700',
    muted: 'text-slate-500',
    link: 'text-[#4F35C3]',
    card: 'bg-white border-violet-100',
    inner: 'bg-violet-50/60 border-violet-100',
    field: 'border-slate-200 focus:border-[#4F35C3] text-slate-800',
    primaryBtn: 'bg-[#4F35C3] hover:bg-[#3f2aa6]',
    ghostBtn: 'border-violet-200 text-[#4F35C3] hover:bg-violet-50',
    tabOn: 'bg-[#4F35C3] text-white border-[#4F35C3]',
    tabOff: 'bg-white text-[#4F35C3] border-violet-200 hover:bg-violet-50',
    num: 'bg-violet-100 text-[#4F35C3]'
  }
};

const jump = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Public privacy / terms page. Needs no login. Used by four separate links:
 * /user/privacy, /user/terms, /vendor/privacy and /vendor/terms.
 */
const LegalPage = ({ audience, doc }) => {
  const theme = THEMES[audience];
  const content = DOCUMENTS[audience]?.[doc];
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!content) return undefined;
    const previous = document.title;
    document.title = `${content.title} · Utsavo ${audience === 'vendor' ? 'for Vendors' : ''}`.trim();
    window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, [content, audience]);

  // Old links used /user/privacy?tab=terms
  if (audience === 'user' && doc === 'privacy' && params.get('tab') === 'terms') {
    return <Navigate to="/user/terms" replace />;
  }
  if (!content) return <Navigate to={theme.login} replace />;

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(theme.login));
  const otherDocs = [['privacy', 'Privacy Policy'], ['terms', 'Terms of Service']];

  return (
    <div className={`min-h-screen font-['Poppins',sans-serif] ${theme.page}`}>
      <header className={`sticky top-0 z-20 border-b backdrop-blur ${theme.bar}`}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${theme.ghostBtn}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <Link to={theme.login} className="flex items-center" aria-label="Utsavo">
            <img src={theme.logo} alt="Utsavo" className="h-8 w-auto" />
          </Link>
          <button type="button" onClick={() => jump('contact')} className={`ml-auto text-xs font-bold hover:underline cursor-pointer ${theme.link}`}>
            Contact us
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 pb-16">
        <nav className="flex gap-2" aria-label="Legal pages">
          {otherDocs.map(([key, label]) => (
            <Link
              key={key}
              to={`${theme.base}/${key}`}
              replace
              aria-current={key === doc ? 'page' : undefined}
              className={`px-4 py-2 rounded-full border text-xs font-bold ${key === doc ? theme.tabOn : theme.tabOff}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${theme.badge}`}>{content.audience}</span>
          <h1 className={`mt-3 text-3xl sm:text-4xl font-bold leading-tight ${theme.heading}`} style={theme.headingFont}>{content.title}</h1>
          <p className={`mt-1 text-xs font-semibold ${theme.muted}`}>Last updated: {LAST_UPDATED}</p>
          <p className={`mt-4 text-[15px] leading-relaxed ${theme.body}`}>{content.intro}</p>
        </div>

        <nav className={`mt-6 rounded-2xl border p-4 ${theme.card}`} aria-label="On this page">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>On this page</p>
          <ol className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1">
            {content.sections.map((section, i) => (
              <li key={section.heading}>
                <button type="button" onClick={() => jump(`section-${i + 1}`)} className={`text-left text-[13px] hover:underline cursor-pointer ${theme.link}`}>
                  {i + 1}. {section.heading}
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => jump('contact')} className={`text-left text-[13px] hover:underline cursor-pointer ${theme.link}`}>
                {content.sections.length + 1}. Contact us
              </button>
            </li>
          </ol>
        </nav>

        <div className="mt-8 space-y-8">
          {content.sections.map((section, i) => (
            <section key={section.heading} id={`section-${i + 1}`} className="scroll-mt-20">
              <h2 className={`flex items-start gap-3 text-xl font-bold ${theme.heading}`} style={theme.headingFont}>
                <span className={`mt-0.5 shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center font-['Poppins',sans-serif] ${theme.num}`}>{i + 1}</span>
                <span>{section.heading}</span>
              </h2>
              <div className={`mt-2 sm:pl-10 space-y-3 text-[14.5px] leading-relaxed ${theme.body}`}>
                {(section.p || []).map((text, k) => <p key={k}>{text}</p>)}
                {section.items && (
                  <ul className="list-disc pl-5 space-y-1.5 marker:text-current">
                    {section.items.map((item, k) => <li key={k}>{item}</li>)}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10">
          <ContactAdmin topics={content.contactTopics} audienceLabel={content.audience} theme={theme} />
        </div>

        <footer className={`mt-8 flex flex-wrap items-center justify-between gap-3 text-xs ${theme.muted}`}>
          <span>© {new Date().getFullYear()} Utsavo</span>
          <span className="flex gap-4">
            {otherDocs.map(([key, label]) => (
              <Link key={key} to={`${theme.base}/${key}`} className={`font-semibold hover:underline ${theme.link}`}>{label}</Link>
            ))}
          </span>
        </footer>
      </main>
    </div>
  );
};

export default LegalPage;
