import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Btn, Modal } from './ui';
import { inputClass } from './tokens';

const FORMATS = ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a'];

/**
 * Reads item codes from the camera. Uses the browser's barcode reader where there is one
 * (Chrome on Android reads QR and printed barcodes); elsewhere jsQR reads QR codes.
 * A typed code or a USB/Bluetooth scanner (which types and presses Enter) works too.
 * Calls onCode(code) for each new code; a code that stays in view is not repeated.
 */
const CodeScanner = ({ title = 'Scan item', onCode, onClose, status }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const last = useRef({ code: '', at: 0 });
  const onCodeRef = useRef(onCode);
  const [error, setError] = useState(() => (navigator.mediaDevices?.getUserMedia
    ? ''
    : 'This browser cannot use the camera. Type the code or use a barcode scanner below.'));
  const [typed, setTyped] = useState('');

  useEffect(() => { onCodeRef.current = onCode; }, [onCode]);

  useEffect(() => {
    let stream;
    let timer;
    let stopped = false;
    const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: FORMATS }) : null;

    // A label held in front of the camera is read once; it counts again only after it has
    // been out of view for 3 seconds
    const found = (code) => {
      const now = Date.now();
      if (!code) return;
      const stillInView = code === last.current.code && now - last.current.at < 3000;
      last.current = { code, at: now };
      if (stillInView) return;
      navigator.vibrate?.(60);
      onCodeRef.current(code);
    };

    const tick = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        try {
          if (detector) {
            const codes = await detector.detect(video);
            if (codes[0]) found(codes[0].rawValue.trim());
          } else {
            const canvas = canvasRef.current;
            const w = video.videoWidth;
            const h = video.videoHeight;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const qr = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
            if (qr?.data) found(qr.data.trim());
          }
        } catch { /* a frame that cannot be read is skipped */ }
      }
      timer = setTimeout(tick, 250);
    };

    if (!navigator.mediaDevices?.getUserMedia) return undefined;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => {
        if (stopped) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
        tick();
      })
      .catch(err => setError(err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow the camera in the browser settings, or type the code below.'
        : 'No camera found. Type the code or use a barcode scanner below.'));

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const submitTyped = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    onCodeRef.current(typed.trim());
    setTyped('');
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        {error ? (
          <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">{error}</p>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-[18%] border-2 border-white/80 rounded-xl pointer-events-none" />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
        {status && (
          <p className={`text-[12px] font-semibold text-center ${status.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{status.text}</p>
        )}
        <form onSubmit={submitTyped} className="flex gap-2">
          <input autoFocus className={inputClass} value={typed} onChange={e => setTyped(e.target.value)} placeholder="Or type / scan the item code" />
          <Btn type="submit" disabled={!typed.trim()}>Add</Btn>
        </form>
        <div className="flex justify-end"><Btn variant="ghost" onClick={onClose}>Done</Btn></div>
      </div>
    </Modal>
  );
};

export default CodeScanner;
