import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CharactersService } from './characters.service';

@UseGuards(AuthGuard('jwt'))
@Controller('characters')
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

  // GET /characters?campaignId=...
  @Get()
  async list(@Req() req: any, @Query('campaignId') campaignId: string) {
    return this.characters.list(req.user.userId, campaignId);
  }

  @Post()
  async create(
    @Req() req: any,
    @Body() body: { campaignId: string; name: string; dataJson?: unknown }
  ) {
    return this.characters.create(req.user.userId, body.campaignId, body.name, body.dataJson ?? {});
  }

  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.characters.getById(req.user.userId, id);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; dataJson?: unknown }
  ) {
    return this.characters.update(req.user.userId, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.characters.remove(req.user.userId, id);
  }
}
