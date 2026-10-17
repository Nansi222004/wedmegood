import { useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import LoginRequired from '../../components/common/LoginRequired';
import { getAuthToken } from '../../services/userApi';
import JobsBoard from './JobsBoard';
import { customerJobsApi } from './workApi';

/** Customers hire verified helpers for a home function (housekeeping, guest assistance, serving...) */
const HomeHelp = () => {
  const navigate = useNavigate();
  if (!getAuthToken()) return <LoginRequired message="Log in to hire verified helpers for your home function." />;
  return (
    <div className="min-h-screen pb-32 px-4 pt-3 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/user/home'))} className="w-10 h-10 rounded-full bg-white border border-[#F2E5EC] shadow-sm flex items-center justify-center text-[#401332] cursor-pointer" aria-label="Back"><Icon name="chevronLeft" size="sm" /></button>
        <div>
          <h1 className="text-2xl font-bold text-[#401332] leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Help at home</h1>
          <p className="text-xs text-[#7A6876]">Housekeeping, guest assistance, serving and more for your function</p>
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EDE3D6] text-xs text-[#5C4A57] leading-relaxed">
        Only ID-verified workers aged 18+ are offered your job. Your full address is shared only with the workers who accept. Pay them directly and record the payment here so both of you have a receipt.
      </div>
      <JobsBoard api={customerJobsApi} mode="Customer" />
    </div>
  );
};

export default HomeHelp;
