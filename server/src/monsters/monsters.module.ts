import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MonstersService } from './monsters.service';
import { MonstersController } from './monsters.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MonstersController],
  providers: [MonstersService],
})
export class MonstersModule {}


