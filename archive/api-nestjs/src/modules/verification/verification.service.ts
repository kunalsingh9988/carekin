import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createPendingRecord(providerId: string) {
    const record = await this.prisma.verificationRecord.create({
      data: { providerId, status: "PENDING" },
    });
    await this.prisma.verificationAuditLog.create({
      data: {
        verificationRecordId: record.id,
        fromStatus: null,
        toStatus: "PENDING",
        changedBy: "system",
        reason: "Provider onboarding submitted",
      },
    });
    return record;
  }

  // Vendor webhooks can only attach evidence (KYC ref, police verification
  // ref) — they can never flip status to APPROVED themselves. A human admin
  // must always countersign (Section 7 / Section 11 guardrail).
  async recordVendorResult(kycProviderRef: string, policeVerificationRef: string | undefined) {
    const record = await this.prisma.verificationRecord.findFirst({ where: { kycProviderRef } });
    if (!record) {
      throw new NotFoundException(`No verification record for kycProviderRef=${kycProviderRef}`);
    }
    return this.prisma.verificationRecord.update({
      where: { id: record.id },
      data: { policeVerificationRef },
    });
  }

  async review(verificationRecordId: string, adminId: string, status: "APPROVED" | "REJECTED", notes?: string) {
    const record = await this.prisma.verificationRecord.findUnique({ where: { id: verificationRecordId } });
    if (!record) throw new NotFoundException("Verification record not found");
    if (record.status !== "PENDING") {
      throw new BadRequestException(`Cannot review a record already in status ${record.status}`);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.verificationRecord.update({
        where: { id: verificationRecordId },
        data: { status, reviewedByAdminId: adminId, reviewedAt: new Date(), notes },
      }),
      this.prisma.verificationAuditLog.create({
        data: {
          verificationRecordId,
          fromStatus: record.status,
          toStatus: status,
          changedBy: adminId,
          reason: notes,
        },
      }),
    ]);
    return updated;
  }

  async isApproved(providerId: string): Promise<boolean> {
    const record = await this.prisma.verificationRecord.findUnique({ where: { providerId } });
    return record?.status === "APPROVED";
  }

  async getForProvider(providerId: string) {
    const record = await this.prisma.verificationRecord.findUnique({ where: { providerId } });
    if (!record) throw new NotFoundException("Verification record not found");
    return record;
  }

  // Backs the admin verification queue (Section 10 build order: the ops
  // dashboard's most important screen, per the master build prompt).
  async listPending() {
    return this.prisma.verificationRecord.findMany({
      where: { status: "PENDING" },
      include: {
        provider: { include: { user: { select: { phone: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
