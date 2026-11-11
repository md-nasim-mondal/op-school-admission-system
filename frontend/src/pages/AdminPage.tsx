import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses, createClass } from '../api/classes';
import { CreateClassInput } from '../types';
import { useToast } from '../context/ToastContext';
import { AdminDashboard } from '../components/AdminDashboard';
import { CreateClassModal } from '../components/CreateClassModal';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Query: Classes
  const {
    data: classes = [],
    isFetching: isFetchingClasses,
    refetch: refetchClasses,
  } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
    refetchInterval: 5000,
  });

  // Mutation: Create Class
  const createClassMutation = useMutation({
    mutationFn: (input: CreateClassInput) => createClass(input),
    onSuccess: (data) => {
      addToast(
        'success',
        `Class "${data.name}" with ${data.totalSeats} seats has been created.`,
        'Class Created'
      );
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      addToast('error', err.message, 'Failed to Create Class');
    },
  });

  return (
    <>
      <AdminDashboard
        classes={classes}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onRefresh={() => refetchClasses()}
        isRefreshing={isFetchingClasses}
      />

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (input) => {
          await createClassMutation.mutateAsync(input);
        }}
      />
    </>
  );
};
