import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserSkillService } from './user_skill.service';
import {
  CreateNewUserSkillDto,
  CreateUserSkillDto,
} from './dto/create-user_skill.dto';
import { Authenticated } from '@/decorators/auth.decorator';
import { CurrentUser } from '@/decorators/current-user.decorator';

@Controller('user-skill')
export class UserSkillController {
  constructor(private readonly userSkillService: UserSkillService) {}

  @Authenticated()
  @Post('new')
  createNewUserSkill(
    @Body() createNewUserSkillDto: CreateNewUserSkillDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.userSkillService.createNewUserSkill(
      createNewUserSkillDto,
      userId,
    );
  }

  @Authenticated()
  @Post()
  addSkillToUser(
    @Body() createUserSkillDto: CreateUserSkillDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.userSkillService.addSkillToUser(createUserSkillDto, userId);
  }

  @Get('skilled/:skillId')
  findSkilledUsers(@Param('skillId') skillId: string) {
    return this.userSkillService.findSkilledUsers(skillId);
  }

  @Get('user/:userId')
  findAll(@Param('userId') userId: string) {
    return this.userSkillService.findAll(userId);
  }

  @Get()
  findSkillList() {
    return this.userSkillService.findSkillList();
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.userSkillService.remove(+id);
  // }
}
