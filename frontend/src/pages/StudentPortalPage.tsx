import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses } from '../api/classes';
import { getMyHolds, createHold, confirmHold, cancelHold } from '../api/holds';
import {
  ClassDetails,
  ConfirmHoldResponse,
  HoldResponse,
  StudentHold,
} from '../types';
import { useStudent } from '../context/StudentContext';
import { useToast } from '../context/ToastContext';
import { StudentIdentificationCard } from '../components/student/StudentIdentificationCard';
import { ActiveHoldSection } from '../components/student/ActiveHoldSection';
import { ClassList } from '../components/ClassList';
import { ApplicationHistory } from '../components/ApplicationHistory';
import { LoadingState } from '../components/LoadingState';
import { ErrorFallbackCard } from '../components/ErrorFallbackCard';
import { getErrorMessage } from '../utils/errors';

export const StudentPortalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { studentId, isIdentified } = useStudent();
  const { addToast } = useToast();

  const [selectedHold, setSelectedHold] = useState<StudentHold | null>(null);
  const activeHoldRef = useRef<HTMLDivElement>(null);
  const topIdentificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Student Portal | School Admission System';
  }, []);

  // Query: Classes (polled every 5 seconds for real-time seat counts)
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    isFetching: isFetchingClasses,
    isError: isErrorClasses,
    error: classesError,
    refetch: refetchClasses,
  } = useQuery<ClassDetails[], Error>({
    queryKey: ['classes'],
    queryFn: getClasses,
    refetchInterval: 5000,
  });
  const classes: ClassDetails[] = classesData ?? [];

  // Query: Student Holds (polled every 5 seconds only when student is identified)
  const {
    data: myHoldsData,
    isLoading: isLoadingMyHolds,
    isError: isErrorMyHolds,
    error: myHoldsError,
    refetch: refetchMyHolds,
  } = useQuery<StudentHold[], Error>({
    queryKey: ['myHolds', studentId],
    queryFn: () => getMyHolds(studentId),
    enabled: isIdentified,
    refetchInterval: 5000,
  });
  const myHolds: StudentHold[] = myHoldsData ?? [];

  // Find active hold or confirmed admission
  const now = Date.now();
  const activeHold =
    myHolds.find(
      (h: StudentHold) => h.status === 'HELD' && new Date(h.expiresAt).getTime() > now
    ) ||
    myHolds.find((h: StudentHold) => h.status === 'CONFIRMED') ||
    (myHolds.length > 0 ? myHolds[0] : null);

  const currentDisplayHold = selectedHold || activeHold;

  // Mutation: Apply for seat (Create Hold)
  const applyMutation = useMutation<HoldResponse, Error, string>({
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
    onError: (err: Error) => {
      addToast('error', getErrorMessage(err, 'Unable to hold a seat.'), 'Application Failed');
    },
  });

  // Mutation: Confirm Hold (Payment simulation)
  const confirmMutation = useMutation<ConfirmHoldResponse, Error, string>({
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
    onError: (err: Error) => {
      addToast('error', getErrorMessage(err, 'Unable to confirm admission.'), 'Confirmation Failed');
    },
  });

  // Mutation: Cancel Hold
  const cancelMutation = useMutation<void, Error, string>({
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
    onError: (err: Error) => {
      addToast('error', getErrorMessage(err, 'Unable to cancel application.'), 'Cancellation Failed');
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
          isError={isErrorClasses}
          errorMessage={classesError?.message}
          studentId={studentId}
          myHolds={isIdentified ? myHolds : []}
          onApply={async (classId: string) => { await applyMutation.mutateAsync(classId); }}
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
          {isLoadingMyHolds ? (
            <LoadingState
              title="Loading your admission status..."
              description="Checking for active seat holds and previous application records."
              accent="blue"
              compact
            />
          ) : isErrorMyHolds ? (
            <ErrorFallbackCard
              statusCode="Sync Error"
              title="Unable to load your application history"
              description="We couldn't retrieve your active seat hold or admission records right now."
              errorMessage={myHoldsError?.message}
              onRetry={() => {
                refetchMyHolds();
              }}
              retryLabel="Retry History Check"
            />
          ) : (
            <ApplicationHistory
              holds={myHolds}
              onSelectHold={(hold: StudentHold) => {
                setSelectedHold(hold);
                activeHoldRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}
        </section>
      )}
    </div>
  );
};
