import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function sync() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  console.log('SYNC_COMPLETE');
  await app.close();
  process.exit(0);
}

sync();
