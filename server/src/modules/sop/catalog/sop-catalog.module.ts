import { Module } from '@nestjs/common';
import { SopCatalogService } from './sop-catalog.service';
import { SopWorkbenchModule } from './sop-workbench.module';

@Module({
  imports: [SopWorkbenchModule],
  providers: [SopCatalogService],
  exports: [SopCatalogService, SopWorkbenchModule],
})
export class SopCatalogModule {}
