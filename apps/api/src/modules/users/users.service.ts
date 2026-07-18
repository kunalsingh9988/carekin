import { Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma";
import { FamilyProfileInput, ProviderProfileInput } from "@carekin/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { VerificationService } from "../verification/verification.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
  ) {}

  async createFamilyProfile(userId: string, input: FamilyProfileInput) {
    const profile = await this.prisma.familyProfile.create({
      data: {
        userId,
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });
    await this.setLocation("family_profiles", profile.id, input.latitude, input.longitude);
    return profile;
  }

  async createProviderProfile(userId: string, input: ProviderProfileInput) {
    const profile = await this.prisma.providerProfile.create({
      data: {
        userId,
        type: input.type,
        bio: input.bio,
        serviceRadiusKm: input.serviceRadiusKm,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });
    await this.setLocation("provider_profiles", profile.id, input.latitude, input.longitude);
    // Every provider starts PENDING and invisible until an admin approves
    // them (Section 7) — this is the only path that creates a provider row.
    await this.verification.createPendingRecord(profile.id);
    return profile;
  }

  // Prisma can't write its own Unsupported("geography") columns, so the
  // PostGIS point is populated with a raw statement right after insert.
  private async setLocation(table: "family_profiles" | "provider_profiles", id: string, lat: number, lng: number) {
    await this.prisma.$executeRaw(
      Prisma.sql`UPDATE ${Prisma.raw(table)} SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography WHERE id = ${id}`,
    );
  }
}
