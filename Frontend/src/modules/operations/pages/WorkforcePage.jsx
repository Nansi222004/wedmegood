import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOps } from '../opsApi';
import { PageHeader } from '../ui';
import JobsBoard from '../../workforce/JobsBoard';

/** Find short-term workers for events (catering helpers, loaders, technicians, drivers...) */
const WorkforcePage = () => {
  const { api } = useOps();
  const [params] = useSearchParams();
  const [events, setEvents] = useState([]);
  useEffect(() => { api.events('upcoming').then(r => setEvents(r.data)).catch(() => {}); }, [api]);
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-10">
      <PageHeader title="Temporary workers" subtitle="Post a job; verified workers near the venue are offered it one by one" />
      <JobsBoard api={api} mode="Vendor" events={events} initialEventId={params.get('eventId') || ''} />
    </div>
  );
};

export default WorkforcePage;
