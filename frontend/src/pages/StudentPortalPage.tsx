import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses } from '../api/classes';
import { getMyHolds, createHold, confirmHold, cancelHold } from '../api/holds';
import { StudentHold } from '../types';
import { useStudent } from '../context/StudentContext';
import { useToast } from '../context/ToastContext';
import { StudentIdentificationCard } from '../components/student/StudentIdentificationCard';
import { ActiveHoldSection } from '../components/student/ActiveHoldSection';
import { ClassList } from '../components/ClassList';
import { ApplicationHistory } from '../components/ApplicationHistory';

export const StudentPortalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { studentId, isIdentified } = useStudent();
  const { addToast } = useToast();

  const [selectedHold, setSelectedHold] = useState<StudentHold | null>(null);
  const activeHoldRef = useRef<HTMLDivElement>(null);
  const topIdentificationRef = useRef<HTMLDivElement>(null);

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

  // Query: Student Holds (polled every 5 seconds only when student is identified)
  const {
    data: myHolds = [],
    refetch: refetchMyHolds,
  } = useQuery({
    queryKey: ['myHolds', studentId],
    queryFn: () => getMyHolds(studentId),
    enabled: isIdentified,
    refetchInterval: 5000,
  });

  // Find active hold or confirmed admission
  const now = Date.now();
  const activeHold = myHolds.find(
    (h) => h.status === 'HELD' && new Date(h.expiresAt).getTime() > now
  ) || myHolds.find((h) => h.status === 'CONFIRMED') || (myHolds.length > 0 ? myHolds[0] : null);

  const currentDisplayHold = selectedHold || activeHold;

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
      setTimeout(() => {
        activeHoldRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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

  const handleContinueHold = (hold: StudentHold) => {
    setSelectedHold(hold);
    activeHoldRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePromptIdentification = () => {
    topIdentificationRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Student Identification Hero Section (shown when no student identified) */}
      {!isIdentified && (
        <div ref={topIdentificationRef}>
          <StudentIdentificationCard />
        </div>
      )}

      {/* Active Hold / Admission Status Section (shown when student is identified) */}
      {isIdentified && currentDisplayHold && (
        <div ref={activeHoldRef}>
          <ActiveHoldSection
            hold={currentDisplayHold}
            isSelected={!!selectedHold}
            onShowLatest={() => setSelectedHold(null)}
            onConfirm={async (id) => { await confirmMutation.mutateAsync(id); }}
            onCancel={async (id) => { await cancelMutation.mutateAsync(id); }}
            onExpire={handleExpire}
          />
        </div>
      )}

      {/* Available Classes & Shifts */}
      <section>
        <ClassList
          classes={classes}
          isLoading={isLoadingClasses}
          studentId={studentId}
          myHolds={isIdentified ? myHolds : []}
          onApply={async (classId) => { await applyMutation.mutateAsync(classId); }}
          onContinueHold={handleContinueHold}
          onPromptIdentification={handlePromptIdentification}
          onRefresh={() => {
            refetchClasses();
            if (isIdentified) refetchMyHolds();
          }}
          isRefreshing={isFetchingClasses}
        />
      </section>

      {/* Student Application History (strictly isolated to identified student) */}
      {isIdentified && (
        <section>
          <ApplicationHistory
            holds={myHolds}
            onSelectHold={(hold) => {
              setSelectedHold(hold);
              activeHoldRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </section>
      )}
    </div>
  );
};
