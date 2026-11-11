import { UserCheck } from 'lucide-react';
import { StudentHold } from '../../types';
import { ActiveHoldCard } from '../ActiveHoldCard';

interface ActiveHoldSectionProps {
  hold: StudentHold;
  isSelected: boolean;
  onShowLatest: () => void;
  onConfirm: (holdId: string) => Promise<void>;
  onCancel: (holdId: string) => Promise<void>;
  onExpire: () => void;
}

export const ActiveHoldSection: React.FC<ActiveHoldSectionProps> = ({
  hold,
  isSelected,
  onShowLatest,
  onConfirm,
  onCancel,
  onExpire,
}) => {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
          My Admission Status
        </h2>
        {isSelected && (
          <button
            type="button"
            onClick={onShowLatest}
            className="text-xs text-blue-600 hover:underline cursor-pointer"
          >
            Show Latest Application
          </button>
        )}
      </div>

      <ActiveHoldCard
        hold={hold}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onExpire={onExpire}
      />
    </section>
  );
};
