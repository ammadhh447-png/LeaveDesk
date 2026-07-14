import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { successResponse } from '../utils/helpers.js';
import { ROLES } from '../config/constants.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildYearRange = (year) => {
  const targetYear = parseInt(year, 10) || new Date().getFullYear();
  const start = new Date(targetYear, 0, 1);
  const now = new Date();
  const end = targetYear === now.getFullYear()
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    : new Date(targetYear + 1, 0, 1);

  return {
    year: targetYear,
    start,
    end,
    isYearToDate: targetYear === now.getFullYear(),
  };
};

const buildMonthlyTrend = (monthlyRaw) => MONTH_LABELS.map((month, index) => {
  const monthNum = index + 1;
  const monthStats = monthlyRaw.filter((s) => s._id.month === monthNum);
  const getCount = (status) => monthStats.find((s) => s._id.status === status)?.count || 0;

  return {
    month,
    approved: getCount('approved'),
    pending: getCount('pending'),
    rejected: getCount('rejected'),
    infoRequested: getCount('info_requested'),
    totalDays: monthStats.reduce((sum, s) => sum + (s.days || 0), 0),
  };
});

export const getMonthlyLeaves = async (req, res) => {
  const { month, year } = req.query;
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const leaves = await LeaveRequest.find({
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate('employee', 'name email department')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });

  successResponse(res, { leaves, month: targetMonth, year: targetYear });
};

export const getDepartmentLeaves = async (req, res) => {
  const { departmentId } = req.params;

  const employees = await User.find({ department: departmentId, role: ROLES.EMPLOYEE }).select('_id');
  const employeeIds = employees.map((e) => e._id);

  const leaves = await LeaveRequest.find({ employee: { $in: employeeIds } })
    .populate('employee', 'name email')
    .sort({ createdAt: -1 });

  const department = await Department.findById(departmentId);

  successResponse(res, { leaves, department });
};

export const getEmployeeHistory = async (req, res) => {
  const leaves = await LeaveRequest.find({ employee: req.params.employeeId })
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });

  const employee = await User.findById(req.params.employeeId).select('name email department leaveBalances');

  successResponse(res, { leaves, employee });
};

export const getAnalytics = async (req, res) => {
  const { year: yearStart, start, end, isYearToDate } = buildYearRange(req.query.year);
  const yearFilter = { createdAt: { $gte: start, $lt: end } };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    totalEmployees,
    totalManagers,
    totalDepartments,
    statusStats,
    leaveTypeStats,
    monthlyRaw,
    departmentStats,
    totalDaysResult,
    onLeaveToday,
    totalLeaves,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.EMPLOYEE, status: 'active' }),
    User.countDocuments({ role: ROLES.MANAGER, status: 'active' }),
    Department.countDocuments(),
    LeaveRequest.aggregate([
      { $match: yearFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, days: { $sum: '$days' } } },
    ]),
    LeaveRequest.aggregate([
      { $match: yearFilter },
      { $group: { _id: '$leaveType', count: { $sum: 1 }, days: { $sum: '$days' } } },
      { $sort: { count: -1 } },
    ]),
    LeaveRequest.aggregate([
      { $match: yearFilter },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, status: '$status' },
          count: { $sum: 1 },
          days: { $sum: '$days' },
        },
      },
    ]),
    LeaveRequest.aggregate([
      { $match: yearFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData',
        },
      },
      { $unwind: '$employeeData' },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeeData.department',
          foreignField: '_id',
          as: 'dept',
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$dept.name',
          requests: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          days: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$days', 0] } },
        },
      },
      { $sort: { requests: -1 } },
      { $limit: 10 },
    ]),
    LeaveRequest.aggregate([
      { $match: { ...yearFilter, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$days' } } },
    ]),
    LeaveRequest.countDocuments({
      status: 'approved',
      startDate: { $lte: todayEnd },
      endDate: { $gte: today },
    }),
    LeaveRequest.countDocuments(yearFilter),
  ]);

  const statusMap = Object.fromEntries(statusStats.map((s) => [s._id, s]));
  const approvedCount = statusMap.approved?.count || 0;
  const pendingCount = statusMap.pending?.count || 0;
  const rejectedCount = statusMap.rejected?.count || 0;
  const infoRequestedCount = statusMap.info_requested?.count || 0;

  successResponse(res, {
    year: yearStart,
    isYearToDate,
    summary: {
      totalEmployees,
      totalManagers,
      totalDepartments,
      totalLeaves,
      approvedLeaves: approvedCount,
      pendingLeaves: pendingCount,
      rejectedLeaves: rejectedCount,
      infoRequestedLeaves: infoRequestedCount,
      totalDaysTaken: totalDaysResult[0]?.total || 0,
      onLeaveToday,
      approvalRate: totalLeaves ? Math.round((approvedCount / totalLeaves) * 100) : 0,
      avgDaysPerApproved: approvedCount
        ? Math.round(((statusMap.approved?.days || 0) / approvedCount) * 10) / 10
        : 0,
    },
    statusStats: statusStats.map((s) => ({ status: s._id, count: s.count, days: s.days })),
    leaveTypeStats: leaveTypeStats.map((s) => ({ type: s._id, count: s.count, days: s.days })),
    monthlyTrend: buildMonthlyTrend(monthlyRaw),
    departmentStats: departmentStats.map((s) => ({
      name: s._id || 'Unassigned',
      requests: s.requests,
      approved: s.approved,
      days: s.days,
    })),
  });
};

