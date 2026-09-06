import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from './prisma/prisma.module';
import { CsrfProtectionService } from './security/csrf-protection.service';
import { SecurityRateLimiterService } from './security/security-rate-limiter.service';

/** Guard dan service lintas fitur. JWT dipasang eksplisit pada controller target. */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [
    JwtAuthGuard,
    PlatformAdminGuard,
    CsrfProtectionService,
    HealthService,
    SecurityRateLimiterService,
  ],
  exports: [
    JwtAuthGuard,
    PlatformAdminGuard,
    CsrfProtectionService,
    SecurityRateLimiterService,
  ],
})
export class CommonModule {}
