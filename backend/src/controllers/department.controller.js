import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { successResponse, getPagination, buildPaginationMeta, resolveObjectId } from '../utils/helpers.js';
import { ROLES } from '../config/constants.js';

const enrichWithCounts = async (departments) => {
  const deptIds = departments.map((d) => d._id);

  const [employeeCounts, managerGroups] = await Promise.all([
    User.aggregate([
      { $match: { department: { $in: deptIds }, role: ROLES.EMPLOYEE } },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        },
      },
    ]),
    User.aggregate([
      {
        $match: {
          department: { $in: deptIds },
          role: ROLES.EMPLOYEE,
          manager: { $ne: null },
        },
      },
      { $group: { _id: { dept: '$department', manager: '$manager' } } },
      {
        $group: {
          _id: '$_id.dept',
          managerIds: { $addToSet: '$_id.manager' },
        },
      },
    ]),
  ]);

  const employeeMap = Object.fromEntries(
    employeeCounts.map((c) => [c._id.toString(), { total: c.total, active: c.active }]),
  );

  const allManagerIds = [...new Set(
    managerGroups.flatMap((g) => g.managerIds.map((id) => resolveObjectId(id)).filter(Boolean)),
  )];
  const managerUsers = await User.find({
    _id: { $in: allManagerIds },
    role: ROLES.MANAGER,
    status: 'active',
  }).select('name');

  const managerNameMap = Object.fromEntries(managerUsers.map((m) => [m._id.toString(), m.name]));

  const managerMap = Object.fromEntries(
    managerGroups.map((g) => {
      const managers = g.managerIds
        .map((id) => ({ _id: id, name: managerNameMap[id.toString()] }))
        .filter((m) => m.name);
      return [g._id.toString(), managers];
    }),
  );

  return departments.map((d) => {
    const stats = employeeMap[d._id.toString()] || { total: 0, active: 0 };
    const managers = managerMap[d._id.toString()] || [];

    return {
      ...d.toObject(),
      employeeCount: stats.total,
      activeEmployeeCount: stats.active,
      managerCount: managers.length,
      managers,
    };
  });
};

const buildSummary = async (filter = {}) => {
  const deptIds = await Department.find(filter).distinct('_id');

  const [totalDepartments, employeeStats, managerIds] = await Promise.all([
    Department.countDocuments(filter),
    User.aggregate([
      { $match: { department: { $in: deptIds }, role: ROLES.EMPLOYEE } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        },
      },
    ]),
    User.distinct('manager', {
      department: { $in: deptIds },
      role: ROLES.EMPLOYEE,
      manager: { $ne: null },
    }),
  ]);

  const activeManagers = await User.countDocuments({
    _id: { $in: managerIds },
    role: ROLES.MANAGER,
    status: 'active',
  });

  const employees = employeeStats[0] || { total: 0, active: 0 };

  return {
    totalDepartments,
    totalEmployees: employees.total,
    activeEmployees: employees.active,
    assignedManagers: activeManagers,
  };
};

export const getDepartments = async (req, res) => {
  const { search, all } = req.query;
  const filter = {};

  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (all === 'true') {
    const departments = await Department.find(filter).sort({ name: 1 });
    const [enriched, summary] = await Promise.all([
      enrichWithCounts(departments),
      buildSummary(filter),
    ]);
    return successResponse(res, { departments: enriched, summary });
  }

  const { page, limit, skip } = getPagination(req.query);

  const [departments, total, summary] = await Promise.all([
    Department.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Department.countDocuments(filter),
    buildSummary(filter),
  ]);

  const enriched = await enrichWithCounts(departments);

  successResponse(res, {
    departments: enriched,
    pagination: buildPaginationMeta(total, page, limit),
    summary,
  });
};
export const createDepartment = async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new AppError('Department name is required.');

  const existing = await Department.findOne({ name });
  if (existing) throw new AppError('Department already exists.');

  const department = await Department.create({ name, description });
  successResponse(res, { department }, 'Department created.', 201);
};

export const updateDepartment = async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!department) throw new AppError('Department not found.', 404);
  successResponse(res, { department }, 'Department updated.');
};

export const deleteDepartment = async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) throw new AppError('Department not found.', 404);
  successResponse(res, null, 'Department deleted.');
};
