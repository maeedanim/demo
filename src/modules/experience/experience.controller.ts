import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { Authenticated } from '@/decorators/auth.decorator';
import { CurrentUser } from '@/decorators/current-user.decorator';

@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Authenticated()
  @Post()
  create(
    @Body() createExperienceDto: CreateExperienceDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.experienceService.create(createExperienceDto, userId);
  }

  @Get('user/:userId')
  findAll(@Param('userId') userId: string) {
    return this.experienceService.findAll(userId);
  }

  @Get(':experienceId')
  findOne(@Param('experienceId') experienceId: string) {
    return this.experienceService.findOne(experienceId);
  }

  @Authenticated()
  @Patch(':experienceId')
  update(
    @CurrentUser('userId') userId: string,
    @Param('experienceId') experienceId: string,
    @Body() updateExperienceDto: UpdateExperienceDto,
  ) {
    return this.experienceService.update(
      experienceId,
      updateExperienceDto,
      userId,
    );
  }

  @Authenticated()
  @Delete(':experienceId')
  remove(
    @Param('experienceId') experienceId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.experienceService.remove(experienceId, userId);
  }
}
