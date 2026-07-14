export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatLeaveType = (type) => {
  const labels = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    casual: 'Casual Leave',
    work_from_home: 'Work From Home',
  };
  return labels[type] || type;
};

export const getStatusBadge = (status) => {
  const classes = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    info_requested: 'badge-info',
    active: 'badge-approved',
    inactive: 'badge-rejected',
  };
  return classes[status] || 'badge-pending';
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};

export const calculateDays = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
};
