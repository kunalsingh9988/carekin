import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@carekin/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { OtpService } from "./otp.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
  ) {}

  async requestOtp(phone: string): Promise<void> {
    await this.otp.requestOtp(phone);
  }

  async verifyOtp(phone: string, code: string, role: UserRole) {
    const ok = this.otp.verifyOtp(phone, code);
    if (!ok) throw new UnauthorizedException("Incorrect OTP");

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, role },
    });

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { token, user };
  }
}
