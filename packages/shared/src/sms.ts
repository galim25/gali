export interface SmsProvider {
  send(phoneNumber: string, message: string): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  async send(phoneNumber: string, message: string): Promise<void> {
    // Password-reset OTPs flow through this same message text — never log a
    // live, guessable-in-window credential by default. Set
    // SMS_MOCK_REVEAL_CODE="true" locally when you actually need to read an
    // OTP off the console to test the reset flow by hand.
    const logged =
      process.env.SMS_MOCK_REVEAL_CODE === "true" ? message : message.replace(/\d{4,}/g, "[REDACTED]");
    console.log(`[MockSMS] to=${phoneNumber} :: ${logged}`);
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
// the in-app Notification; leave unset (default) to send nothing. See
// MockSmsProvider — OTP codes are redacted from the logged line unless
// SMS_MOCK_REVEAL_CODE="true" is also set.
export function getSmsProvider(): SmsProvider {
  return process.env.SMS_PROVIDER === "mock" ? new MockSmsProvider() : new NoopSmsProvider();
}
