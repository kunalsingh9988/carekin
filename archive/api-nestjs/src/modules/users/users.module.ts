import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { VerificationModule } from "../verification/verification.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [AuthModule, VerificationModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
