import { useState } from 'react';

export const ADMIN_EMAIL = 'admin.utsavo@gmail.com';

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * "Contact us" block shown at the end of every privacy and terms page.
 * Nothing is sent from the page itself: it opens the visitor's own email app (or Gmail) with the
 * message filled in, addressed to the Utsavo admin. Works without an account.
 */
const ContactAdmin = ({ topics, audienceLabel, theme }) => {
  const [topic, setTopic] = useState(topics[0]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const subject = `${topic} (${audienceLabel})`;
  const body = `${message.trim() ? `${message.trim()}\n\n` : ''}${name.trim() ? `Name: ${name.trim()}\n` : ''}Sent from the Utsavo ${audienceLabel.toLowerCase()} page`;
  const mailto = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ADMIN_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    if (await copyText(ADMIN_EMAIL)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const field = `w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm focus:outline-none ${theme.field}`;

  return (
    <section id="contact" className={`rounded-3xl border p-5 sm:p-7 ${theme.card}`}>
      <h2 className={`text-xl sm:text-2xl font-bold ${theme.heading}`} style={theme.headingFont}>Contact us</h2>
      <p className={`mt-1.5 text-sm leading-relaxed ${theme.muted}`}>
        Questions about this page, your data or your account? Write to the Utsavo admin team. We reply as soon as we can.
      </p>

      <div className={`mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border px-4 py-3 ${theme.inner}`}>
        <span aria-hidden="true" className="text-lg">✉️</span>
        <a href={`mailto:${ADMIN_EMAIL}`} className={`font-bold text-[15px] break-all hover:underline ${theme.link}`}>{ADMIN_EMAIL}</a>
        <button
          type="button"
          onClick={copy}
          className={`ml-auto px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${theme.ghostBtn}`}
        >
          {copied ? 'Copied' : 'Copy address'}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>What is it about?</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={`mt-1 ${field}`}>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Your name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={`mt-1 ${field}`} placeholder="Your name" />
        </label>
        <label className="block">
          <span className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Your message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1500}
            className={`mt-1 resize-none ${field}`}
            placeholder="Tell us how we can help. Please do not include passwords."
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <a href={mailto} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white text-center ${theme.primaryBtn}`}>Open in my email app</a>
        <a href={gmail} target="_blank" rel="noreferrer" className={`px-5 py-2.5 rounded-xl border text-sm font-bold text-center ${theme.ghostBtn}`}>Open in Gmail</a>
      </div>
      <p className={`mt-3 text-xs leading-relaxed ${theme.muted}`}>
        This page does not send the email itself. It opens your email app (or Gmail) with the message ready, addressed to {ADMIN_EMAIL}. You can also email us directly from any account.
      </p>
    </section>
  );
};

export default ContactAdmin;
