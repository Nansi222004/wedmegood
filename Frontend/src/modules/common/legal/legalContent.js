// Text of the public privacy and terms pages. Each document is a list of sections; a section has
// optional paragraphs (p) and bullet points (items). The pages are written to match how Utsavo
// actually works (quotations, cancellation, private photos, reports...), so change them together
// with the product.

export const LAST_UPDATED = '22 October 2026';

const SUPPORT_LINE = 'Write to admin.utsavo@gmail.com using the contact section at the end of this page.';

export const USER_PRIVACY = {
  title: 'Privacy Policy',
  audience: 'Customer app',
  intro: 'Utsavo connects people planning a celebration with event vendors such as venues, decorators, photographers, caterers and entertainers. This policy explains what we collect when you use Utsavo as a customer, how we use and protect it, and the choices you have. By using Utsavo you agree to this policy.',
  contactTopics: ['Privacy question', 'Request a copy of my data', 'Correct my information', 'Delete my account or data', 'Report a privacy concern', 'Other'],
  sections: [
    {
      heading: 'Information we collect',
      p: ['We collect only what we need to run the service.'],
      items: [
        'Account details: your name, email, mobile number, password (kept in protected, hashed form), city, and wedding or event date and preferences.',
        'Your requirements: event type, date, venue and PIN code, number of guests, budget, the services you need, your notes, and any reference photos or videos you upload.',
        'Activity with vendors: chat messages, quotations you receive, bookings, payment records that vendors enter, reviews, complaints and reports you submit.',
        'Planning tools you choose to use: budget, checklist, guest list, timeline, saved inspiration, e-invites, RSVPs and family groups.',
        'Device and usage information: browser or device type, notification tokens, and logs needed to keep the service secure. We use the PIN code and city you enter to find vendors near you; we do not track your live location in the background.',
        'If you use help-at-home or temporary work features: the job details you post, or, if you register as a worker, the profile and ID verification details described in the worker section of our terms.'
      ]
    },
    {
      heading: 'How we use your information',
      items: [
        'To match your requirements with suitable vendors and offer each requirement to one vendor at a time.',
        'To let you chat with vendors, receive quotations, make bookings and follow event preparation.',
        'To send notifications about quotations, bookings, messages, reminders and account activity.',
        'To prevent fake enquiries, spam and misuse, for example by limiting how many requirements you can post in a day and checking duplicates.',
        'To review complaints, reports and disputes, and to support you.',
        'To improve Utsavo, and to meet our legal duties.'
      ]
    },
    {
      heading: 'What vendors can see about you',
      items: [
        'The vendor offered or assigned to your requirement sees what you posted for that service. Your phone number is partly hidden until a booking is made; until then you talk through the in-app chat.',
        'Your reference photos and videos are private. They are never public links. Only the assigned vendor can open them, they are watermarked, and each view is logged. The vendor loses access when the requirement moves to another vendor, is closed or cancelled, and in any case 30 days after your event.',
        'After a booking, the vendor receives the contact details needed to deliver your event. Vendor team members see only what their role needs.',
        'Vendors can report how a customer behaved. You are told about such a report and can give your side. Only reports confirmed by the Utsavo team are summarised for other vendors, and never with the name of the vendor who reported.'
      ]
    },
    {
      heading: 'Who else receives your information',
      p: ['We do not sell your personal information. We share it only:'],
      items: [
        'with vendors you interact with, as described above;',
        'with service providers who help us run Utsavo, such as hosting, SMS and email delivery, push notifications, media storage, weather information and online payment processing, and only for those tasks;',
        'when the law requires it, or to protect the rights and safety of users, vendors and Utsavo.'
      ]
    },
    {
      heading: 'Payments',
      p: ['Payments for bookings are made directly between you and the vendor, outside the app. Vendors record the amounts they receive so that you can see them. Utsavo does not collect or store your card or bank details for bookings. If you buy an optional paid feature, an online payment provider handles the card or UPI details and we do not see them.']
    },
    {
      heading: 'Quotations and screenshots',
      p: ['Quotations are for viewing in the app. They cannot be downloaded or shared, and the sheet carries your name and phone number as a watermark. A web page cannot completely stop someone from photographing a screen, so please do not share quotations.']
    },
    {
      heading: 'How long we keep information',
      p: ['We keep your information while your account is active and for as long as needed to resolve disputes, prevent fraud and meet legal requirements. Reference photos follow the access limits above. When you delete your account we remove or anonymise your personal information, except records we must keep by law or for an open complaint.']
    },
    {
      heading: 'Your choices and rights',
      items: [
        'See and edit your profile and preferences in the app.',
        'Delete your account from your profile settings.',
        'Turn notification types on or off.',
        'Ask us to correct information or send you a copy of your data. ' + SUPPORT_LINE
      ]
    },
    {
      heading: 'Security',
      p: ['We protect information with access controls, encrypted connections and private storage for sensitive media. No system is completely secure, so please keep your password private and tell us straight away if you think your account was used by someone else.']
    },
    {
      heading: 'Children',
      p: ['Utsavo is for people aged 18 and over. If you believe a child has given us information, contact us and we will remove it.']
    },
    {
      heading: 'Changes to this policy',
      p: ['We may update this policy as Utsavo changes. The date at the top shows the latest version. If a change is important we will tell you in the app.']
    }
  ]
};

