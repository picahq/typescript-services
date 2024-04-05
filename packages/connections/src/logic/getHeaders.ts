export const getHeaders = (secret: string) => {
  return {
    'X-Buildable-Secret': secret,
    'Content-Type': 'application/json',
  };
};
