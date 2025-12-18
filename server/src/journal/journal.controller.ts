import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JournalService } from './journal.service';

@UseGuards(AuthGuard('jwt'))
@Controller('journal')
export class JournalController {
  constructor(private readonly journal: JournalService) {}

  @Get()
  async list(@Req() req: any, @Query('campaignId') campaignId: string) {
    return this.journal.list(req.user.userId, campaignId);
  }

  @Post()
  async create(
    @Req() req: any,
    @Body() body: { campaignId: string; title: string; content: string; tags?: string[]; attachments?: unknown }
  ) {
    return this.journal.create(req.user.userId, body);
  }

  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.journal.getById(req.user.userId, id);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; tags?: string[]; attachments?: unknown }
  ) {
    return this.journal.update(req.user.userId, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.journal.remove(req.user.userId, id);
  }
}
