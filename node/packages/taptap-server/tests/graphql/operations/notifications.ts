export const HEALTH_QUERY = `
  query Health {
    health
  }
`;

export const SEND_NOTIFICATION_MUTATION = `
  mutation SendNotification($input: SendNotificationInput!) {
    sendNotification(input: $input) {
      success
      error
    }
  }
`;
