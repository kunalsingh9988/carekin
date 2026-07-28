import { Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma";
import { SearchProvidersInput } from "@carekin/shared-types";
import { PrismaService } from "../../prisma/prisma.service";

export interface ProviderSearchRow {
  id: string;
  type: string;
  bio: string | null;
  distanceKm: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  // Enforced here at the query layer, not the UI (Section 7, non-negotiable):
  // the JOIN to verification_records requires status = 'APPROVED', so a
  // pending/rejected provider can never appear in results under any caller.
  async searchProviders(input: SearchProvidersInput): Promise<ProviderSearchRow[]> {
    const radiusMeters = input.radiusKm * 1000;
    return this.prisma.$queryRaw<ProviderSearchRow[]>(
      Prisma.sql`
        SELECT
          p.id,
          p.type,
          p.bio,
          ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
          ) / 1000 AS "distanceKm"
        FROM provider_profiles p
        INNER JOIN verification_records v ON v."providerId" = p.id AND v.status = 'APPROVED'
        WHERE p.type = ${input.serviceType}
          AND ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
            ${radiusMeters}
          )
        ORDER BY "distanceKm" ASC
      `,
    );
  }
}
