import { Injectable, Logger } from '@nestjs/common';
import {
  CreateNewUserSkillDto,
  CreateUserSkillDto,
} from './dto/create-user_skill.dto';
import { UpdateUserSkillDto } from './dto/update-user_skill.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserSkill, UserSkillDocument } from './entities/user_skill.entity';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ExperienceService } from '@/modules/experience/experience.service';
import { isErrorResponse } from '@/utils/type-guards';

@Injectable()
export class UserSkillService {
  constructor(
    @InjectModel(UserSkill.name)
    private readonly userSkillModel: Model<UserSkillDocument>,
    @InjectModel(Skill.name)
    private readonly skillModel: Model<SkillDocument>,
    private readonly experienceService: ExperienceService,
  ) {}
  private readonly logger = new Logger(UserSkillService.name);

  // trying a more optimized solution to a case where we need to create a skill and add it to a userskill
  // async createSkill(createSkillDto: CreateSkillDto) {
  //   this.logger.log('Creating skill:', createSkillDto);
  //   try {
  //     const newSkill = await this.skillModel.create(createSkillDto);
  //     this.logger.debug('New skill created:', newSkill);
  //     return {
  //       message: 'Skill created successfully',
  //       status: 201,
  //       skill: newSkill,
  //     };
  //   } catch (error) {
  //     this.logger.error('Error creating skill:', error);
  //     throw new Error('Error creating skill');
  //   }
  // }

  async createNewUserSkill(
    createNewUserSkillDto: CreateNewUserSkillDto,
    userId: string,
  ) {
    this.logger.log('Creating new user skill:', createNewUserSkillDto);
    this.logger.log('User ID:', userId);
    try {
      const newUserSkill = await this.skillModel.create({
        name: createNewUserSkillDto.skillname.trim(),
      });
      this.logger.debug('New user skill data:', newUserSkill);
      const var1 = {
        user: userId,
        skill: newUserSkill._id,
        // experience: createNewUserSkillDto.experience,
      };

      const newUserSkillEntry = await this.userSkillModel.create(var1);
      this.logger.debug('New user skill entry data:', newUserSkillEntry);
      return {
        message: 'User skill added successfully',
        status: 201,
        userSkill: newUserSkillEntry,
      };
    } catch (error) {
      this.logger.error('Error creating user skill:', error);
      throw new Error('Error creating user skill');
    }
  }

  async addSkillToUser(createUserSkillDto: CreateUserSkillDto, userId: string) {
    this.logger.log('Adding skill to user:', createUserSkillDto);
    this.logger.log('User ID:', userId);
    try {
      const existingSkill = await this.skillModel.findOne({
        _id: createUserSkillDto.skill,
      });
      if (!existingSkill) {
        this.logger.error('Skill not found');
        return {
          message: 'Skill not found',
          statusCode: 404,
        };
      }
      //check if user already has the skill
      const existingUserSkill = await this.userSkillModel.findOne({
        user: userId,
        skill: existingSkill._id,
      });
      if (existingUserSkill) {
        this.logger.error('User already has this skill');
        return {
          message: 'User already has this skill',
          status: 400,
        };
      }
      if (createUserSkillDto.experience) {
        const existingExpereince = await this.experienceService.findOne(
          createUserSkillDto.experience,
        );
        if (isErrorResponse(existingExpereince)) {
          this.logger.error('Experience not found:', existingExpereince);
          return existingExpereince;
        }
        this.logger.debug('Experience found:', existingExpereince);
      }
      const newUserSkillEntry = await this.userSkillModel.create({
        user: userId,
        skill: existingSkill._id,
        experience: createUserSkillDto.experience,
      });
      this.logger.debug('New user skill entry data:', newUserSkillEntry);
      return {
        message: 'User skill added successfully',
        status: 201,
        userSkill: newUserSkillEntry,
      };
    } catch (error) {
      this.logger.error('Error adding skill to user:', error);
      throw new Error('Error adding skill to user');
    }
  }

  // find all user skills for a user
  async findAll(userId: string) {
    this.logger.log('Finding all user skills for user:', userId);
    try {
      const userSkills = await this.userSkillModel
        .find({
          user: userId,
        })
        .populate('skill');
      this.logger.debug('User skills found:', userSkills);
      return {
        message: 'User skills retrieved successfully',
        status: 200,
        userSkills,
      };
    } catch (error) {
      this.logger.error('Error finding user skills:', error);
      throw new Error('Error finding user skills');
    }
  }

  async findSkillList() {
    this.logger.log('Finding all skills');
    try {
      const skills = await this.skillModel.find();
      this.logger.debug('Skills found:', skills);
      return {
        message: 'Skills retrieved successfully',
        status: 200,
        skills,
      };
    } catch (error) {
      this.logger.error('Error finding skills:', error);
      throw new Error('Error finding skills');
    }
  }

  async findSkilledUsers(skillId: string) {
    this.logger.log('Finding all users with skill:', skillId);
    try {
      const skilledUsers = await this.userSkillModel
        .find({
          skill: skillId,
        })
        .populate('user')
        .populate('skill');
      this.logger.debug('Skilled users found:', skilledUsers);
      return {
        message: 'Skilled users retrieved successfully',
        status: 200,
        skilledUsers,
      };
    } catch (error) {
      this.logger.error('Error finding skilled users:', error);
      throw new Error('Error finding skilled users');
    }
  }

  // remove(id: number) {
  //   return `This action removes a #${id} userSkill`;
  // }
}
