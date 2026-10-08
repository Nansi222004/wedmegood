// SMS India Hub gateway (https://cloud.smsindiahub.in) for DLT-registered transactional SMS.
//
// The message text must match the DLT-approved template character for character, with
// each ##var## replaced. Approved OTP template (id SMSINDIAHUB_OTP_TEMPLATE_ID):
//   Welcome to the ##var## powered by Appzeto.Your OTP for registration is ##var##.BGADEC

const SEND_URL = 'https://cloud.smsindiahub.in/api/mt/SendSMS';
const REQUEST_TIMEOUT_MS = 15000;

const config = () => ({
  apiKey: process.env.SMSINDIAHUB_API_KEY,
  senderId: process.env.SMSINDIAHUB_SENDER_ID || 'BGADEC',
  entityId: process.env.SMSINDIAHUB_PE_ID || '1001164203633432409',
  otpTemplateId: process.env.SMSINDIAHUB_OTP_TEMPLATE_ID || '1007282516644508833',
  appName: process.env.SMS_APP_NAME || 'Utsavo',
  route: process.env.SMSINDIAHUB_ROUTE || '1',
});

const isSmsConfigured = () => Boolean(process.env.SMSINDIAHUB_API_KEY);

const buildOtpMessage = (otp) =>
  `Welcome to the ${config().appName} powered by Appzeto.Your OTP for registration is ${otp}.BGADEC`;

// Accepts a 10-digit Indian mobile (optionally prefixed with +91 / 91 / 0) and returns 91XXXXXXXXXX.
const toMsisdn = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error('Invalid Indian mobile number');
  }
  return `91${digits}`;
};

const sendSms = async ({ phone, text, templateId }) => {
  const { apiKey, senderId, entityId, route } = config();
  if (!apiKey) {
    throw new Error('SMSINDIAHUB_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    APIKey: apiKey,
    senderid: senderId,
    channel: '2', // 2 = transactional
    DCS: '0',
    flashsms: '0',
    number: toMsisdn(phone),
    text,
    route,
    EntityId: entityId,
    dlttemplateid: templateId,
  });

  const response = await fetch(`${SEND_URL}?${params.toString()}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await response.text();

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`SMS India Hub returned an unexpected response (HTTP ${response.status})`);
  }

  // Success is ErrorCode "000"; anything else (e.g. "7" = invalid credentials) is a failure.
  if (String(data.ErrorCode) !== '000') {
    throw new Error(`SMS India Hub error ${data.ErrorCode}: ${data.ErrorMessage || 'Unknown error'}`);
  }

  return { jobId: data.JobId, messageData: data.MessageData };
};

const sendOtpSms = async (phone, otp) =>
  sendSms({ phone, text: buildOtpMessage(otp), templateId: config().otpTemplateId });

module.exports = {
  isSmsConfigured,
  buildOtpMessage,
  sendSms,
  sendOtpSms,
};