export const exportReport = async (req, res) => {
  const { type } = req.query;

  let data = [];
  if (type === 'annual' || type === 'monthly') {
    data = await getAnnualLeavesData(req.query);
  } else if (type === 'department') {
    const result = await getAllDepartmentLeaves(req.query);
    data = result;
  } else {
    data = await LeaveRequest.find()
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
  }

  const format = req.query.format || 'json';

  if (format === 'csv') {
    const { year } = buildYearRange(req.query.year);
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=leave-report-${year}.csv`,
    );
    return res.send(csv);
  }

  successResponse(res, { data });
};

async function getAnnualLeavesData(query) {
  const { start, end } = buildYearRange(query.year);

  return LeaveRequest.find({ createdAt: { $gte: start, $lt: end } })
    .populate({
      path: 'employee',
      select: 'name email department',
      populate: { path: 'department', select: 'name' },
    })
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
}

async function getAllDepartmentLeaves(query = {}) {
  const { year } = query;
  const filter = {};

  if (year) {
    const { start, end } = buildYearRange(year);
    filter.createdAt = { $gte: start, $lt: end };
  }

  return LeaveRequest.find(filter)
    .populate({ path: 'employee', select: 'name email department', populate: { path: 'department', select: 'name' } })
    .sort({ createdAt: -1 });
}

const escapeCsv = (value) => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

function convertToCSV(data) {
  if (!data.length) return '';

  const headers = [
    'Employee',
    'Email',
    'Department',
    'Leave Type',
    'Start Date',
    'End Date',
    'Days',
    'Status',
    'Submitted',
    'Reason',
  ];
  const rows = data.map((item) => [
    item.employee?.name || '',
    item.employee?.email || '',
    item.employee?.department?.name || '',
    item.leaveType,
    new Date(item.startDate).toLocaleDateString('en-GB'),
    new Date(item.endDate).toLocaleDateString('en-GB'),
    item.days,
    item.status,
    new Date(item.createdAt).toLocaleDateString('en-GB'),
    item.reason || '',
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export const getAdminDashboard = async (req, res) => {
  const [totalEmployees, totalManagers, pendingEmployees, pendingLeaves, totalDepartments, recentLeaves, recentPending] = await Promise.all([
    User.countDocuments({ role: ROLES.EMPLOYEE, status: 'active' }),
    User.countDocuments({ role: ROLES.MANAGER, status: 'active' }),
    User.countDocuments({ status: 'pending' }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    Department.countDocuments(),
    LeaveRequest.find()
      .populate('employee', 'name')
      .sort({ createdAt: -1 })
      .limit(3),
    User.find({ status: 'pending' })
      .select('name email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(3),
  ]);

  successResponse(res, {
    stats: { totalEmployees, totalManagers, pendingEmployees, pendingLeaves, totalDepartments },
    recentLeaves,
    recentPending,
  });
};
