import {
  Controller,
  DefaultValuePipe,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { filter, interval, map, merge, Observable } from 'rxjs';
import { type ApiSuccessResponse, JwtAuthGuard } from '../../../common';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  type JwtAccessPayload,
} from '../../core/auth/helpers/auth.shared';
import {
  ProcessNotificationService,
  type ProcessInAppNotification,
} from './process-notification.service';
import { NotificationEventsService } from '../shared/notification-events.service';

@ApiTags('Notifications')
@Controller('notifications/process')
@UseGuards(JwtAuthGuard)
export class ProcessNotificationController {
  constructor(
    private readonly service: ProcessNotificationService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  @Get()
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Daftar notifikasi Process milik sesi saat ini' })
  @ApiResponse({ status: 200 })
  async findMine(
    @Req() req: Request & { user: JwtAccessPayload },
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiSuccessResponse<ProcessInAppNotification[]>> {
    return {
      message: 'Daftar notifikasi Process berhasil diambil',
      success: true,
      data: await this.service.findMine(req.user.sub, limit),
    };
  }

  @Get('summary')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Ringkasan unread notification Process sesi saat ini' })
  async summary(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<{ unreadCount: number }>> {
    return {
      message: 'Ringkasan notifikasi Process berhasil diambil',
      success: true,
      data: await this.service.getSummary(req.user.sub),
    };
  }

  @Sse('stream')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Stream perubahan notifikasi Process via Server-Sent Events' })
  stream(@Req() req: Request & { user: JwtAccessPayload }): Observable<MessageEvent> {
    const penggunaId = req.user.sub;
    const changed$ = this.notificationEvents.events$.pipe(
      filter((event) => event.penggunaId === null || event.penggunaId === penggunaId),
      map((event) => ({
        type: event.type === 'heartbeat' ? 'notifications.heartbeat' : 'notifications.changed',
        data: event,
      })),
    );
    const heartbeat$ = interval(30_000).pipe(
      map(() => ({
        type: 'notifications.heartbeat',
        data: { penggunaId, type: 'heartbeat' as const, at: new Date().toISOString() },
      })),
    );
    return merge(changed$, heartbeat$);
  }

  @Post('items/:processNotificationId/read')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tandai satu notifikasi Process sebagai dibaca' })
  async markRead(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('processNotificationId', ParseUUIDPipe) processNotificationId: string,
  ): Promise<ApiSuccessResponse<{ unreadCount: number }>> {
    return {
      message: 'Notifikasi Process berhasil ditandai dibaca',
      success: true,
      data: await this.service.markRead(req.user.sub, processNotificationId),
    };
  }

  @Post('read-all')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tandai semua notifikasi Process sebagai dibaca' })
  async markAllRead(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<{ unreadCount: number; updated: number }>> {
    return {
      message: 'Semua notifikasi Process berhasil ditandai dibaca',
      success: true,
      data: await this.service.markAllRead(req.user.sub),
    };
  }
}
