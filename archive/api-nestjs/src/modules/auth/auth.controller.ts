import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RequestOtpInput, VerifyOtpInput } from "@carekin/shared-types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Rate limited specifically to blunt OTP abuse (Section 9).
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("otp/request")
  @UsePipes(new ZodValidationPipe(RequestOtpInput))
  async requestOtp(@Body() body: RequestOtpInput) {
    await this.auth.requestOtp(body.phone);
    return { ok: true };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("otp/verify")
  @UsePipes(new ZodValidationPipe(VerifyOtpInput))
  async verifyOtp(@Body() body: VerifyOtpInput) {
    return this.auth.verifyOtp(body.phone, body.otp, body.role);
  }
}
