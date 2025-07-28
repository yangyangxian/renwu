import { db } from '../database/databaseAccess';
import { invitations, projectMembers } from '../database/schema';
import { eq } from 'drizzle-orm';
import { InvitationStatus, ProjectRole, ErrorCodes } from '@fullstack/common';
import { CustomError } from '../classes/CustomError';
import crypto from 'crypto';

export class InvitationService {
  /**
   * Insert a new invitation for a user to join a project. Generates token and expiration internally.
   * Returns the generated token.
   */
  async insertInvitation({ email, inviterId, projectId, role, status }: {
    email: string;
    inviterId: string;
    projectId?: string;
    role?: ProjectRole;
    status?: InvitationStatus;
  }): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(invitations).values({
      email,
      inviterId,
      projectId,
      role,
      token,
      status: status ?? InvitationStatus.PENDING,
      expiresAt,
    });
    return token;
  }
  async getInvitationByToken(token: string) {
    const now = new Date();
    const result = await db.select().from(invitations)
      .where(eq(invitations.token, token));
    if (!result.length) return null;
    const invitation = result[0];
    if (invitation.expiresAt && invitation.expiresAt < now) {
      return null;
    }
    return invitation;
  }

  async acceptInvitation(invitationId: string, email: string, userId: string) {
    // Fetch invitation
    const result = await db.select().from(invitations).where(eq(invitations.id, invitationId));
    if (!result.length) throw new CustomError('Invitation not found', ErrorCodes.NOT_FOUND);
    const invitation = result[0];
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new CustomError('Invitation already used or invalid', ErrorCodes.INVALID_INPUT);
    }
    if (invitation.email !== email) {
      throw new CustomError('Email does not match invitation', ErrorCodes.INVALID_INPUT);
    }
    // Update status
    await db.update(invitations)
      .set({ status: InvitationStatus.ACCEPTED, acceptedAt: new Date() })
      .where(eq(invitations.id, invitationId));
    return invitation;
  }
}

export const invitationService = new InvitationService();
