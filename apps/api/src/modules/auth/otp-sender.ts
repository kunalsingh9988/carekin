export interface OtpSender {
  send(phone: string, otp: string): Promise<void>;
}

// Logs instead of sending — swap for an MSG91/Twilio-backed implementation
// once credentials from Section 12 of the build prompt are provisioned.
export class DevLogOtpSender implements OtpSender {
  async send(phone: string, otp: string): Promise<void> {
    console.log(`[dev-otp] phone=${phone} otp=${otp}`);
  }
}
