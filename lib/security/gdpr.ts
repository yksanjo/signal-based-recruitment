import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';
import { decrypt } from './encryption';

/**
 * GDPR/CCPA Compliance Utilities
 * Handles data deletion, access requests, and consent management
 */

/**
 * Delete all personal data for a user/candidate (Right to be Forgotten)
 */
export async function deletePersonalData(identifier: {
  email?: string;
  candidateId?: string;
  userId?: string;
}): Promise<{ success: boolean; deletedRecords: number }> {
  let deletedRecords = 0;

  try {
    // Delete candidate profile and related data
    if (identifier.candidateId) {
      const candidate = await prisma.candidateProfile.findUnique({
        where: { id: identifier.candidateId },
        include: { applications: true },
      });

      if (candidate) {
        // Delete applications
        await prisma.application.deleteMany({
          where: { candidateId: identifier.candidateId },
        });
        deletedRecords += candidate.applications.length;

        // Delete candidate profile
        await prisma.candidateProfile.delete({
          where: { id: identifier.candidateId },
        });
        deletedRecords++;
      }
    }

    // Delete by email
    if (identifier.email) {
      const candidates = await prisma.candidateProfile.findMany({
        where: { email: identifier.email },
        include: { applications: true },
      });

      for (const candidate of candidates) {
        await prisma.application.deleteMany({
          where: { candidateId: candidate.id },
        });
        deletedRecords += candidate.applications.length;

        await prisma.candidateProfile.delete({
          where: { id: candidate.id },
        });
        deletedRecords++;
      }
    }

    logger.info('Personal data deleted', { identifier, deletedRecords });

    return { success: true, deletedRecords };
  } catch (error: any) {
    logger.error('Failed to delete personal data', { error: error.message, identifier });
    throw error;
  }
}

/**
 * Export all personal data for a user (Right to Access)
 */
export async function exportPersonalData(identifier: {
  email?: string;
  candidateId?: string;
}): Promise<any> {
  const data: any = {};

  try {
    if (identifier.candidateId) {
      const candidate = await prisma.candidateProfile.findUnique({
        where: { id: identifier.candidateId },
        include: {
          applications: {
            include: {
              jobPosting: {
                include: {
                  integration: true,
                  signal: true,
                },
              },
            },
          },
        },
      });

      if (candidate) {
        data.candidate = {
          name: candidate.name,
          title: candidate.title,
          company: candidate.company,
          location: candidate.location,
          email: candidate.email,
          skills: candidate.skills,
          createdAt: candidate.createdAt,
        };

        data.applications = candidate.applications.map((app) => ({
          id: app.id,
          status: app.status,
          appliedAt: app.appliedAt,
          jobTitle: app.jobPosting?.signal?.title,
          company: app.jobPosting?.signal?.companyName,
          source: app.source,
        }));
      }
    }

    if (identifier.email) {
      const candidates = await prisma.candidateProfile.findMany({
        where: { email: identifier.email },
        include: {
          applications: {
            include: {
              jobPosting: {
                include: {
                  signal: true,
                },
              },
            },
          },
        },
      });

      data.candidates = candidates.map((candidate) => ({
        name: candidate.name,
        title: candidate.title,
        company: candidate.company,
        location: candidate.location,
        email: candidate.email,
        skills: candidate.skills,
        applications: candidate.applications.map((app) => ({
          status: app.status,
          appliedAt: app.appliedAt,
          jobTitle: app.jobPosting?.signal?.title,
        })),
      }));
    }

    logger.info('Personal data exported', { identifier });

    return data;
  } catch (error: any) {
    logger.error('Failed to export personal data', { error: error.message, identifier });
    throw error;
  }
}

/**
 * Anonymize personal data (for data retention compliance)
 */
export async function anonymizePersonalData(
  candidateId: string,
  retentionDays: number = 365
): Promise<void> {
  try {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) return;

    // Check if data is older than retention period
    const ageInDays = (Date.now() - candidate.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < retentionDays) {
      return; // Data is still within retention period
    }

    // Anonymize candidate data
    await prisma.candidateProfile.update({
      where: { id: candidateId },
      data: {
        name: '[ANONYMIZED]',
        email: null,
        linkedInUrl: null,
        company: null,
        location: null,
      },
    });

    logger.info('Personal data anonymized', { candidateId });
  } catch (error: any) {
    logger.error('Failed to anonymize personal data', {
      error: error.message,
      candidateId,
    });
    throw error;
  }
}

/**
 * Audit log for data access (for compliance tracking)
 */
export async function logDataAccess(
  action: 'view' | 'export' | 'delete' | 'update',
  resourceType: 'candidate' | 'application' | 'integration',
  resourceId: string,
  userId?: string
): Promise<void> {
  try {
    // Store audit log (you might want to create an AuditLog model)
    logger.info('Data access logged', {
      action,
      resourceType,
      resourceId,
      userId,
      timestamp: new Date(),
    });

    // In production, store in a dedicated audit log table
  } catch (error: any) {
    logger.error('Failed to log data access', { error: error.message });
  }
}

