import { Info } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';

export const StatusBanner: React.FC = () => {
  const { isValidBRN } = useStudent();

  if (isValidBRN) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800">
        <strong className="font-semibold block">Please enter a valid 17-digit Birth Registration Number</strong>
        <span>
          To apply for admission or view your application history, provide your 17-digit student identity in the header above (or click <strong>Use Demo ID</strong>).
        </span>
      </div>
    </div>
  );
};
