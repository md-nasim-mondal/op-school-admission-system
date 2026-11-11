import React, { createContext, useContext, useState, useEffect } from 'react';

interface StudentContextType {
  studentId: string;
  setStudentId: (id: string) => void;
  isValidBRN: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const DEFAULT_DEMO_ID = '20152691234567890';

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studentId, setStudentIdState] = useState<string>(() => {
    return localStorage.getItem('student_id') || DEFAULT_DEMO_ID;
  });

  const isValidBRN = /^\d{17}$/.test(studentId.trim());

  const setStudentId = (newId: string) => {
    const sanitized = newId.replace(/\D/g, '');
    setStudentIdState(sanitized);
    localStorage.setItem('student_id', sanitized);
  };

  useEffect(() => {
    const stored = localStorage.getItem('student_id');
    if (!stored) {
      localStorage.setItem('student_id', studentId);
    }
  }, [studentId]);

  return (
    <StudentContext.Provider value={{ studentId, setStudentId, isValidBRN }}>
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
