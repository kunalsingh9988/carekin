import { Body, Controller, Get, Param, Post, Req, UseGuards, UsePipes } from "@nestjs/common";
import { ReviewVerificationInput, VerificationWebhookPayload } from "@carekin/shared-types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard, AuthedRequest } from "../auth/jwt-auth.guard";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { VerificationService } from "./verification.service";

@Controller("verification")
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get("queue/pending")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  listPending() {
    return this.verification.listPending();
  }

  @Get(":providerId")
  @UseGuards(JwtAuthGuard)
  getStatus(@Param("providerId") providerId: string) {
    return this.verification.getForProvider(providerId);
  }

  // TODO(Section 12): verify the KYC vendor's webhook signature once a vendor
  // (IDfy/AuthBridge/Karza) is provisioned — this endpoint is unauthenticated
  // in the interim and must not be exposed beyond sandbox testing.
  @Post("webhook")
  @UsePipes(new ZodValidationPipe(VerificationWebhookPayload))
  async webhook(@Body() body: VerificationWebhookPayload) {
    await this.verification.recordVendorResult(body.kycProviderRef, body.policeVerificationRef);
    return { ok: true };
  }

  @Post(":id/review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @UsePipes(new ZodValidationPipe(ReviewVerificationInput))
  review(@Param("id") id: string, @Body() body: ReviewVerificationInput, @Req() req: AuthedRequest) {
    return this.verification.review(id, req.user.sub, body.status, body.notes);
  }
}
