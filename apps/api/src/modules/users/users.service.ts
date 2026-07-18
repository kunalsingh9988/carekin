import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma";
import { CareRecipientInput, FamilyProfileInput, ProviderProfileInput } from "@carekin/shared-types";
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

  async createCareRecipient(userId: string, input: CareRecipientInput) {
    const family = await this.prisma.familyProfile.findUnique({ where: { userId } });
    if (!family) throw new NotFoundException("Create a family profile first");
    return this.prisma.careRecipient.create({
      data: {
        familyId: family.id,
        type: input.type,
        name: input.name,
        notes: input.notes,
      },
    });
  }

  async getMyProviderProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { verificationRecord: true },
    });
    if (!profile) throw new NotFoundException("No provider profile yet");
    return profile;
  }

  async listCareRecipients(userId: string) {
    const family = await this.prisma.familyProfile.findUnique({ where: { userId } });
    if (!family) throw new NotFoundException("Create a family profile first");
    return this.prisma.careRecipient.findMany({ where: { familyId: family.id } });
  }

  // Prisma can't write its own Unsupported("geography") columns, so the
  // PostGIS point is populated with a raw statement right after insert.
  private async setLocation(table: "family_profiles" | "provider_profiles", id: string, lat: number, lng: number) {
    await this.prisma.$executeRaw(
      Prisma.sql`UPDATE ${Prisma.raw(table)} SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography WHERE id = ${id}`,
    );
  }
}
