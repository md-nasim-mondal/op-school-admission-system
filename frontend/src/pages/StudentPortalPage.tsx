import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses } from '../api/classes';
import { getMyHolds, createHold, confirmHold, cancelHold } from '../api/holds';
import { StudentHold } from '../types';
import { useStudent } from '../context/StudentContext';
import { useToast } from '../context/ToastContext';
import { StatusBanner } from '../components/student/StatusBanner';
import { ActiveHoldSection } from '../components/student/ActiveHoldSection';
import { ClassList } from '../components/ClassList';
import { ApplicationHistory } from '../components/ApplicationHistory';

export const StudentPortalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { studentId, isValidBRN } = useStudent();
  const { addToast } = useToast();

  const [selectedHold, setSelectedHold] = useState<StudentHold | null>(null);

  // Query: Classes (polled every 5 seconds for real-time seat counts)
  const {
    data: classes = [],
    isLoading: isLoadingClasses,
    isFetching: isFetchingClasses,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
    refetchInterval: 5000,
  });

  // Query: Student Holds (polled every 5 seconds if BRN is valid)
  const {
    data: myHolds = [],
    refetch: refetchMyHolds,
  } = useQuery({
    queryKey: ['myHolds', studentId],
    queryFn: () => getMyHolds(studentId),
    enabled: isValidBRN,
    refetchInterval: 5000,
  });

  // Find active hold or confirmed admission
  const activeHold = myHolds.find((h) => h.status === 'HELD') 
    || myHolds.find((h) => h.status === 'CONFIRMED')
    || (myHolds.length > 0 ? myHolds[0] : null);

  const currentDisplayHold = selectedHold || activeHold;

  const hasActiveHoldOrConfirmed = myHolds.some(
    (h) => h.status === 'HELD' || h.status === 'CONFIRMED'
  );

  // Mutation: Apply for seat (Create Hold)
  const applyMutation = useMutation({
    mutationFn: (classId: string) => createHold(classId, studentId),
    onSuccess: () => {
      addToast(
        'success',
        'A seat has been reserved for you! You have 10 minutes to pay the fee and confirm.',
        'Seat Held Successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['myHolds', studentId] });
      setSelectedHold(null);
    },
    onError: (err: any) => {
      addToast('error', err.message, 'Application Failed');
    },
  });

  // Mutation: Confirm Hold (Payment simulation)
  const confirmMutation = useMutation({
    mutationFn: (holdId: string) => confirmHold(holdId, studentId),
    onSuccess: () => {
      addToast(
        'success',
        'Payment successful! Your admission has been confirmed.',
        'Admission Confirmed 🎉'
      );
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['myHolds', studentId] });
      setSelectedHold(null);
    },
    onError: (err: any) => {
      addToast('error', err.message, 'Confirmation Failed');
    },
  });

  // Mutation: Cancel Hold
  const cancelMutation = useMutation({
    mutationFn: (holdId: string) => cancelHold(holdId, studentId),
    onSuccess: () => {
      addToast(
        'success',
        'Your application has been cancelled and the seat released.',
        'Application Cancelled'
      );
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['myHolds', studentId] });
      setSelectedHold(null);
    },
    onError: (err: any) => {
      addToast('error', err.message, 'Cancellation Failed');
    },
  });

  const handleExpire = () => {
    queryClient.invalidateQueries({ queryKey: ['classes'] });
    queryClient.invalidateQueries({ queryKey: ['myHolds', studentId] });
  };

  return (
    <div className="space-y-8">
      {/* Identity Status Banner */}
      <StatusBanner />

      {/* Active Hold Section (if present) */}
      {isValidBRN && currentDisplayHold && (
        <ActiveHoldSection
          hold={currentDisplayHold}
          isSelected={!!selectedHold}
          onShowLatest={() => setSelectedHold(null)}
          onConfirm={async (id) => { await confirmMutation.mutateAsync(id); }}
          onCancel={async (id) => { await cancelMutation.mutateAsync(id); }}
          onExpire={handleExpire}
        />
      )}

      {/* Available Classes & Shifts */}
      <section>
        <ClassList
          classes={classes}
          isLoading={isLoadingClasses}
          studentId={studentId}
          hasActiveHoldOrConfirmed={hasActiveHoldOrConfirmed}
          onApply={async (classId) => { await applyMutation.mutateAsync(classId); }}
          onRefresh={() => {
            refetchClasses();
            if (isValidBRN) refetchMyHolds();
          }}
          isRefreshing={isFetchingClasses}
        />
      </section>

      {/* Student Application History */}
      {isValidBRN && (
        <section>
          <ApplicationHistory
            holds={myHolds}
            onSelectHold={(hold) => setSelectedHold(hold)}
          />
        </section>
      )}
    </div>
  );
};
