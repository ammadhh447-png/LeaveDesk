import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { LeavePolicy } from '../models/LeavePolicy.js';
import { Holiday } from '../models/Holiday.js';
import { Announcement } from '../models/Announcement.js';
import { Session } from '../models/Session.js';
import { LEAVE_TYPES, DEFAULT_LEAVE_BALANCES } from '../config/constants.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee-leave-portal');
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      LeavePolicy.deleteMany(),
      Holiday.deleteMany(),
      Announcement.deleteMany(),
      Session.deleteMany(),
    ]);

    const departments = await Department.insertMany([
      { name: 'IT Department', description: 'Information Technology' },
      { name: 'Human Resources', description: 'HR and People Operations' },
      { name: 'Finance', description: 'Finance and Accounting' },
      { name: 'Marketing', description: 'Marketing and Communications' },
    ]);

    const itDept = departments[0];
    const hrDept = departments[1];

    const admin = await User.create({
      name: 'LeaveDesk Admin',
      email: 'leavedesk123@gmail.com',
      password: 'leavedesk123',
      role: 'admin',
      status: 'active',
      department: hrDept._id,
      phone: '+92 300 1234567',
    });

    const manager = await User.create({
      name: 'Manager Khan',
      email: 'manager@company.com',
      password: 'manager123',
      role: 'manager',
      status: 'active',
      department: itDept._id,
      phone: '+92 300 2345678',
    });

    await User.create({
      name: 'Ali Khan',
      email: 'ali@company.com',
      password: 'employee123',
      role: 'employee',
      status: 'active',
      department: itDept._id,
      phone: '+92 300 3456789',
      manager: manager._id,
      leaveBalances: DEFAULT_LEAVE_BALANCES,
    });

    await User.create({
      name: 'Ahmed Ali',
      email: 'ahmed@company.com',
      password: 'employee123',
      role: 'employee',
      status: 'active',
      department: itDept._id,
      phone: '+92 300 4567890',
      manager: manager._id,
      leaveBalances: DEFAULT_LEAVE_BALANCES,
    });

    await User.create({
      name: 'Sara Malik',
      email: 'sara@company.com',
      password: 'employee123',
      role: 'employee',
      status: 'pending',
      department: itDept._id,
      phone: '+92 300 5678901',
    });

    await LeavePolicy.insertMany([
      { leaveType: LEAVE_TYPES.ANNUAL, days: 20, description: 'Annual vacation leave' },
      { leaveType: LEAVE_TYPES.SICK, days: 10, description: 'Sick leave with medical certificate' },
      { leaveType: LEAVE_TYPES.CASUAL, days: 5, description: 'Casual leave for personal matters' },
      { leaveType: LEAVE_TYPES.WFH, days: 10, description: 'Work from home days' },
    ]);

    const currentYear = new Date().getFullYear();
    await Holiday.insertMany([
      { name: 'Pakistan Day', date: new Date(currentYear, 2, 23), description: 'National holiday' },
      { name: 'Independence Day', date: new Date(currentYear, 7, 14), description: 'National holiday' },
      { name: 'Eid ul Fitr', date: new Date(currentYear, 3, 10), description: 'Islamic festival' },
      { name: 'Eid ul Adha', date: new Date(currentYear, 5, 17), description: 'Islamic festival' },
    ]);

    await Announcement.create({
      title: 'Welcome to Leave Portal',
      message: 'Please ensure all leave requests are submitted at least 3 days in advance.',
      createdBy: admin._id,
    });

    console.log('\nSeed data created successfully.\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