export const USER_TERMS = {
  title: 'Terms of Service',
  audience: 'Customer app',
  intro: 'These terms apply when you use Utsavo as a customer. Please read them. By creating an account or using the app you agree to them and to our Privacy Policy.',
  contactTopics: ['Question about the terms', 'Problem with a vendor or booking', 'Report a fake vendor', 'Safety concern', 'Other'],
  sections: [
    {
      heading: 'Who can use Utsavo',
      p: ['You must be 18 or older and give accurate information. You are responsible for your account and for keeping your password private.']
    },
    {
      heading: 'What Utsavo is',
      p: ['Utsavo is a platform that helps you find and book independent event vendors. Vendors are separate businesses. Utsavo is not the vendor and is not a party to the agreement between you and a vendor. We check and approve vendors, but we do not provide their services and we do not guarantee their quality, availability or prices. Utsavo is not responsible for problems you have with a vendor, to the extent the law allows. If something goes wrong, you can use the complaint process below.']
    },
    {
      heading: 'Posting a requirement',
      items: [
        'Give true details: event date, place, guests, budget and what you need. Photos and videos you upload must be yours to share.',
        'One requirement can create separate leads for each service (for example decoration, catering and photography). Each is handled, quoted and booked on its own.',
        'To prevent spam there is a daily limit on requirements, and duplicates of an open requirement are refused.',
        'Each service is offered to one vendor at a time. If you are not happy with the vendor, you can decline with a reason (or skip the reason). After a few automatic re-assignments you can explore other eligible vendors and choose one yourself. Being assigned a vendor is not a booking.'
      ]
    },
    {
      heading: 'Quotations',
      items: [
        'A quotation is valid for 7 days from the day it is sent. To book, accept it and pay the advance to the vendor within those 7 days.',
        'After 7 days a new quotation is shared. The price may stay the same or change, because market conditions are not the same every day.',
        'Accepting a quotation does not confirm the booking by itself. The booking is confirmed when the vendor confirms that your advance has been received. If it is not confirmed within the 7 days, the booking lapses and the vendor can share a new quotation.',
        'You can ask a vendor for changes. A revised quotation is a new version; earlier versions are kept on record.',
        'Quotations are for viewing in the app only. You may not download, copy, share or screenshot them. Your name and phone number appear on the sheet as a watermark.',
        'Extra work after you accept needs your approval as a change request, with its price shown.'
      ]
    },
    {
      heading: 'Payments',
      p: ['You pay the vendor directly. Utsavo does not collect, hold or refund booking payments. The vendor records each payment in the app and you can see the total, what you have paid and the balance. Keep your own receipts.']
    },
    {
      heading: 'Cancellation',
      items: [
        'Vendors decide whether cancellation is allowed for a booking. On peak days a vendor may switch it off. We show this on the quotation and before you accept.',
        'If cancellation is allowed, you must cancel at least 15 days before the event (this period can be changed by Utsavo; the notice shown when you accept applies to your booking). If you cancel later than that, the full booking amount is payable to the vendor.',
        'If the vendor switched cancellation off, the full booking amount is payable to the vendor if you cancel.',
        'If a vendor cancels, tell us through a complaint if you need help. Refunds of money you paid are between you and the vendor.'
      ]
    },
    {
      heading: 'Reviews, complaints and reports',
      items: [
        'Be honest. Reviews, complaints and reports must describe what really happened.',
        'When you file a complaint, the vendor is told and can give their side. The Utsavo team looks at both sides and records a decision with a reason. A complaint is not automatically a finding against anyone. Either side can appeal once within 7 days. Our time targets are goals, not legal deadlines.',
        'You can report a vendor on Utsavo as fake or misleading, describing their behaviour, approach and communication. Reports are reviewed before any vendor is listed as fake. Listed vendors are shown clearly and cannot be contacted through the app.',
        'False or abusive reports can lead to limits on your account.'
      ]
    },
    {
      heading: 'How you behave on Utsavo',
      items: [
        'Be respectful to vendors and their teams. No abuse, threats, harassment or discrimination.',
        'Do not post fake requirements, impersonate others, scrape the app, or try to avoid the platform rules.',
        'Vendors can report customer behaviour such as lack of support during the work, disrespect or delaying payment. You will be told and can respond. Reports confirmed by the Utsavo team are summarised to other vendors without naming who reported.'
      ]
    },
    {
      heading: 'Help at home and temporary workers',
      p: ['You can hire verified helpers for a function at home. Workers must be 18 or older and complete ID verification. Your full address is shown only to workers who accept. You agree the pay in the job post and pay the worker directly. Utsavo verifies identity but does not employ workers and is not responsible for their work. Both sides can message in the app and use the Safety / SOS button. In an emergency call 112 first.']
    },
    {
      heading: 'Your content',
      p: ['You keep ownership of what you upload. You allow Utsavo and the vendors you deal with to use it only to provide the service. Reference photos stay private as described in the Privacy Policy.']
    },
    {
      heading: 'Our responsibility',
      p: ['We try to keep Utsavo available and accurate but cannot promise it will always work without interruption. To the extent the law allows, Utsavo is not liable for indirect or consequential loss, or for losses from a vendor\'s act or failure. Nothing in these terms limits rights you have under the law that cannot be waived.']
    },
    {
      heading: 'Suspending or closing accounts',
      p: ['We may limit or close an account that breaks these terms or puts others at risk. You can delete your account at any time from your profile settings.']
    },
    {
      heading: 'Changes and governing law',
      p: ['We may update these terms. The date at the top shows the latest version, and we will tell you in the app about important changes. Continued use means you accept them. These terms are governed by the laws of India.']
    }
  ]
};

