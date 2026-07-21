export interface SmsProvider {
  send(phoneNumber: string, message: string): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  async send(phoneNumber: string, message: string): Promise<void> {
    console.log(`[MockSMS] to=${phoneNumber} :: ${message}`);
  }
}

// Current decision: reminders/updates go through in-app Notification rows only,
// not SMS (see sendCustomerNotification / reminders.ts — both create a
// Notification unconditionally regardless of which provider this returns).
export class NoopSmsProvider implements SmsProvider {
  async send(): Promise<void> {
    // Intentionally no-op — SMS sending is disabled.
  }
}

// Phase 4 will add real providers (e.g. 019sms/InforU/Twilio). Until then,
// set SMS_PROVIDER="mock" to log outgoing messages instead of just recording
// the in-app Notification; leave unset (default) to send nothing.
export function getSmsProvider(): SmsProvider {
  return process.env.SMS_PROVIDER === "mock" ? new MockSmsProvider() : new NoopSmsProvider();
}
