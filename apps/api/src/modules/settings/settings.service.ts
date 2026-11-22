import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async userSettings(userId: string) {
    const items = await this.prisma.userSetting.findMany({ where: { userId } });
    return Object.fromEntries(items.map((item) => [item.key, item.value]));
  }

  async updateUserSettings(userId: string, settings: Record<string, unknown>) {
    await Promise.all(Object.entries(settings).map(([key, value]) =>
      this.prisma.userSetting.upsert({
        where: { userId_key: { userId, key } },
        update: { value: value as any },
        create: { userId, key, value: value as any },
      }),
    ));
    return this.userSettings(userId);
  }

  applicationSettings() {
    return this.prisma.applicationSetting.findMany({ where: { isPublic: true } });
  }

  activeAnnouncements() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: { deletedAt: null, isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      orderBy: { createdAt: 'desc' },
    });
  }
}
