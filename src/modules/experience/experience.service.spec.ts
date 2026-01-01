import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceService } from './experience.service';
import { getModelToken } from '@nestjs/mongoose';
import { Experience } from './entities/experience.entity';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { isErrorResponse } from '@/utils/type-guards';

const mockExperience = {
  _id: '67ffa1b93e7c772fc9298aea',
  title: 'Software Engineer',
  company: 'Tech Corp',
  description: 'Developed amazing software.',
  startDate: new Date('2020-01-01'),
  endDate: new Date('2021-01-01'),
  user: 'userId123',
  deleted: false,
  save: jest.fn(),
};

const mockModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

describe('ExperienceService', () => {
  let service: ExperienceService;
  let model: typeof mockModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienceService,
        {
          provide: getModelToken(Experience.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ExperienceService>(ExperienceService);
    model = module.get(getModelToken(Experience.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new experience', async () => {
      const createDto: CreateExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Built stuff',
        startDate: '2020-01-01',
        endDate: '2021-01-01',
      };

      const mockSave = jest.fn().mockResolvedValue(mockExperience);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        ...mockExperience,
        save: mockSave,
      }));

      // Override experienceModel constructor
      (service as any).experienceModel = mockConstructor;

      const result = await service.create(createDto, 'userId123');

      expect(mockConstructor).toHaveBeenCalledWith({
        ...createDto,
        user: 'userId123',
      });
      expect(result.status).toBe(201);
      expect(result.experience.title).toBe('Software Engineer');
    });

    it('should throw an error if creation fails', async () => {
      const createDto: CreateExperienceDto = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Built stuff',
        startDate: '2020-01-01',
        endDate: '2021-01-01',
      };

      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error('Error creating experience'));
      const mockConstructor = jest.fn().mockImplementation(() => ({
        ...mockExperience,
        save: mockSave,
      }));

      // Override experienceModel constructor
      (service as any).experienceModel = mockConstructor;

      await expect(service.create(createDto, 'userId123')).rejects.toThrow(
        'Error creating experience',
      );
    });
  });

  describe('findAll', () => {
    it('should return all experiences for a user', async () => {
      model.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([mockExperience]),
      });

      const result = await service.findAll('userId123');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.experiences)).toBe(true);
    });

    it('should therow an error if no experiences found', async () => {
      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error('Error creating experience'));
      const mockConstructor = jest.fn().mockImplementation(() => ({
        ...mockExperience,
        save: mockSave,
      }));

      // Override experienceModel constructor
      (service as any).experienceModel = mockConstructor;

      await expect(service.findAll('userId123')).rejects.toThrow(
        'Error finding experiences',
      );
    });
  });

  describe('findOne', () => {
    it('should return a single experience', async () => {
      model.findOne.mockResolvedValueOnce(mockExperience);

      const result = await service.findOne('experienceId123');
      // console.log('result', result);

      expect(isErrorResponse(result)).toBe(false);
      if (!isErrorResponse(result)) {
        expect(result._id).toBe('67ffa1b93e7c772fc9298aea'); // Use the correct ID from mockExperience
      }
    });

    it('should return 404 if not found', async () => {
      model.findOne.mockResolvedValueOnce(null);

      const result = await service.findOne('nonexistentId');

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(404);
      }
    });

    it('should throw an error if finding fails', async () => {
      model.findOne.mockRejectedValueOnce(
        new Error('Error finding experience'),
      );

      await expect(service.findOne('experienceId123')).rejects.toThrow(
        'Error finding experience',
      );
    });
  });
  describe('update', () => {
    it('should update experience if authorized', async () => {
      const updateDto: UpdateExperienceDto = {
        title: 'Updated Title',
        company: 'Tech Corp',
        description: 'Updated desc',
        startDate: '2020-01-01',
        endDate: '2021-01-01',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockExperience as any);
      model.findByIdAndUpdate.mockResolvedValueOnce({
        ...mockExperience,
        title: updateDto.title,
      });

      const result = await service.update(
        'experienceId123',
        updateDto,
        'userId123',
      );

      // console.log('result', result);

      expect(isErrorResponse(result)).toBe(false);
      if (!isErrorResponse(result)) {
        expect(result.status).toBe(200);
        expect(result.experience?.title).toBe('Updated Title');
      }
    });

    it('should return 404 if experience not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        message: 'Experience not found',
        statusCode: 404,
      });

      const result = await service.update(
        'nonexistentId',
        mockExperience as any,
        'userId123',
      );

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(404);
      }
    });

    it('should return 403 if user not authorized', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockExperience,
        user: 'differentUserId',
      } as any);
      const result = await service.update(
        'experienceId123',
        mockExperience as any,
        'userId123',
      );

      if (!isErrorResponse(result)) {
        expect(result.status).toBe(403);
        expect(result.message).toBe('User not authorized to update experience');
      }
    });

    it('should throw error if fails', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockExperience as any);
      const result = await service.update(
        'experienceId123',
        mockExperience as any,
        'userId123',
      );
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockRejectedValueOnce(new Error('Error updatin experience'));

      await expect(
        service.update('experienceId123', mockExperience as any, 'userId123'),
      ).rejects.toThrow('Error updating experience');
    });
  });

  describe('remove', () => {
    it('should soft delete if authorized', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockExperience as any);
      model.findByIdAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockExperience),
      });

      const result = await service.remove('experienceId123', 'userId123');

      expect(isErrorResponse(result)).toBe(false);

      if (!isErrorResponse(result)) {
        expect(result.status).toBe(200);
      }
    });

    it('should return 404 if experience not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        message: 'Experience not found',
        statusCode: 404,
      });

      const result = await service.remove('nonexistentId', 'userId123');

      expect(isErrorResponse(result)).toBe(true);
      if (isErrorResponse(result)) {
        expect(result.statusCode).toBe(404);
      }
    });

    it('should return 403 if user not authorized', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockExperience,
        user: 'differentUserId',
      } as any);
      const result = await service.remove('experienceId123', 'userId123');

      if (!isErrorResponse(result)) {
        expect(result.status).toBe(403);
        expect(result.message).toBe('User not authorized to remove experience');
      }
    });

    it('should throw error if fails', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockExperience as any);
      const result = await service.remove('experienceId123', 'userId123');
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockRejectedValueOnce(new Error('Error removing experience'));

      await expect(
        service.remove('experienceId123', 'userId123'),
      ).rejects.toThrow('Error removing experience');
    });
  });
});
