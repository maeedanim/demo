import { Module } from '@nestjs/common';
import { UserSkillService } from './user_skill.service';
import { UserSkillController } from './user_skill.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSkill, UserSkillSchema } from './entities/user_skill.entity';
import { Skill, SkillSchema } from './entities/skill.entity';
import { ExperienceModule } from '@/modules/experience/experience.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSkill.name, schema: UserSkillSchema },
      { name: Skill.name, schema: SkillSchema },
    ]),
    ExperienceModule,
  ],
  controllers: [UserSkillController],
  providers: [UserSkillService],
})
export class UserSkillModule {}
