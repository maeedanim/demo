import { Injectable, Logger } from '@nestjs/common';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Experience, ExperienceDocument } from './entities/experience.entity';
import { Model } from 'mongoose';
import { isErrorResponse } from '@/utils/type-guards';
import { IError } from '@/interfaces/error.interface';
import { IExperience } from '@/interfaces/experience.interface';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectModel(Experience.name)
    private readonly experienceModel: Model<ExperienceDocument>,
  ) {}
  private readonly logger = new Logger(ExperienceService.name);

  async create(createExperienceDto: CreateExperienceDto, userId: string) {
    this.logger.log('Creating experience:', createExperienceDto);
    this.logger.log('User ID:', userId);
    try {
      const newExperience = new this.experienceModel({
        ...createExperienceDto,
        user: userId,
      });
      this.logger.debug('New experience data:', newExperience);
      await newExperience.save();
      return {
        message: 'Experience added successfully',
        status: 201,
        experience: newExperience,
      };
    } catch (error) {
      this.logger.error('Error creating experience:', error);
      throw new Error('Error creating experience');
    }
  }

  async findAll(userId: string) {
    this.logger.log('Finding all experiences for user:', userId);
    try {
      const experiences = await this.experienceModel
        .find({
          user: userId,
          deleted: false,
        })
        .exec();
      this.logger.debug('Experiences found:', experiences);
      return {
        message: 'Experiences retrieved successfully',
        status: 200,
        experiences,
      };
    } catch (error) {
      this.logger.error('Error finding experiences:', error);
      throw new Error('Error finding experiences');
    }
  }

  async findOne(experienceId: string): Promise<IExperience | IError> {
    this.logger.log('Finding experience with ID:', experienceId);
    try {
      const experience = await this.experienceModel.findOne({
        _id: experienceId,
        deleted: false,
      });
      if (!experience) {
        this.logger.error('Experience not found');
        return {
          message: 'Experience not found',
          statusCode: 404,
        };
      }
      this.logger.debug('Experience found:', experience);
      return experience;
    } catch (error) {
      this.logger.error('Error finding experience:', error);
      throw new Error('Error finding experience');
    }
  }

  async update(
    experienceId: string,
    updateExperienceDto: UpdateExperienceDto,
    userId: string,
  ) {
    this.logger.log('Updating experience:', updateExperienceDto);
    this.logger.log('Experience ID:', experienceId);
    this.logger.log('User ID:', userId);
    try {
      const existingExpereince = await this.findOne(experienceId);
      if (isErrorResponse(existingExpereince)) {
        this.logger.error('Experience not found:', existingExpereince);
        return existingExpereince;
      }
      this.logger.debug('Experience found:', existingExpereince);
      if (existingExpereince.user.toString() !== userId) {
        this.logger.warn('User not authorized to update experience');
        return {
          message: 'User not authorized to update experience',
          status: 403,
        };
      }
      const updatedExperience = await this.experienceModel.findByIdAndUpdate(
        experienceId,
        { ...updateExperienceDto },
        { new: true },
      );
      this.logger.log('Experience updated successfully');
      return {
        message: 'Experience updated successfully',
        status: 200,
        experience: updatedExperience,
      };
    } catch (error) {
      this.logger.error('Error updating experience:', error);
      throw new Error('Error updating experience');
    }
  }

  async remove(experienceId: string, userId: string) {
    this.logger.log('Removing experience with ID:', experienceId);
    try {
      let existingExperience = await this.findOne(experienceId);
      if (isErrorResponse(existingExperience)) {
        this.logger.error('Experience not found:', existingExperience);
        return existingExperience;
      }
      this.logger.debug('Experience found:', existingExperience);
      if (existingExperience.user.toString() !== userId) {
        this.logger.warn('User not authorized to remove experience');
        return {
          message: 'User not authorized to remove experience',
          status: 403,
        };
      }
      existingExperience = (await this.experienceModel.findByIdAndUpdate(
        experienceId,
        { deleted: true },
        { new: true },
      )) as IExperience;
      this.logger.log('Experience removed successfully');
      return {
        message: 'Experience removed successfully',
        status: 200,
        experience: existingExperience,
      };
    } catch (error) {
      this.logger.error('Error removing experience:', error);
      throw new Error('Error removing experience');
    }
  }
}
