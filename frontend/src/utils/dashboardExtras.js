import { holidayAPI, notificationAPI } from '../api';
import { PAGE_SIZE } from '../constants/pagination';

export async function fetchDashboardExtras() {
  const [announcementsRes, holidaysRes] = await Promise.all([
    notificationAPI.getAnnouncements({ limit: PAGE_SIZE }),
    holidayAPI.getAll({ upcoming: 'true', all: 'true' }),
  ]);

  const announcements = announcementsRes.data?.data?.announcements
    ?? announcementsRes.data?.data
    ?? [];

  const holidays = holidaysRes.data?.data?.holidays
    ?? holidaysRes.data?.data
    ?? [];

  return {
    announcements,
    upcomingHolidays: holidays.slice(0, 3),
  };
}
