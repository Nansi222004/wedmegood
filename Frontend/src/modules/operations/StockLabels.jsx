import { useState } from 'react';
import QRCode from 'qrcode';
import { useOps } from './opsApi';
import { Btn, Modal } from './ui';
import { inputClass } from './tokens';
import { toast } from '../../components/ui/Toast';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Prints QR labels with each item's code, to stick on stock so packing can be scanned */
const StockLabels = ({ items, onClose, onCodesAssigned }) => {
  const { api } = useOps();
  const withCode = items.filter(i => i.itemCode);
  const [copies, setCopies] = useState(() => Object.fromEntries(withCode.map(i => [i._id, 1])));
  const [busy, setBusy] = useState(false);
  const missing = items.length - withCode.length;

  const assign = async () => {
    setBusy(true);
    try {
      const r = await api.assignItemCodes();
      toast.success(r.message);
      onCodesAssigned();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const print = async () => {
    const chosen = withCode.filter(i => Number(copies[i._id]) > 0);
    if (!chosen.length) return toast.error('Choose at least one label');
    // Open the window first, inside the click, so pop-up blockers allow it
    const win = window.open('', '_blank');
    if (!win) return toast.error('Allow pop-ups to print labels');
    setBusy(true);
    try {
      const labels = [];
      for (const item of chosen) {
        const src = await QRCode.toDataURL(item.itemCode, { margin: 1, width: 240, errorCorrectionLevel: 'M' });
        for (let n = 0; n < Math.min(200, Number(copies[item._id])); n++) labels.push({ item, src });
      }
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Stock labels</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 8mm; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, 48mm); gap: 4mm; }
          .label { border: 1px dashed #bbb; padding: 2mm; text-align: center; break-inside: avoid; }
          .label img { width: 32mm; height: 32mm; }
          .code { font: 700 11pt monospace; }
          .name { font-size: 8pt; color: #333; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
          @media print { .hint { display: none; } }
        </style></head><body>
        <p class="hint">Print on sticker sheets or plain paper and tape them on. Scan these when packing a gate pass.</p>
        <div class="grid">${labels.map(({ item, src }) => `<div class="label"><img src="${src}" alt=""><div class="code">${esc(item.itemCode)}</div><div class="name">${esc(item.itemName)}</div></div>`).join('')}</div>
        <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
        </body></html>`);
      win.document.close();
    } catch (err) {
      win.close();
      toast.error(err.message || 'Could not make the labels');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Print QR labels" onClose={onClose}>
      <div className="space-y-3">
        {missing > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-[12px] text-amber-900 flex flex-wrap items-center justify-between gap-2">
            <span>{missing} item(s) have no code, so no label can be printed for them.</span>
            <Btn variant="ghost" disabled={busy} onClick={assign}>Give them codes</Btn>
          </div>
        )}
        {withCode.length === 0 ? <p className="text-[12px] text-slate-400">No items with a code yet.</p> : (
          <div className="max-h-80 overflow-y-auto space-y-1">
            {withCode.map(i => (
              <div key={i._id} className="flex items-center justify-between gap-2 text-[12px] py-1 border-b border-slate-50">
                <span className="flex-1 min-w-0 truncate"><span className="font-mono font-semibold">{i.itemCode}</span> · {i.itemName}</span>
                <div className="w-20 shrink-0">
                  <input type="number" min="0" max="200" className={inputClass} value={copies[i._id] ?? 0} onChange={e => setCopies(c => ({ ...c, [i._id]: e.target.value }))} aria-label={`Labels for ${i.itemName}`} />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-400">Labels per item. Reusable items like frames usually need one label per piece; consumables need one for the box or shelf.</p>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
          <Btn disabled={busy || withCode.length === 0} onClick={print}>Print labels</Btn>
        </div>
      </div>
    </Modal>
  );
};

export default StockLabels;
