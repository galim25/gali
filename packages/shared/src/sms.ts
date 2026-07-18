export interface SmsProvider {
  send(phoneNumber: string, message: string): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  async send(phoneNumber: string, message: string): Promise<void> {
    console.log(`[MockSMS] to=${phoneNumber} :: ${message}`);
  }
}

// Phase 4 will add real providers (e.g. 019sms/InforU/Twilio) and select
// between them based on process.env.SMS_PROVIDER. Mock is the only
// implementation for now.
export function getSmsProvider(): SmsProvider {
  return new MockSmsProvider();
}
