import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EmpresasModule } from './empresas/empresas.module.js';
import { TercerosModule } from './terceros/terceros.module.js';
import { PucModule } from './puc/puc.module.js';
import { AsientosModule } from './asientos/asientos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', '100.120.112.79'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'propiedad_horizontal_dev'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME', 'pacyolo_dev'),
        autoLoadEntities: true,
        synchronize: true, // Sincroniza automáticamente entidades en desarrollo
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    EmpresasModule,
    TercerosModule,
    PucModule,
    AsientosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
