import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const DEMO_STUDENT_A = '20152691234567890';
export const DEMO_STUDENT_B = '20152699876543210';

interface StudentContextType {
  studentId: string;
  isValidBRN: boolean;
  isIdentified: boolean;
  identifyStudent: (id: string) => void;
  clearStudent: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const [studentId, setStudentIdState] = useState<string>(() => {
    return localStorage.getItem('student_id') || '';
  });

  const isValidBRN = /^\d{17}$/.test(studentId.trim());
  const isIdentified = isValidBRN && studentId.length === 17;

  const identifyStudent = useCallback((newId: string) => {
    const sanitized = newId.replace(/\D/g, '').slice(0, 17);
    setStudentIdState(sanitized);
    if (/^\d{17}$/.test(sanitized)) {
      localStorage.setItem('student_id', sanitized);
    }
  }, []);

  const clearStudent = useCallback(() => {
    localStorage.removeItem('student_id');
    setStudentIdState('');
    // Clear all cached queries so previous student data does not leak
    queryClient.clear();
  }, [queryClient]);

  // Keep localStorage synchronized when valid ID is present
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
        identifyStudent,
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
