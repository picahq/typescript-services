export const errorToResponseObject = (error: any) => {
  return { message: error.message, ...error };
};
