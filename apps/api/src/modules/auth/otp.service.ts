import { Injectable, UnauthorizedException } from "@nestjs/common";
import { DevLogOtpSender, OtpSender } from "./otp-sender";

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// In-memory store — fine for a single dev instance, not for production
// (multi-instance deploys need this in Redis). Swap the backing store
// before Phase 1 ships to real users.
@Injectable()
export class OtpService {
  private readonly store = new Map<string, OtpEntry>();
  private readonly sender: OtpSender = new DevLogOtpSender();

  async requestOtp(phone: string): Promise<void> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.store.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    await this.sender.send(phone, code);
  }

  verifyOtp(phone: string, code: string): boolean {
    const entry = this.store.get(phone);
    if (!entry) throw new UnauthorizedException("No OTP requested for this number");
    if (Date.now() > entry.expiresAt) {
      this.store.delete(phone);
      throw new UnauthorizedException("OTP expired");
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      this.store.delete(phone);
      throw new UnauthorizedException("Too many attempts, request a new OTP");
    }
    entry.attempts += 1;
    if (entry.code !== code) return false;
    this.store.delete(phone);
    return true;
  }
}
