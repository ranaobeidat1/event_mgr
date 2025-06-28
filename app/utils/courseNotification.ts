// app/utils/courseNotification.ts
import {
  getUserIdsRegisteredToCourse,
  getExpoTokensFromUserIds,
} from './firestoreUtils';
import { sendPushNotifications } from './notificationService';

/**
 * Sends a push only to students of one course.
 */
export const notifyCourse = async (
  courseId: string,
  title: string,
  body: string
) => {
  const userIds = await getUserIdsRegisteredToCourse(courseId);
  const tokens  = await getExpoTokensFromUserIds(userIds);

  if (!tokens.length) {
    console.log('No tokens found for course', courseId);
    return;
  }
  await sendPushNotifications(tokens, title, body);
  console.log(`Sent course-specific push to ${tokens.length} devices`);
};
