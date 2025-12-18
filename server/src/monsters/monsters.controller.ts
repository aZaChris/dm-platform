import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MonstersService } from './monsters.service';

@UseGuards(AuthGuard('jwt'))
@Controller('monsters')
export class MonstersController {
  constructor(private readonly monsters: MonstersService) {}

  // GET /monsters?scope=user | scope=campaign&campaignId=...
  @Get()
  async list(@Req() req: any, @Query('scope') scope?: 'user' | 'campaign', @Query('campaignId') campaignId?: string) {
    return this.monsters.list(req.user.userId, { scope, campaignId });
  }

  @Post()
  async create(
    @Req() req: any,
    @Body() body: { name: string; dataJson?: unknown; campaignId?: string }
  ) {
    return this.monsters.create(req.user.userId, body);
  }

  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.monsters.getById(req.user.userId, id);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; dataJson?: unknown }
  ) {
    return this.monsters.update(req.user.userId, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.monsters.remove(req.user.userId, id);
  }
}


