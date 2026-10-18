import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaLog } from './entities/auditoria-log.entity.js';
import { AuditoriaService } from './auditoria.service.js';
import { AuditoriaController } from './auditoria.controller.js';
import { AuditInterceptor } from './interceptors/audit.interceptor.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaLog])],
  controllers: [AuditoriaController],
  providers: [
    AuditoriaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
