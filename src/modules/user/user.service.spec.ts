import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

describe('UserService', () => {
  let service: UserService;

  const mockSave = jest.fn();

  const mockUserDoc = {
    save: mockSave,
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockUserModelConstructor = jest.fn(() => mockUserDoc);

  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: Object.assign(mockUserModelConstructor, mockUserModel),
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto: CreateUserDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe',
        bio: '',
        picture_url: '',
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockSave.mockResolvedValue({ ...dto, _id: '123' });

      const result = await service.create(dto);

      expect(result.message).toBe('User created successfully');
      expect(result.status).toBe(201);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ username: 'john_doe' }),
      });

      const dto: CreateUserDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw error for unexpected exception', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValueOnce(new Error('Unexpected error')),
      });

      const dto: CreateUserDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe',
      };

      await expect(service.create(dto)).rejects.toThrow(Error);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const dto: LoginDto = {
        uname_email: 'john_doe',
        password: 'password123',
      };

      const hashedPassword = bcrypt.hashSync('password123', 10);

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          username: 'john_doe',
          email: 'john@example.com',
          _id: '1',
          password: hashedPassword,
        }),
      });

      jwtServiceMock.sign.mockReturnValue('token');

      const result = await service.login(dto);

      expect(result.status).toBe(200);
      expect(result.auth_token).toBe('token');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login({ uname_email: 'wrong', password: '123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const hashedPassword = bcrypt.hashSync('correct-password', 10);

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          username: 'john_doe',
          password: hashedPassword,
        }),
      });

      await expect(
        service.login({ uname_email: 'john_doe', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return 401 if no token is provided', () => {
      const result = service.refreshToken('');

      expect(result.status).toBe(401);
      expect(result.message).toBe('Refresh token not provided');
    });

    it('should return 401 if token is invalid', () => {
      const paylaod = jwtServiceMock.verify.mockReturnValueOnce(null);

      // if (!paylaod) {
      //   expect(service.refreshToken('invalid_token')).resolves.toEqual({
      //     status: 401,
      //     message: 'Invalid token',
      //   });
      // }

      const result = service.refreshToken('invalid_token');

      expect(result.status).toBe(401);
      expect(result.message).toBe('Invalid refresh token');
    });

    it('should return new tokens', () => {
      const payload = {
        username: 'john',
        email: 'john@example.com',
        userId: '1',
      };

      jwtServiceMock.verify.mockReturnValue(payload);
      jwtServiceMock.sign.mockReturnValue('new_token');

      const result = service.refreshToken('some_token');

      expect(result.status).toBe(200);
      expect(result.auth_token).toBe('new_token');
      expect(result.refresh_token).toBe('new_token');
    });

    it('should throw UnauthorizedException on invalid token', () => {
      jwtServiceMock.verify.mockImplementation(() => {
        throw new Error('Invalid');
      });

      expect(() => service.refreshToken('bad_token')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const id = 1;
      const updateUserDto = {
        username: 'new_username',
        email: 'new_email@example.com',
        name: 'New Name',
      };

      const existingUser = {
        _id: id,
        username: 'old_username',
        email: 'old_email@example.com',
        password: 'hashed_password',
        save: jest.fn(),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.update(id, updateUserDto);

      console.log('resuslt:', result);
      console.log('existingUser:', existingUser);
      console.log('updateUserDto:', updateUserDto);

      expect(result.message).toBe('User updated successfully');
      expect(result.status).toBe(200);
      expect(existingUser.username).toBe(updateUserDto.username);
      expect(existingUser.email).toBe(updateUserDto.email);
      expect(existingUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const id = 1;
      const updateUserDto = {
        username: 'new_username',
        email: 'new_email@example.com',
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if username is already taken', async () => {
      const id = 1;
      const updateUserDto = {
        username: 'existing_username',
      };

      const existingUser = {
        _id: id,
        username: 'old_username',
        email: 'old_email@example.com',
        password: 'hashed_password',
        save: jest.fn(),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ username: 'existing_username' }),
      });

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if email is already taken', async () => {
      const id = 1;
      const updateUserDto = {
        email: 'existing_email@example.com',
      };

      const existingUser = {
        _id: id,
        username: 'old_username',
        email: 'old_email@example.com',
        password: 'hashed_password',
        save: jest.fn(),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });

      mockUserModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ email: 'existing_email@example.com' }),
      });

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw error for unexpected exception', async () => {
      const id = 1;
      const updateUserDto = {
        username: 'new_username',
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValueOnce(new Error('Unexpected error')),
      });

      await expect(service.update(id, updateUserDto)).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should mark user as deleted', async () => {
      const user = {
        deleted: false,
        save: jest.fn(),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      const result = await service.remove(1);

      expect(user.deleted).toBe(true);
      expect(user.save).toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw error for unexpected exception', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValueOnce(new Error('Unexpected error')),
      });

      await expect(service.remove(1)).rejects.toThrow(Error);
    });
  });
});
