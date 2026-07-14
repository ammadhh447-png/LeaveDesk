import { Holiday } from '../models/Holiday.js';
import { User } from '../models/User.js';
import { createBulkNotifications } from './notification.service.js';

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatHolidayDate = (date) => new Date(date).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
});

export const sendHolidayReminders = async () => {
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const holidays = await Holiday.find({
    date: { $gte: tomorrow, $lt: dayAfterTomorrow },
    $or: [{ reminderSentAt: { $exists: false } }, { reminderSentAt: null }],
  }).select('_id name date description');

  if (!holidays.length) return 0;

  const users = await User.find({ status: 'active' }).select('_id');
  if (!users.length) return 0;

  let sent = 0;

  for (const holiday of holidays) {
    const dateLabel = formatHolidayDate(holiday.date);
    const notifications = users.map((user) => ({
      user: user._id,
      title: 'Tomorrow is Off',
      message: `${holiday.name} is tomorrow (${dateLabel}). The office will remain closed.`,
      type: 'holiday',
      relatedId: holiday._id,
    }));

    await createBulkNotifications(notifications);
    holiday.reminderSentAt = new Date();
    await holiday.save();
    sent += 1;
  }

  return sent;
};
