import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BackgroundWorkerService } from './background_worker.service';
import { CreateBackgroundWorkerDto } from './dto/create-background_worker.dto';
import { UpdateBackgroundWorkerDto } from './dto/update-background_worker.dto';

@Controller('background-worker')
export class BackgroundWorkerController {
  constructor(private readonly backgroundWorkerService: BackgroundWorkerService) {}

  @Post()
  create(@Body() createBackgroundWorkerDto: CreateBackgroundWorkerDto) {
    return this.backgroundWorkerService.create(createBackgroundWorkerDto);
  }

  @Get()
  findAll() {
    return this.backgroundWorkerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.backgroundWorkerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBackgroundWorkerDto: UpdateBackgroundWorkerDto) {
    return this.backgroundWorkerService.update(+id, updateBackgroundWorkerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.backgroundWorkerService.remove(+id);
  }
}