export const VENDOR_PRIVACY = {
  title: 'Privacy Policy',
  audience: 'Vendor app',
  intro: 'This policy explains what Utsavo collects about vendors and their teams, how it is used and shown, and how we handle the customer information vendors receive. By registering or using the vendor app you agree to it.',
  contactTopics: ['Privacy question', 'Correct my business information', 'Delete my vendor account or data', 'Report a privacy concern', 'Other'],
  sections: [
    {
      heading: 'Information we collect',
      items: [
        'Your details: name, business name, email, mobile number, city and service cities, languages, and password (kept in protected, hashed form).',
        'Business information: categories and sub-categories, services, pricing, portfolio photos and videos, service area (PIN codes, radius, travel range), budget limits, and availability.',
        'Verification documents: ID proof and GST or business documents, and bank or UPI details you add.',
        'Subscription and payment history for your Utsavo plan.',
        'Leads, quotations, bookings, chats, reviews, complaints and the payments you record against bookings.',
        'Event operations data you enter: events, tasks, stock, gate passes, expenses, accounts and crew records.',
        'Team members you add: their name, mobile number, role and wage details, so they can log in with limited access.',
        'Device and usage information such as notification tokens, response times and acceptance of lead offers.'
      ]
    },
    {
      heading: 'How we use it',
      items: [
        'To verify and approve your business, and to keep customers safe from fake vendors.',
        'To decide who is offered each lead: your service, location, availability, budget limits and a fair rotation among eligible subscribed vendors.',
        'To show your public profile and let customers contact and book you.',
        'To run your subscription, support, notifications and the tools you use.',
        'To review complaints, reports and disputes, and to meet legal duties.'
      ]
    },
    {
      heading: 'What others can see',
      items: [
        'Customers and visitors see your public profile: business name, city, services, portfolio, pricing information, ratings and reviews.',
        'Your documents, bank details, earnings, stock, expenses, lead statistics and team wages are private. They are visible only to you and, where needed, authorised Utsavo staff.',
        'Customers you deal with see your quotations and chat messages. A complaint against you is shared with you so you can reply; the customer does not see your private statement.',
        'If the Utsavo team confirms a vendor as fake, the listing is public and can include the name, phone number and a short description of what happened.',
        'Reports you file about customers are reviewed by the Utsavo team. The customer can see and answer them and sees your business name. If confirmed, other vendors see a summary without your name.'
      ]
    },
    {
      heading: 'Customer information you receive',
      p: ['Customer details are given to you only to serve their enquiry or booking. You must keep them confidential and not use them for marketing or share them. Before a booking, the phone number is partly hidden. Reference photos and videos are private, watermarked and logged, and your access ends when the lead moves to another vendor, closes or is cancelled, and in any case 30 days after the event. Do not download, screenshot or share them.']
    },
    {
      heading: 'Your team',
      p: ['You are responsible for the team members you add. Tell them what information about them is kept, give them only the role they need, and remove them when they leave. Team logins see only what their role allows.']
    },
    {
      heading: 'Who else receives information',
      p: ['We do not sell your information. We share it with customers as described above, with service providers who help us run Utsavo (hosting, SMS and email, notifications, media storage and online payments), and when the law requires it.']
    },
    {
      heading: 'Payments',
      p: ['Booking payments are made directly between customers and vendors, and are recorded by you for reference. Utsavo does not collect them. Your plan is paid online through a payment provider that handles card or UPI details; we do not see them.']
    },
    {
      heading: 'How long we keep information',
      p: ['We keep your data while your account is active and for as long as needed for disputes, fraud prevention, accounting and legal requirements. When you close your account we remove or anonymise personal information, except records we must keep.']
    },
    {
      heading: 'Your choices and rights',
      items: [
        'Edit your profile, service area, services and notification settings in the app.',
        'Pause new lead offers when you are busy.',
        'Deactivate your account in Settings, or ask us to correct, delete or send you a copy of your information. ' + SUPPORT_LINE
      ]
    },
    {
      heading: 'Security',
      p: ['We use access controls, encrypted connections and private storage for sensitive documents and media. Keep your password private and tell us at once if you think someone else used your account or a team login.']
    },
    {
      heading: 'Changes to this policy',
      p: ['We may update this policy. The date at the top shows the latest version, and we will tell you in the app about important changes.']
    }
  ]
};

