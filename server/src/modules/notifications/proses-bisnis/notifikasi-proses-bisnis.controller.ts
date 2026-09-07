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
  NotifikasiProsesBisnisService,
  type ProsesBisnisInAppNotification,
} from './notifikasi-proses-bisnis.service';
import { NotificationEventsService } from '../shared/notification-events.service';

@ApiTags('Notifications')
@Controller('notifications/proses-bisnis')
@UseGuards(JwtAuthGuard)
export class NotifikasiProsesBisnisController {
  constructor(
    private readonly service: NotifikasiProsesBisnisService,
    private readonly notificationEvents: NotificationEventsService,
  ) {}

  @Get()
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Daftar notifikasi Proses Bisnis milik sesi saat ini' })
  @ApiResponse({ status: 200 })
  async findMine(
    @Req() req: Request & { user: JwtAccessPayload },
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ApiSuccessResponse<ProsesBisnisInAppNotification[]>> {
    return {
      message: 'Daftar notifikasi Proses Bisnis berhasil diambil',
      success: true,
      data: await this.service.findMine(req.user.sub, limit),
    };
  }

  @Get('summary')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Ringkasan unread notification Proses Bisnis sesi saat ini' })
  async summary(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<{ unreadCount: number }>> {
    return {
      message: 'Ringkasan notifikasi Proses Bisnis berhasil diambil',
      success: true,
      data: await this.service.getSummary(req.user.sub),
    };
  }

  @Sse('stream')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Stream perubahan notifikasi Proses Bisnis via Server-Sent Events' })
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

  @Post('items/:notifikasiProsesBisnisId/read')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tandai satu notifikasi Proses Bisnis sebagai dibaca' })
  async markRead(
    @Req() req: Request & { user: JwtAccessPayload },
    @Param('notifikasiProsesBisnisId', ParseUUIDPipe) notifikasiProsesBisnisId: string,
  ): Promise<ApiSuccessResponse<{ unreadCount: number }>> {
    return {
      message: 'Notifikasi Proses Bisnis berhasil ditandai dibaca',
      success: true,
      data: await this.service.markRead(req.user.sub, notifikasiProsesBisnisId),
    };
  }

  @Post('read-all')
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
  @ApiOperation({ summary: 'Tandai semua notifikasi Proses Bisnis sebagai dibaca' })
  async markAllRead(
    @Req() req: Request & { user: JwtAccessPayload },
  ): Promise<ApiSuccessResponse<{ unreadCount: number; updated: number }>> {
    return {
      message: 'Semua notifikasi Proses Bisnis berhasil ditandai dibaca',
      success: true,
      data: await this.service.markAllRead(req.user.sub),
    };
  }
}
