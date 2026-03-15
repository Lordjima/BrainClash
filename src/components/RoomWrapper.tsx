import React from 'react';
import { useParams } from 'react-router-dom';
import { RoomProvider } from '../context/RoomContext';

export const RoomWrapper = ({ children }: { children: React.ReactNode }) => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) return null;
  
  return <RoomProvider roomId={id}>{children}</RoomProvider>;
};
