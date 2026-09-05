import { Module } from '@nestjs/common';
import { OpdModule } from '../../core/opd/opd.module';
import { SopWorkbenchModule } from './sop-workbench.module';
import { SopLegacyAccessPolicy } from './sop-legacy-access.policy';
import { SopLegacyVersionCompatibilityService } from './sop-legacy-version-compatibility.service';

/**
 * Explicit legacy versioning boundary. Native Process modules may import this
 * only to preserve the unbound compatibility path; it does not expose catalog
 * controllers or the broad SopCatalogService.
 */
@Module({
  imports: [OpdModule, SopWorkbenchModule],
  providers: [SopLegacyAccessPolicy, SopLegacyVersionCompatibilityService],
  exports: [SopLegacyAccessPolicy, SopLegacyVersionCompatibilityService],
})
export class SopLegacyVersionCompatibilityModule {}
