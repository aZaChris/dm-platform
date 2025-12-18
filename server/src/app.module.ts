import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CharactersModule } from './characters/characters.module';
import { JournalModule } from './journal/journal.module';
import { MonstersModule } from './monsters/monsters.module';
import { RealtimeModule } from './realtime/realtime.module';
import { CombatModule } from './combat/combat.module';

@Module({
imports: [
ConfigModule.forRoot({ isGlobal: true }),
PrismaModule,
AuthModule,
CampaignsModule,
CharactersModule,
JournalModule,
    MonstersModule,
    RealtimeModule,
    CombatModule,
],
})
export class AppModule {}
