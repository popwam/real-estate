const { createNotificationTemplate: createTeam1NotificationTemplate } = require('./team1-templates');
const { createTeam2NotificationTemplate } = require('./team2-lead-reservation-templates');
const { createTeam2DealRoomNotificationTemplate } = require('./team2-deal-room-templates');
const {
  createTeam2DealCommissionNotificationTemplate,
} = require('./team2-deal-commission-templates');

function createNotificationTemplate(event) {
  return (
    createTeam1NotificationTemplate(event) ||
    createTeam2NotificationTemplate(event) ||
    createTeam2DealRoomNotificationTemplate(event) ||
    createTeam2DealCommissionNotificationTemplate(event)
  );
}

module.exports = {
  createNotificationTemplate,
};
