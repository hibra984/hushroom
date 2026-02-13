import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createHmac, randomUUID } from 'crypto';

/* ────────────────────────────────────────────────────────────────────────────
 *  LiveKit JWT helpers
 *
 *  LiveKit access tokens are standard HS256 JWTs with specific claims.
 *  We build them manually so we do NOT depend on the livekit-server-sdk
 *  package at runtime.
 * ──────────────────────────────────────────────────────────────────────── */

function base64url(data: string | Buffer): string {
  return Buffer.from(data).toString('base64url');
}

function signLiveKitToken(
  apiKey: string,
  apiSecret: string,
  claims: Record<string, unknown>,
): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify(claims));
  const signature = createHmac('sha256', apiSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

/* ──────────────────────────────────────────────────────────────────────── */

@Injectable()
export class MediaService {
  private readonly livekitApiKey: string;
  private readonly livekitApiSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.livekitApiKey = this.config.getOrThrow<string>('LIVEKIT_API_KEY');
    this.livekitApiSecret = this.config.getOrThrow<string>('LIVEKIT_API_SECRET');
  }

  /* ── Room lifecycle ──────────────────────────────────────────────────── */

  /**
   * Create a LiveKit room name for a session and persist it.
   */
  async createRoom(sessionId: string): Promise<{ roomName: string }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.livekitRoomName) {
      throw new BadRequestException(
        `Session ${sessionId} already has a LiveKit room`,
      );
    }

    const roomName = `session-${sessionId}`;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { livekitRoomName: roomName },
    });

    return { roomName };
  }

  /**
   * Close (remove) the LiveKit room reference for a session.
   */
  async closeRoom(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (!session.livekitRoomName) {
      throw new BadRequestException(
        `Session ${sessionId} does not have a LiveKit room`,
      );
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { livekitRoomName: null },
    });
  }

  /* ── Token generation ────────────────────────────────────────────────── */

  /**
   * Generate a LiveKit access token for the given participant.
   */
  generateToken(
    roomName: string,
    participantIdentity: string,
    participantName: string,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const fourHours = 4 * 60 * 60;

    const claims: Record<string, unknown> = {
      iss: this.livekitApiKey,
      sub: participantIdentity,
      exp: now + fourHours,
      nbf: now,
      jti: randomUUID(),
      video: {
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      },
      metadata: JSON.stringify({ name: participantName }),
    };

    return signLiveKitToken(this.livekitApiKey, this.livekitApiSecret, claims);
  }

  /**
   * Look up the session, verify the caller is a participant, and return a
   * LiveKit token scoped to the session's room.
   */
  async getSessionToken(
    sessionId: string,
    userId: string,
  ): Promise<{ token: string; roomName: string }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { companion: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (!session.livekitRoomName) {
      throw new BadRequestException(
        `Session ${sessionId} does not have an active LiveKit room`,
      );
    }

    // Determine participant role
    const isOwner = session.userId === userId;
    const isCompanion = session.companion?.userId === userId;

    if (!isOwner && !isCompanion) {
      throw new ForbiddenException('You are not a participant of this session');
    }

    // Fetch user for display name
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, firstName: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const participantIdentity = isOwner
      ? `user-${userId}`
      : `companion-${userId}`;

    const participantName =
      user.displayName || user.firstName || participantIdentity;

    const token = this.generateToken(
      session.livekitRoomName,
      participantIdentity,
      participantName,
    );

    return { token, roomName: session.livekitRoomName };
  }
}
