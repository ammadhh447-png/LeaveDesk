export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const LEAVE_TYPES = {
  ANNUAL: 'annual',
  SICK: 'sick',
  CASUAL: 'casual',
  WFH: 'work_from_home',
};

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INFO_REQUESTED: 'info_requested',
};

export const DEFAULT_LEAVE_BALANCES = {
  annual: 12,
  sick: 6,
  casual: 4,
  work_from_home: 10,
};
