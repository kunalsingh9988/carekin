import { Body, Controller, Post, Req, UseGuards, UsePipes } from "@nestjs/common";
import { FamilyProfileInput, ProviderProfileInput } from "@carekin/shared-types";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard, AuthedRequest } from "../auth/jwt-auth.guard";
import { Roles, RolesGuard } from "../auth/roles.guard";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post("family-profile")
  @Roles("FAMILY")
  @UsePipes(new ZodValidationPipe(FamilyProfileInput))
  createFamilyProfile(@Body() body: FamilyProfileInput, @Req() req: AuthedRequest) {
    return this.users.createFamilyProfile(req.user.sub, body);
  }

  @Post("provider-profile")
  @Roles("PROVIDER")
  @UsePipes(new ZodValidationPipe(ProviderProfileInput))
  createProviderProfile(@Body() body: ProviderProfileInput, @Req() req: AuthedRequest) {
    return this.users.createProviderProfile(req.user.sub, body);
  }
}
