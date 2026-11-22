import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.budgetbook_session as string | undefined;

    if (!token) throw new UnauthorizedException('Authentication required');

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { roles: { include: { role: true } } },
        },
      },
    });

    if (!session?.user || session.user.deletedAt || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    request.user = session.user;
    request.sessionId = session.id;
    return true;
  }
}
