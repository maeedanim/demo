import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(UserService.name);

  async create(createUserDto: CreateUserDto) {
    try {
      this.logger.log('Creating a new user');
      this.logger.debug(`User data: ${JSON.stringify(createUserDto)}`);

      const existingUser = await this.userModel
        .findOne({
          $or: [
            { username: createUserDto.username },
            { email: createUserDto.email },
          ],
        })
        .exec();

      if (existingUser) {
        this.logger.warn('User already exists');
        throw new ConflictException('User already exists');
      }

      this.logger.log('Hashing password');
      const passwordHash = bcrypt.hashSync(createUserDto.password, 10);
      const newUser = new this.userModel({
        ...createUserDto,
        password: passwordHash,
      });

      await newUser.save();
      this.logger.log('User created successfully');
      this.logger.debug(`New user data: ${JSON.stringify(newUser)}`);

      return {
        message: 'User created successfully',
        status: 201,
        user: newUser,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating user', error.stack);
      throw new Error('Error creating user');
    }
  }

  async login(loginDto: LoginDto) {
    this.logger.log('User login attempt');
    this.logger.debug(`Login data: ${JSON.stringify(loginDto)}`);

    const user = await this.userModel
      .findOne({
        $or: [
          { username: loginDto.uname_email },
          { email: loginDto.uname_email },
        ],
      })
      .exec();

    if (!user) {
      this.logger.warn('User not found');
      throw new NotFoundException('Username or Email is not found');
    }

    const isPasswordValid = bcrypt.compareSync(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn('Invalid password');
      throw new UnauthorizedException('Invalid password');
    }

    const payload = {
      username: user.username,
      email: user.email,
      userId: user._id,
    };
    const auth_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    this.logger.log('User logged in successfully');
    return {
      message: 'Login successful',
      status: 200,
      auth_token: `${auth_token}`,
      refresh_token: `${refresh_token}`,
      user,
    };
  }

  refreshToken(refreshToken: string) {
    this.logger.log('Refreshing token');
    this.logger.debug(`Refresh token: ${refreshToken}`);
    try {
      if (!refreshToken) {
        this.logger.warn('Refresh token not provided');
        return {
          message: 'Refresh token not provided',
          status: 401,
        };
      }
      const payload = this.jwtService.verify(refreshToken);
      if (!payload) {
        this.logger.warn('Invalid refresh token');
        return {
          message: 'Invalid refresh token',
          status: 401,
        };
      }
      const newAuthToken = this.jwtService.sign({
        username: payload.username,
        email: payload.email,
        userId: payload.userId,
      });
      const newRefreshToken = this.jwtService.sign(
        {
          username: payload.username,
          email: payload.email,
          userId: payload.userId,
        },
        { expiresIn: '7d' },
      );
      this.logger.log('Token refreshed successfully');
      return {
        message: 'Token refreshed successfully',
        status: 200,
        auth_token: newAuthToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      this.logger.error('Error refreshing token', error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // findAll() {
  //   return `This action returns all user`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} user`;
  // }

  async update(id: number, updateUserDto: UpdateUserDto) {
    this.logger.log('Updating user');
    this.logger.debug(`User ID: ${id}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateUserDto)}`);

    try {
      const existingUser = await this.userModel.findById(id).exec();
      if (!existingUser) {
        this.logger.warn('User not found');
        throw new NotFoundException('User not found');
      }

      if (
        updateUserDto.username &&
        updateUserDto.username !== existingUser.username
      ) {
        const usernameExists = await this.userModel
          .findOne({ username: updateUserDto.username })
          .exec();
        if (usernameExists) {
          this.logger.warn('Username already taken');
          throw new ConflictException('Username already taken');
        }
      }

      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.userModel
          .findOne({ email: updateUserDto.email })
          .exec();
        if (emailExists) {
          this.logger.warn('Email already taken');
          throw new ConflictException('Email already taken');
        }
      }

      const password = existingUser.password; // Keep the existing password, changing password is a separate action

      Object.assign(existingUser, updateUserDto, { password });

      await existingUser.save();

      this.logger.log('User updated successfully');
      this.logger.debug(`Updated user data: ${JSON.stringify(existingUser)}`);

      return {
        message: 'User updated successfully',
        status: 200,
        user: existingUser,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Error updating user', error.stack);
      throw new Error('Error updating user');
    }
  }

  async remove(id: number) {
    try {
      const existingUser = await this.userModel.findById(id).exec();
      if (!existingUser) {
        this.logger.warn('User not found');
        throw new NotFoundException('User not found');
      }

      existingUser.deleted = true;
      await existingUser.save();
      this.logger.log('User removed successfully');
      this.logger.debug(`Removed user data: ${JSON.stringify(existingUser)}`);
      return {
        message: 'User removed successfully',
        status: 200,
        user: existingUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error removing user', error.stack);
      throw new Error('Error removing user');
    }
  }
}
