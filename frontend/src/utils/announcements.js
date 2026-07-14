export const getPublisherLabel = (createdBy) => {
  const role = createdBy?.role;
  if (role === 'admin') return 'HR Administration';
  if (role === 'manager') return 'Management Team';
  return 'Company Notice';
};
