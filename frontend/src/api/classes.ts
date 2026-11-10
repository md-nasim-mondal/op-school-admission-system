import { apiClient } from './client';
import { ClassDetails, ClassCreatedResponse, CreateClassInput } from '../types';

export const getClasses = async (): Promise<ClassDetails[]> => {
  const { data } = await apiClient.get<ClassDetails[]>('/classes');
  return data;
};

export const getClassById = async (classId: string): Promise<ClassDetails> => {
  const { data } = await apiClient.get<ClassDetails>(`/classes/${classId}`);
  return data;
};

export const createClass = async (input: CreateClassInput): Promise<ClassCreatedResponse> => {
  const { data } = await apiClient.post<ClassCreatedResponse>('/classes', input);
  return data;
};
