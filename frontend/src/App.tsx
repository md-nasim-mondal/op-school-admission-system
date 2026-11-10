import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { ClassList } from './components/ClassList';
import { ActiveHoldCard } from './components/ActiveHoldCard';
import { ApplicationHistory } from './components/ApplicationHistory';
import { AdminDashboard } from './components/AdminDashboard';
import { CreateClassModal } from './components/CreateClassModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { getClasses, createClass } from './api/classes';
import { getMyHolds, createHold, confirmHold, cancelHold } from './api/holds';
import { StudentHold, CreateClassInput } from './types';
import { Info, UserCheck } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApplication />
    </QueryClientProvider>
  );
}

function MainApplication() {
  const queryClient = useQueryClient();

  // Student ID state with localStorage persistence
  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('student_id') || '20152691234567890';
  });

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedHold, setSelectedHold] = useState<StudentHold | null>(null);

  const isValidBRN = /^\d{17}$/.test(studentId.trim());

  // Save studentId to localStorage
  const handleStudentIdChange = (newId: string) => {
    setStudentId(newId);
    localStorage.setItem('student_id', newId);
  };

  const addToast = (type: 'success' | 'error' | 'warning', message: string, title?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
        `A seat has been reserved for you! You have 10 minutes to pay the fee and confirm.`,
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

  // Mutation: Create Class (Admin)
  const createClassMutation = useMutation({
    mutationFn: (input: CreateClassInput) => createClass(input),
    onSuccess: (data) => {
      addToast(
        'success',
        `Class "${data.name}" with ${data.totalSeats} seats has been created.`,
        'Class Created'
      );
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (err: any) => {
      addToast('error', err.message, 'Failed to Create Class');
    },
  });

  const handleExpire = () => {
    // When countdown hits 0, trigger refresh
    queryClient.invalidateQueries({ queryKey: ['classes'] });
    queryClient.invalidateQueries({ queryKey: ['myHolds', studentId] });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Navigation Header */}
      <Navbar
        studentId={studentId}
        onStudentIdChange={handleStudentIdChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Student View */}
        {activeTab === 'student' && (
          <div className="space-y-8">
            
            {/* Identity Status Banner if invalid */}
            {!isValidBRN && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong className="font-semibold block">Please enter a valid 17-digit Birth Registration Number</strong>
                  <span>
                    To apply for admission or view your application history, provide your 17-digit student identity in the header above (or click <strong>Use Demo ID</strong>).
                  </span>
                </div>
              </div>
            )}

            {/* Active Hold Card (if present) */}
            {isValidBRN && currentDisplayHold && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    My Admission Status
                  </h2>
                  {selectedHold && (
                    <button
                      type="button"
                      onClick={() => setSelectedHold(null)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Show Latest Application
                    </button>
                  )}
                </div>
                <ActiveHoldCard
                  hold={currentDisplayHold}
                  onConfirm={async (id) => { await confirmMutation.mutateAsync(id); }}
                  onCancel={async (id) => { await cancelMutation.mutateAsync(id); }}
                  onExpire={handleExpire}
                />
              </section>
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
        )}

        {/* Admin View */}
        {activeTab === 'admin' && (
          <AdminDashboard
            classes={classes}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onRefresh={() => refetchClasses()}
            isRefreshing={isFetchingClasses}
          />
        )}

      </main>

      {/* Admin Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (input) => { await createClassMutation.mutateAsync(input); }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto text-center text-xs text-slate-400">
        <p>School Admission System &bull; Assistant Software Engineer Recruitment &bull; Onnorokom Projukti Limited</p>
      </footer>
    </div>
  );
}
