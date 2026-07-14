import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS, DEFAULT_LEAVE_BALANCES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function () {
        return this.role === ROLES.EMPLOYEE;
      },
    },
    designation: { type: String, trim: true },
    phone: {
      type: String,
      required: function () {
        return this.role === ROLES.EMPLOYEE;
      },
      trim: true,
    },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    profilePicture: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    leaveBalances: {
      annual: { type: Number, default: DEFAULT_LEAVE_BALANCES.annual },
      sick: { type: Number, default: DEFAULT_LEAVE_BALANCES.sick },
      casual: { type: Number, default: DEFAULT_LEAVE_BALANCES.casual },
      work_from_home: { type: Number, default: DEFAULT_LEAVE_BALANCES.work_from_home },
    },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', userSchema);
