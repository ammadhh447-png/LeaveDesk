export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const errorResponse = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, message });
};

export const calculateLeaveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const toObjectIdOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'object' && value?._id) {
    return toObjectIdOrNull(String(value._id));
  }

  if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) return value;
  return null;
};

export const resolveObjectId = (value) => {
  const id = toObjectIdOrNull(value);
  return id ? String(id) : null;
};

export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
