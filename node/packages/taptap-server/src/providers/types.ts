export type NotificationRecipient = {
  id: string;
  email: string;
  name: string;
};

export type NotificationPayload = {
  type: string;
  recipient: NotificationRecipient;
  data: Record<string, unknown>;
};

export type SendResult = {
  success: boolean;
  error?: string;
  throttled?: boolean;
};

export type NotificationProvider = {
  send(payload: NotificationPayload): Promise<SendResult>;
};
