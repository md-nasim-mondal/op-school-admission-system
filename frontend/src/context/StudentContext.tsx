import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface StudentContextType {
  studentId: string;
  isValidBRN: boolean;
  isIdentified: boolean;
  setStudentId: (id: string) => void;
  clearStudent: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Initialize strictly from localStorage; start empty for fresh visitors (no hardcoded identity)
  const [studentId, setStudentIdState] = useState<string>(() => {
    return localStorage.getItem('student_id') || '';
  });

  const isValidBRN = /^\d{17}$/.test(studentId.trim());
  const isIdentified = isValidBRN && studentId.length === 17;

  // Real-time input updater preserving leading zeros and stripping non-digits
  const setStudentId = useCallback((newId: string) => {
    const sanitized = newId.replace(/\D/g, '').slice(0, 17);
    setStudentIdState(sanitized);
    if (/^\d{17}$/.test(sanitized)) {
      localStorage.setItem('student_id', sanitized);
    } else {
      localStorage.removeItem('student_id');
    }
  }, []);

  // Dedicated student switching / reset: clears storage, input, and TanStack query cache
  const clearStudent = useCallback(() => {
    localStorage.removeItem('student_id');
    setStudentIdState('');
    queryClient.clear();
  }, [queryClient]);

  // Sync state with localStorage when 17-digit ID is valid
  useEffect(() => {
    if (studentId && isValidBRN) {
      localStorage.setItem('student_id', studentId);
    }
  }, [studentId, isValidBRN]);

  return (
    <StudentContext.Provider
      value={{
        studentId,
        isValidBRN,
        isIdentified,
        setStudentId,
        clearStudent,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
