import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { Comment } from './entities/comment.entity';
import { PostService } from '@/modules/post/post.service';
import { getModelToken } from '@nestjs/mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';
import { isErrorResponse } from '@/utils/type-guards';
import { UpdateCommentDto } from './dto/update-comment.dto';

describe('CommentService', () => {
  let service: CommentService;
  let postService: PostService;

  const mockPostId = '507f191e810c19729de860ea';
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockComment = {
    _id: '507f1f77bcf86cd799439012',
    text: 'This is a comment',
    user: mockUserId,
    post: mockPostId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock instance returned by "new CommentModel()"
  const mockCommentModelInstance = {
    save: jest.fn().mockResolvedValue(mockComment),
  };

  // Mock class (constructor) that returns the instance
  const mockCommentModel = jest.fn(() => mockCommentModelInstance);

  // Static methods used on CommentModel directly
  (mockCommentModel as any).aggregate = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue([mockComment]),
  });

  (mockCommentModel as any).countDocuments = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(1),
  });

  (mockCommentModel as any).findByIdAndUpdate = jest
    .fn()
    .mockResolvedValue(mockComment);

  const mockPostService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getModelToken(Comment.name),
          useValue: mockCommentModel,
        },
        {
          provide: PostService,
          useValue: mockPostService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    postService = module.get<PostService>(PostService);
  });

  it('should create a comment successfully', async () => {
    const mockDto: CreateCommentDto = { text: 'This is a comment' };
    mockPostService.findOne = jest.fn().mockResolvedValue({ _id: mockPostId });

    const result = await service.create(mockDto, mockUserId, mockPostId);

    expect(mockPostService.findOne).toHaveBeenCalledWith(mockPostId);

    if (isErrorResponse(result)) {
      throw new Error('Expected success but got error response');
    } else {
      // Check for the correct structure in the response
      expect(result.status).toBe(201);
      expect(result.message).toBe('Comment added successfully'); // Ensure the comment text is correctly returned
    }
  });

  it('should return an error when post is not found', async () => {
    const mockDto: CreateCommentDto = { text: 'This is a comment' };
    mockPostService.findOne = jest.fn().mockResolvedValue({
      statusCode: 404,
      message: 'Post not found',
    });

    const result = await service.create(mockDto, mockUserId, mockPostId);

    if (isErrorResponse(result)) {
      // We expect a 404 error when the post is not found
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Post not found');
    } else {
      console.log('result', result);
      // If we get a successful response instead, we want to throw an error in the test
      throw new Error('Expected error but got success response');
    }
  });

  it('should throw and error when facing unexpected error', async () => {
    const mockDto: CreateCommentDto = { text: 'This is a comment' };
    mockPostService.findOne = jest
      .fn()
      .mockRejectedValue(new Error('Unexpected error'));

    try {
      await service.create(mockDto, mockUserId, mockPostId);
    } catch (error) {
      expect(error.message).toBe('Error creating comment');
    }
  });

  it('should return an error when post is not found', async () => {
    mockPostService.findOne = jest.fn().mockResolvedValue({
      statusCode: 404,
      message: 'Post not found',
    });

    const result = await service.findAll('507f191e810c19729df', 1, 10);

    if (isErrorResponse(result)) {
      // We expect a 404 error when the post is not found
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Post not found');
    } else {
      console.log('result', result);
      // If we get a successful response instead, we want to throw an error in the test
      throw new Error('Expected error but got success response');
    }
  });

  it('should throw an error when facing unexpected error', async () => {
    mockPostService.findOne = jest
      .fn()
      .mockRejectedValue(new Error('Unexpected error'));
    try {
      await service.findAll(mockPostId, 1, 10);
    } catch (error) {
      expect(error.message).toBe('Error fetching comments');
    }
  });

  it('should return comments data for a post', async () => {
    mockPostService.findOne = jest.fn().mockResolvedValue({ _id: mockPostId });

    const result = await service.findAll(mockPostId, 1, 10);

    if (isErrorResponse(result)) {
      throw new Error('Expected success but got error');
    } else {
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta.total).toBe(1);
    }
  });

  describe('findOne', () => {
    it('should return a comment if found', async () => {
      const commentId = '507f1f77bcf86cd799439012';
      const mockComment = {
        _id: commentId,
        text: 'This is a comment',
        user: mockUserId,
        post: mockPostId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockCommentModel as any).aggregate = jest
        .fn()
        .mockReturnValue([mockComment]);

      const result = await service.findOne(commentId);

      expect(result).toEqual(mockComment);
    });

    it('should return an error if comment is not found', async () => {
      const commentId = '507f1f77bcf86cd799439013';

      (mockCommentModel as any).aggregate = jest.fn().mockReturnValue([]);

      const result = await service.findOne(commentId);
      // console.log('results are here', result);

      expect(result).toEqual({
        message: 'Comment not found',
        statusCode: 404,
      });
    });

    it('should throw an error if an unexpected error occurs', async () => {
      const commentId = '507f1f77bcf86cd799439014';

      (mockCommentModel as any).aggregate = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      });

      try {
        await service.findOne(commentId);
      } catch (error) {
        expect(error.message).toBe('Error fetching comment');
      }
    });
  });

  describe('update', () => {
    it('should update a comment successfully', async () => {
      const commentId = '507f1f77bcf86cd799439012';
      const updateCommentDto: UpdateCommentDto = {
        text: 'Updated comment text',
      };

      const mockComment = {
        _id: commentId,
        text: 'This is a comment',
        user: mockUserId,
        post: mockPostId,
        deleted: false,
      };

      (mockCommentModel as any).aggregate = jest
        .fn()
        .mockReturnValue([mockComment]);

      (mockCommentModel as any).findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...mockComment, ...updateCommentDto });

      const result = await service.update(
        commentId,
        updateCommentDto,
        mockUserId,
      );

      expect(result).toEqual({
        message: 'Comment updated successfully',
        status: 200,
        comment: { ...mockComment, ...updateCommentDto },
      });
    });

    it('should return an error if comment is not found', async () => {
      const commentId = '507f1f77bcf86cd799439013';
      const updateCommentDto: UpdateCommentDto = {
        text: 'Updated comment text',
      };

      (mockCommentModel as any).aggregate = jest.fn().mockReturnValue([]);

      const result = await service.update(
        commentId,
        updateCommentDto,
        mockUserId,
      );

      expect(result).toEqual({
        message: 'Comment not found',
        statusCode: 404,
      });
    });

    it('should return an error if user is unauthorized to update the comment', async () => {
      const commentId = '507f1f77bcf86cd799439012';
      const updateCommentDto: UpdateCommentDto = {
        text: 'Updated comment text',
      };

      const mockComment = {
        _id: commentId,
        text: 'This is a comment',
        user: '507f1f77bcf86cd799439015', // Different user ID
        post: mockPostId,
        deleted: false,
      };

      (mockCommentModel as any).aggregate = jest
        .fn()
        .mockReturnValue([mockComment]);

      const result = await service.update(
        commentId,
        updateCommentDto,
        mockUserId,
      );

      expect(result).toEqual({
        message: 'User not authorized to update comment',
        statusCode: 403,
      });
    });

    it('should throw an error if an unexpected error occurs', async () => {
      const commentId = '507f1f77bcf86cd799439014';
      const updateCommentDto: UpdateCommentDto = {
        text: 'Updated comment text',
      };

      (mockCommentModel as any).aggregate = jest
        .fn()
        .mockRejectedValue(new Error('Unexpected error'));

      try {
        await service.update(commentId, updateCommentDto, mockUserId);
      } catch (error) {
        expect(error.message).toBe('Error updating comment');
      }
    });
  });

  describe('remove', () => {
    it('should remove a comment successfully', async () => {
      const commentId = '507f1f77bcf86cd799439012';

      const mockComment = {
        _id: commentId,
        text: 'This is a comment',
        user: mockUserId,
        post: mockPostId,
        deleted: false,
      };

      (mockCommentModel as any).aggregate = jest
        .fn()
        .mockReturnValue([mockComment]);

      (mockCommentModel as any).findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ ...mockComment, deleted: true });

      const result = await service.remove(commentId, mockUserId);

      expect(result).toEqual({
        message: 'Comment removed successfully',
        status: 200,
      });
    });

    it('should return an error if comment is not found', async () => {
      const commentId = '507f1f77bcf86cd799439013';

      (mockCommentModel as any).aggregate = jest.fn().mockReturnValue([]);

      const result = await service.remove(commentId, mockUserId);

      expect(result).toEqual({
        message: 'Comment not found',
        statusCode: 404,
      });
    });

    it('should return an error if user is unauthorized to delete the comment', async () => {
      const commentId = '507f1f77bcf86cd799439012';

      const mockComment = {
        _id: commentId,
        text: 'This is a comment',
        user: '507f1f77bcf86cd799439015', // Different user ID
        post: { user: '507f1f77bcf86cd799439016' }, // Different post owner
        deleted: false,
      };

      (mockCommentModel as any).aggregate = jest
        .fn()
        .mockReturnValue([mockComment]);

      const result = await service.remove(commentId, mockUserId);

      expect(result).toEqual({
        message: 'User not authorized to delete comment',
        statusCode: 403,
      });
    });

    it('should throw an error if an unexpected error occurs', async () => {
      const commentId = '507f1f77bcf86cd799439014';

      (mockCommentModel as any).aggregate = jest
        .fn()
        .mockRejectedValue(new Error('Unexpected error'));

      try {
        await service.remove(commentId, mockUserId);
      } catch (error) {
        expect(error.message).toBe('Error removing comment');
      }
    });
  });
});
