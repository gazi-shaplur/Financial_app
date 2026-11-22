import { BadRequestException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto, RegisterDto } from './dto.js';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const [userRole, adminRole, superRole] = await Promise.all([
      this.prisma.role.upsert({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER', description: 'Regular user' },
      }),
      this.prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Application administrator' },
      }),
      this.prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {},
        create: { name: 'SUPER_ADMIN', description: 'Full platform administrator' },
      }),
    ]);
    const permissionKeys = [
      'users.view','users.manage','roles.manage','categories.manage','settings.manage',
      'announcements.manage','audit.view','finance.view','finance.manage',
    ];
    const permissions = await Promise.all(permissionKeys.map((key) =>
      this.prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, description: `Permission for ${key}` },
      }),
    ));
    await Promise.all(permissions.map((permission) =>
      this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permission.id },
      }),
    ));
    await Promise.all(permissions.map((permission) =>
      this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: superRole.id, permissionId: permission.id },
      }),
    ));
    await Promise.all([
      this.prisma.applicationSetting.upsert({
        where: { key: 'application_name' },
        update: {},
        create: { key: 'application_name', value: 'BudgetBook', isPublic: true, description: 'Application name' },
      }),
      this.prisma.applicationSetting.upsert({
        where: { key: 'maintenance_mode' },
        update: {},
        create: { key: 'maintenance_mode', value: false, isPublic: false, description: 'Block regular users during maintenance' },
      }),
      this.prisma.applicationSetting.upsert({
        where: { key: 'registration_available' },
        update: {},
        create: { key: 'registration_available', value: true, isPublic: true, description: 'Allow new user registration' },
      }),
    ]);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return {
      ...safe,
      roles: safe.roles?.map((entry: any) => entry.role.name) ?? [],
    };
  }

  googleAuthorizationUrl(state: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) throw new BadRequestException('Google sign-in is not configured');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.config.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3001/api/auth/google/callback';
    const client = new OAuth2Client(clientId, clientSecret, callbackUrl);
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
    });
  }

  async googleLogin(code: string, ipAddress?: string, userAgent?: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new BadRequestException('Google sign-in is not configured');
    const callbackUrl = this.config.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3001/api/auth/google/callback';
    const client = new OAuth2Client(clientId, clientSecret, callbackUrl);
    const exchanged = await client.getToken(code).catch(() => {
      throw new UnauthorizedException('Google authorization failed');
    });
    const idToken = exchanged.tokens.id_token;
    if (!idToken) throw new UnauthorizedException('Google did not return an identity token');
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    }).catch(() => {
      throw new UnauthorizedException('Google identity could not be verified');
    });
    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Google identity payload is missing');
    const email = payload?.email?.trim().toLowerCase();
    if (!email || payload.email_verified !== true) {
      throw new UnauthorizedException('A verified Google email is required');
    }

    const registrationSetting = await this.prisma.applicationSetting.findUnique({
      where: { key: 'registration_available' },
    });
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      if (registrationSetting?.value === false || registrationSetting?.value === 'false') {
        throw new BadRequestException('New account registration is temporarily unavailable');
      }
      const role = await this.prisma.role.upsert({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER', description: 'Regular user' },
      });
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      user = await this.prisma.user.create({
        data: {
          name: payload.name?.trim() || email.split('@')[0],
          email,
          passwordHash,
          avatarUrl: payload.picture,
          emailVerifiedAt: new Date(),
          roles: { create: { roleId: role.id } },
        },
        include: { roles: { include: { role: true } } },
      });
      await this.prisma.auditLog.create({
        data: { actorId: user.id, action: 'REGISTER_GOOGLE', entityType: 'USER', entityId: user.id },
      });
    }
    if (user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('This account is not active');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), emailVerifiedAt: user.emailVerifiedAt ?? new Date(), avatarUrl: user.avatarUrl ?? payload.picture },
    });
    await this.prisma.auditLog.create({
      data: { actorId: user.id, action: 'LOGIN_GOOGLE', entityType: 'SESSION', ipAddress },
    });
    return { token, expiresAt, user: this.sanitizeUser(user) };
  }

  async register(dto: RegisterDto) {
    const registrationSetting = await this.prisma.applicationSetting.findUnique({
      where: { key: 'registration_available' },
    });
    if (registrationSetting?.value === false || registrationSetting?.value === 'false') {
      throw new BadRequestException('New account registration is temporarily unavailable');
    }
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('An account with this email already exists');

    const role = await this.prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER', description: 'Regular user' },
    });
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        roles: { create: { roleId: role.id } },
      },
      include: { roles: { include: { role: true } } },
    });

    await this.prisma.auditLog.create({
      data: { actorId: user.id, action: 'REGISTER', entityType: 'USER', entityId: user.id },
    });

    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const roleNames = user.roles.map((entry) => entry.role.name);
    await this.prisma.auditLog.create({
      data: { actorId: user.id, action: roleNames.includes('SUPER_ADMIN') || roleNames.includes('ADMIN') ? 'ADMIN_LOGIN' : 'LOGIN', entityType: 'SESSION', ipAddress },
    });

    return { token, expiresAt, user: this.sanitizeUser(user) };
  }

  async logout(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (user) {
      await this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      const token = randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      if (this.config.get('NODE_ENV') !== 'production') return { message: 'If the account exists, a reset link has been sent.', resetToken: token };
    }
    return { message: 'If the account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashToken(token);
    const reset = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!reset) throw new BadRequestException('Reset token is invalid or expired');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await bcrypt.hash(password, 12) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  me(user: any) {
    return this.sanitizeUser(user);
  }
}
