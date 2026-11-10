import { apiClient } from './client';
import { HoldResponse, HoldStatusResponse, ConfirmHoldResponse, StudentHold } from '../types';

export const createHold = async (classId: string, studentId: string): Promise<HoldResponse> => {
  const { data } = await apiClient.post<HoldResponse>(
    `/classes/${classId}/holds`,
    {},
    { headers: { 'X-Student-Id': studentId } }
  );
  return data;
};

export const getHoldById = async (holdId: string): Promise<HoldStatusResponse> => {
  const { data } = await apiClient.get<HoldStatusResponse>(`/holds/${holdId}`);
  return data;
};

export const confirmHold = async (holdId: string, studentId: string): Promise<ConfirmHoldResponse> => {
  const { data } = await apiClient.post<ConfirmHoldResponse>(
    `/holds/${holdId}/confirm`,
    {},
    { headers: { 'X-Student-Id': studentId } }
  );
  return data;
};

export const cancelHold = async (holdId: string, studentId: string): Promise<void> => {
  await apiClient.delete(`/holds/${holdId}`, {
    headers: { 'X-Student-Id': studentId },
  });
};

export const getMyHolds = async (studentId: string): Promise<StudentHold[]> => {
  const { data } = await apiClient.get<StudentHold[]>('/me/holds', {
    headers: { 'X-Student-Id': studentId },
  });
  return data;
};