export const VENDOR_TERMS = {
  title: 'Terms of Service',
  audience: 'Vendor app',
  intro: 'These terms apply to businesses that register on Utsavo as vendors and to the team members they add. By registering or using the vendor app you agree to them and to the Vendor Privacy Policy.',
  contactTopics: ['Question about the terms', 'Approval or subscription', 'Lead or quotation issue', 'Complaint or report', 'Safety concern', 'Other'],
  sections: [
    {
      heading: 'Who can register',
      items: [
        'You must be a genuine business or professional offering event services, and be 18 or older.',
        'All details, documents and photos must be accurate and yours to use. Copied portfolios or claims of equipment you do not own are not allowed.',
        'Your account is approved by Utsavo after review. We may reject, suspend or remove accounts that do not meet these terms.'
      ]
    },
    {
      heading: 'Subscription',
      p: ['You need an approved account and an active subscription to receive leads and use the business tools. Plan prices and durations are shown when you buy. When a subscription ends, new leads and these tools stop until you renew.']
    },
    {
      heading: 'Leads',
      items: [
        'A lead is offered to one eligible vendor at a time. You have a short window to accept or decline, currently 30 seconds from when the offer reaches your device. If you do not answer, it moves to the next vendor and counts as missed, not as a decline.',
        'Vendors take turns fairly. Ratings alone do not decide who gets leads.',
        'After you accept you must get in touch with the customer within the time shown, currently 1 hour (a chat message, a status update or a quotation counts). Otherwise the lead moves on.',
        'If you decline, choose a real reason (date unavailable, budget too low, outside your area, service not offered, already booked, need more details). Valid reasons are not held against you.',
        'You can pause new offers while you are busy. A lead is not a booking.'
      ]
    },
    {
      heading: 'Quotations and bookings',
      items: [
        'Send itemised quotations: services with quantities and prices, transport, labour and equipment, optional extras, tax, advance and milestones, what is included and not included, what the customer must arrange, setup and dismantle times, overtime and the cancellation terms.',
        'A quotation is valid for 7 days from sending. The customer must accept it and pay the advance within those 7 days. After that you share a new quotation, and the price may stay the same or change with market conditions.',
        'Confirm the booking in the app when the advance reaches you. A booking you have not confirmed within the 7 days lapses and the quotation expires.',
        'Customers can only view quotations in the app; they cannot download or share them. Do not share them in ways that expose customer details.',
        'Once a customer accepts, the price changes only through a change request that the customer approves. Earlier versions of your quotations are kept.'
      ]
    },
    {
      heading: 'Payments and tax',
      p: ['Customers pay you directly. Record each payment you receive honestly and promptly. Utsavo does not collect or hold booking payments. You are responsible for your own invoices, GST and taxes.']
    },
    {
      heading: 'Cancellation',
      items: [
        'You can switch the cancellation policy on or off, as a default in your settings and for each quotation. For example, you may switch it off on peak days. Customers see this before they accept.',
        'If cancellation is switched off and the customer cancels, the full booking amount is payable to you. If it is on and the customer cancels late (inside the notice period), the full amount is payable to you as well.',
        'Do not accept a booking you cannot deliver. If you cancel a confirmed booking, tell the customer at once. Repeated vendor cancellations can lead to action on your account.'
      ]
    },
    {
      heading: 'Customer information and private photos',
      items: [
        'Use customer information only to serve that customer. Do not use it for marketing, sell it or share it.',
        'Reference photos and videos are private. Do not download, screenshot, forward or reuse them. Your views are logged and access ends as described in the Vendor Privacy Policy.',
        'Do not try to move customers away from Utsavo to avoid platform rules.'
      ]
    },
    {
      heading: 'Reporting customers',
      p: ['You can report a customer\'s behaviour (respect, support during the work, payment, communication, approach) from a lead or booking. Reports must be true, specific and made in good faith. The customer can respond, and the Utsavo team decides. Confirmed reports are summarised for other vendors without your name. Treat a summary as information to plan your terms, not as a verdict. False or abusive reports can lead to action on your account.']
    },
    {
      heading: 'Complaints and fake vendors',
      items: [
        'When a customer files a complaint, you are told and can give your side with evidence. Our time targets are goals, not legal deadlines. A complaint is not a finding against you.',
        'The Utsavo team records a decision with a reason. Either side can appeal once within 7 days.',
        'Substantiated serious misconduct can lead to suspension. Vendors confirmed as fake are listed publicly and their contact is blocked.'
      ]
    },
    {
      heading: 'Event operations and your team',
      p: ['The event tools (tasks, stock, gate passes, purchases, expenses, accounts and crew records) help you run events. You are responsible for the accuracy of what you enter. You are responsible for the team members and sub-vendors you add, their access, and informing them about the data kept about them. Customer updates can be reviewed by you before they are sent.']
    },
    {
      heading: 'Temporary workers',
      p: ['You can post jobs for temporary workers. State the pay, food, travel, timings and duties honestly, and pay workers as agreed on the declared terms. Workers are ID-verified adults, but they are not Utsavo employees. Provide a safe workplace. Both sides can use the in-app messages and the Safety / SOS button; in an emergency call 112 first.']
    },
    {
      heading: 'Conduct',
      items: [
        'No fake enquiries, fake reviews, impersonation or copied portfolios.',
        'Treat customers, workers and Utsavo staff with respect. No abuse, threats or discrimination.',
        'Do not misuse the platform, scrape it, or try to bypass its rules.'
      ]
    },
    {
      heading: 'Our responsibility',
      p: ['Utsavo is a platform and is not a party to your agreement with customers. We do not guarantee a number of leads or bookings. To the extent the law allows, Utsavo is not liable for indirect or consequential loss, or for losses arising from a customer\'s act or failure. You are responsible for delivering the services you agree to.']
    },
    {
      heading: 'Ending your account',
      p: ['You can deactivate your account in Settings at any time. We may suspend or end accounts that break these terms or put others at risk.']
    },
    {
      heading: 'Changes and governing law',
      p: ['We may update these terms. The date at the top shows the latest version, and we will tell you in the app about important changes. Continued use means you accept them. These terms are governed by the laws of India.']
    }
  ]
};

export const DOCUMENTS = {
  user: { privacy: USER_PRIVACY, terms: USER_TERMS },
  vendor: { privacy: VENDOR_PRIVACY, terms: VENDOR_TERMS }
};
