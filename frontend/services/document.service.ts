import api from './api';

type Document = {
  location: string;
};

export const createDocument = async ({ location }: Document) => {
  const response = await api.post('/document', {
    location,
  });

  return response.data;
};
