import { useEffect, useState } from 'react';
import { useOps } from './opsApi';
import { toast } from '../../components/ui/Toast';

/** Owner switch: hold automatic and team-sent customer updates for review before they go out */
const ReviewToggle = () => {
  const { api } = useOps();
  const [on, setOn] = useState(null);
  useEffect(() => { api.settings().then(r => setOn(r.data.reviewCustomerUpdates)).catch(() => setOn(null)); }, [api]);
  if (on === null) return null;

  const toggle = () => api.updateSettings({ reviewCustomerUpdates: !on })
    .then(r => { setOn(r.data.reviewCustomerUpdates); toast.success(r.message); })
    .catch(err => toast.error(err.message));

  return (
    <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer select-none">
      <input type="checkbox" checked={on} onChange={toggle} />
      Review customer updates before they are sent
    </label>
  );
};

export default ReviewToggle;
