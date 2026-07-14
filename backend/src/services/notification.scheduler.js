import { sendHolidayReminders } from './holidayReminder.service.js';

const HOUR_MS = 60 * 60 * 1000;

export const startNotificationScheduler = () => {
  const run = async () => {
    try {
      const count = await sendHolidayReminders();
      if (count > 0) {
        console.log(`Holiday reminders sent for ${count} holiday(s).`);
      }
    } catch (err) {
      console.error('Holiday reminder job failed:', err.message);
    }
  };

  run();
  setInterval(run, HOUR_MS);
};
