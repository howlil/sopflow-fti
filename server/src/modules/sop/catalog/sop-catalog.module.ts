import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { SopCatalogController } from './sop-catalog.controller';
import { SopCatalogService } from './sop-catalog.service';
import { SopLegacyVersionCompatibilityModule } from './sop-legacy-version-compatibility.module';
import { SopWorkbenchModule } from './sop-workbench.module';

@Module({
  imports: [
    AuthModule,
    SopLegacyVersionCompatibilityModule,
    SopWorkbenchModule,
  ],
  controllers: [SopCatalogController],
  providers: [SopCatalogService],
  exports: [SopCatalogService, SopWorkbenchModule],
})
export class SopCatalogModule {}
