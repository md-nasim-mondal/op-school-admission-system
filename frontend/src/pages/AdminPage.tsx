import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses, createClass } from '../api/classes';
import { ClassCreatedResponse, ClassDetails, CreateClassInput } from '../types';
import { useToast } from '../context/ToastContext';
import { AdminDashboard } from '../components/AdminDashboard';
import { CreateClassModal } from '../components/CreateClassModal';
import { getErrorMessage } from '../utils/errors';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'Admin Portal | School Admission System';
  }, []);

  // Query: Classes
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

  // Mutation: Create Class
  const createClassMutation = useMutation<ClassCreatedResponse, Error, CreateClassInput>({
    mutationFn: (input: CreateClassInput) => createClass(input),
    onSuccess: (data: ClassCreatedResponse) => {
      addToast(
        'success',
        `Class "${data.name}" with ${data.totalSeats} seats has been created.`,
        'Class Created'
      );
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: Error) => {
      addToast('error', getErrorMessage(err, 'Unable to create class.'), 'Failed to Create Class');
    },
  });

  return (
    <>
      <AdminDashboard
        classes={classes}
        isLoading={isLoadingClasses}
        isError={isErrorClasses}
        errorMessage={classesError instanceof Error ? classesError.message : undefined}
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
