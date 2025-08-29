import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CharactersModule } from './characters/characters.module';
import { JournalModule } from './journal/journal.module';

@Module({
  imports: [AuthModule, CampaignsModule, CharactersModule, JournalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
