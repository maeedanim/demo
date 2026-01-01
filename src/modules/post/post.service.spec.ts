/* eslint-disable @typescript-eslint/unbound-method */
import { Model } from 'mongoose';
import { PostDocument } from './entities/post.entity';
import { ReactionDocument } from './entities/reaction.entity';
import { PostService } from './post.service';
import { Logger } from '@nestjs/common';
import { IPost } from '@/interfaces/post.interface';
import { IError } from '@/interfaces/error.interface';
import { IReaction } from '@/interfaces/reaction.interface';

describe('PostService', () => {
  let service: PostService;
  let postModel: jest.Mocked<Model<PostDocument>>;
  let reactionModel: jest.Mocked<Model<ReactionDocument>>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    postModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      aggregate: jest.fn(),
      countDocuments: jest.fn(),
      save: jest.fn(),
    } as any;

    reactionModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    service = new PostService(postModel, reactionModel);
    (service as any).logger = logger;
  });

  describe('findOne', () => {
    it('should return 404 if post is not found', async () => {
      postModel.findOne.mockResolvedValue(null);

      const result = await service.findOne('post123');

      expect(result).toEqual({
        message: 'Post not found',
        statusCode: 404,
      });
    });

    it('should fetch a single post successfully', async () => {
      const post = {
        _id: 'post123',
        title: 'Post 1',
        content: 'Content',
        user: 'user123',
        deleted: false,
        createdAt: new Date(),
      } as unknown as IPost;

      postModel.findOne.mockResolvedValue(post);

      const result = await service.findOne('post123');

      expect(postModel.findOne).toHaveBeenCalledWith({
        _id: 'post123',
        deleted: false,
      });
      expect(result).toEqual(post);
    });

    it('should throw an error for unexpected errors', async () => {
      const error = new Error('Unexpected error');
      postModel.findOne.mockRejectedValue(error);

      await expect(service.findOne('post123')).rejects.toThrow(
        'Error fetching post',
      );
    });
  });

  describe('create', () => {
    it('should create a post successfully', async () => {
      const createPostDto = { title: 'New Post', content: 'Post Content' };
      const author = 'user123';

      const mockPost = {
        _id: 'post123',
        ...createPostDto,
        user: author,
        save: jest.fn().mockResolvedValue(true), // Mock the save method
      } as unknown as PostDocument;

      // Mock the behavior of `new this.postModel()`
      const postModelMock = jest.fn().mockImplementation(() => mockPost);
      (service as any).postModel = postModelMock;

      const result = await service.create(createPostDto, author);

      expect(mockPost.save).toHaveBeenCalled(); // Verify save is called
      expect(result).toEqual({
        message: 'Post created successfully',
        status: 201,
        post: mockPost,
      });
    });

    it('should throw an error if post creation fails', async () => {
      const createPostDto = { title: 'New Post', content: 'Post Content' };
      const author = 'user123';

      const error = new Error('Unexpected error');
      postModel.create.mockRejectedValue(error);

      await expect(service.create(createPostDto, author)).rejects.toThrow(
        'Error creating post',
      );
    });
  });

  describe('update', () => {
    it('should update a post successfully', async () => {
      const post = {
        _id: 'post123',
        title: 'Old Title',
        content: 'Old Content',
        user: 'user123',
        deleted: false,
        createdAt: new Date(),
        save: jest.fn(),
      } as unknown as IPost;

      jest.spyOn(service, 'findOne').mockResolvedValue(post);

      const updatePostDto = { title: 'Updated Title' };
      const result = await service.update('post123', 'user123', updatePostDto);

      expect(post.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Post updated successfully',
        status: 200,
        post,
      });
    });

    it('should return 404 if post is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        message: 'Post not found',
        statusCode: 404,
      } as IError);
      const updatePostDto = { title: 'Updated Title' };
      const result = await service.update('post123', 'user123', updatePostDto);
      expect(result).toEqual({
        message: 'Post not found',
        statusCode: 404,
      });
    });

    it('should return 401 if user is unauthorized', async () => {
      const post = {
        _id: 'post123',
        title: 'Old Title',
        content: 'Old Content',
        user: 'user456',
        deleted: false,
        createdAt: new Date(),
      } as unknown as IPost;

      jest.spyOn(service, 'findOne').mockResolvedValue(post);

      const updatePostDto = { title: 'Updated Title' };
      const result = await service.update('post123', 'user123', updatePostDto);

      expect(result).toEqual({
        message: 'Unauthorized update attempt',
        statusCode: 401,
      });
    });

    it('should throw an error for unexpected errors', async () => {
      const error = new Error('Unexpected error');
      jest.spyOn(service, 'findOne').mockRejectedValue(error);

      const updatePostDto = { title: 'Updated Title' };
      await expect(
        service.update('post123', 'user123', updatePostDto),
      ).rejects.toThrow('Error updating post');
    });
  });

  describe('remove', () => {
    it('should delete a post successfully', async () => {
      const post = {
        _id: 'post123',
        title: 'Post Title',
        content: 'Post Content',
        user: 'user123',
        deleted: false,
        createdAt: new Date(),
        save: jest.fn(),
      } as unknown as IPost;

      jest.spyOn(service, 'findOne').mockResolvedValue(post);

      const result = await service.remove('post123');

      expect(post.deleted).toBe(true);
      expect(post.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Post deleted successfully',
        status: 200,
        post,
      });
    });

    it('should return 404 if post is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        message: 'Post not found',
        statusCode: 404,
      } as IError);

      const result = await service.remove('post123');

      expect(result).toEqual({
        message: 'Post not found',
        statusCode: 404,
      });
    });

    it('should throw an error for unexpected errors', async () => {
      const error = new Error('Unexpected error');
      jest.spyOn(service, 'findOne').mockRejectedValue(error);

      await expect(service.remove('post123')).rejects.toThrow(
        'Error deleting post',
      );
    });
  });

  describe('likePost', () => {
    it('should add a new reaction if user reacts for the first time', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const status = 'Like';

      const post = {
        _id: postId,
        title: 'Post Title',
        content: 'Post Content',
        user: 'user456',
        deleted: false,
        createdAt: new Date(),
      } as unknown as IPost;

      // Mock the post lookup
      jest.spyOn(service, 'findOne').mockResolvedValue(post);

      // Mock newReaction object (with save method)
      const newReaction = {
        user: userId,
        post: postId,
        status,
        save: jest.fn().mockResolvedValue(true),
      } as unknown as IReaction;

      // Mock the reactionModel: both constructor and findOne static method
      const reactionModelMock = Object.assign(
        jest.fn().mockImplementation(() => newReaction), // constructor behavior
        {
          findOne: jest.fn().mockResolvedValue(null), // simulate "first time reacting"
        },
      );

      // Inject mock into service
      (service as any).reactionModel = reactionModelMock;

      // Call the function
      const result = await service.likePost(postId, userId, status);

      // Assertions
      expect(reactionModelMock.findOne).toHaveBeenCalledWith({
        user: userId,
        post: postId,
      });
      expect(newReaction.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Post reaction successful',
        status: 200,
      });
    });

    it('should update the reaction if user changes their reaction', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const status = 'Dislike';

      const post = {
        _id: postId,
        title: 'Post Title',
        content: 'Post Content',
        user: 'user456',
        deleted: false,
        createdAt: new Date(),
      } as unknown as IPost;

      jest.spyOn(service, 'findOne').mockResolvedValue(post);

      const existingReaction = {
        user: userId,
        post: postId,
        status: 'Like',
        save: jest.fn().mockResolvedValue(true),
      } as unknown as IReaction;

      reactionModel.findOne.mockResolvedValue(existingReaction);

      const result = await service.likePost(postId, userId, status);

      expect(existingReaction.status).toBe(status);
      expect(existingReaction.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Post reaction successful',
        status: 200,
      });
    });

    it('should return 400 if user reacts with the same reaction', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const status = 'Like';

      const post = {
        _id: postId,
        title: 'Post Title',
        content: 'Post Content',
        user: 'user456',
        deleted: false,
        createdAt: new Date(),
      } as unknown as IPost;

      jest.spyOn(service, 'findOne').mockResolvedValue(post);

      const existingReaction = {
        user: userId,
        post: postId,
        status: 'Like',
      } as unknown as IReaction;

      reactionModel.findOne.mockResolvedValue(existingReaction);

      const result = await service.likePost(postId, userId, status);

      expect(result).toEqual({
        message: 'User already reacted with the same reaction',
        status: 400,
      });
    });

    it('should return 404 if post is not found', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const status = 'Like';

      jest.spyOn(service, 'findOne').mockResolvedValue({
        message: 'Post not found',
        statusCode: 404,
      } as IError);

      const result = await service.likePost(postId, userId, status);

      expect(result).toEqual({
        message: 'Post not found',
        statusCode: 404,
      });
    });

    it('should throw an error for unexpected errors', async () => {
      const postId = 'post123';
      const userId = 'user123';
      const status = 'Like';

      const error = new Error('Unexpected error');
      jest.spyOn(service, 'findOne').mockRejectedValue(error);

      await expect(service.likePost(postId, userId, status)).rejects.toThrow(
        'Error liking post',
      );
    });
  });

  describe('findAll', () => {
    it('should fetch posts with pagination successfully', async () => {
      const page = 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const mockPosts = [
        {
          _id: 'post1',
          title: 'Post 1',
          content: 'Content 1',
          user: { _id: 'user1', name: 'User 1' },
          reactions: { Like: 5, Dislike: 2 },
          comments: 3,
          createdAt: new Date(),
        },
        {
          _id: 'post2',
          title: 'Post 2',
          content: 'Content 2',
          user: { _id: 'user2', name: 'User 2' },
          reactions: { Like: 3, Dislike: 1 },
          comments: 1,
          createdAt: new Date(),
        },
      ];

      const total = 20;

      postModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPosts),
      } as any);
      postModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      } as any);

      const result = await service.findAll(page, limit);

      expect(postModel.aggregate).toHaveBeenCalledWith([
        { $match: { deleted: false } },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $project: { 'user.password': 0 } },
        { $match: { 'user.deleted': false } },
        {
          $lookup: {
            from: 'reactions',
            localField: '_id',
            foreignField: 'post',
            as: 'reactions',
          },
        },
        {
          $lookup: {
            from: 'reactions',
            let: { postId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$post', '$$postId'] } } },
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $project: { k: '$_id', v: '$count', _id: 0 } },
            ],
            as: 'reactions',
          },
        },
        { $addFields: { reactions: { $arrayToObject: '$reactions' } } },
        { $project: { 'reactions.Neutral': 0 } },
        {
          $lookup: {
            from: 'comments',
            let: { postId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$post', '$$postId'] },
                  deleted: false,
                },
              },
              { $count: 'count' },
            ],
            as: 'comments',
          },
        },
        {
          $addFields: {
            comments: {
              $cond: {
                if: { $gt: [{ $size: '$comments' }, 0] },
                then: { $arrayElemAt: ['$comments.count', 0] },
                else: 0,
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      expect(postModel.countDocuments).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockPosts,
        meta: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          pageSize: limit,
        },
      });
    });

    it('should throw an error if fetching posts fails', async () => {
      // await expect(service.findAll(1, 10)).rejects.toThrow(
      //   'Error fetching posts',
      // );

      // const userId = 'user123';
      const error = new Error('Unexpected error');

      postModel.aggregate.mockResolvedValue({
        exec: jest.fn().mockRejectedValueOnce(error),
      } as any);

      await expect(service.findAll(1, 10)).rejects.toThrow(
        'Error fetching posts',
      );
    });
  });

  describe('findByAuthor', () => {
    it('should fetch all posts by a specific author', async () => {
      const userId = 'user123';
      const mockPosts = [
        {
          _id: 'post1',
          title: 'Post 1',
          content: 'Content 1',
          user: userId,
          deleted: false,
          createdAt: new Date(),
        },
        {
          _id: 'post2',
          title: 'Post 2',
          content: 'Content 2',
          user: userId,
          deleted: false,
          createdAt: new Date(),
        },
      ];

      postModel.find.mockResolvedValue(mockPosts);

      const result = await service.findByAuthor(userId);

      expect(postModel.find).toHaveBeenCalledWith({ user: userId });
      expect(result).toEqual(mockPosts);
    });

    it('should return an empty array if no posts are found', async () => {
      const userId = 'user123';

      postModel.find.mockResolvedValue([]);

      const result = await service.findByAuthor(userId);

      expect(postModel.find).toHaveBeenCalledWith({ user: userId });
      expect(result).toEqual([]);
    });

    it('should throw an error for unexpected errors', async () => {
      const userId = 'user123';
      const error = new Error('Unexpected error');

      postModel.find.mockRejectedValue(error);

      await expect(service.findByAuthor(userId)).rejects.toThrow(
        'Error fetching posts',
      );
    });
  });

  describe('test', () => {
    it('should fetch posts within the specified date range', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';

      const mockPosts = [
        {
          _id: 'post123',
          title: 'Post Title',
          content: 'Post Content',
          user: 'user123',
          deleted: false,
          createdAt: new Date('2023-01-15'),
        },
      ];

      postModel.aggregate.mockResolvedValue(mockPosts);

      const result = await service.test(startDate, endDate);

      expect(postModel.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            deleted: false,
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          },
        },
        {
          $lookup: {
            from: 'comments',
            let: { postId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$post', '$$postId'] },
                      { $eq: ['$deleted', false] },
                    ],
                  },
                },
              },
            ],
            as: 'comments',
          },
        },
        {
          $addFields: {
            commenterStats: {
              $map: {
                input: {
                  $map: {
                    input: {
                      $setUnion: ['$comments.user', []],
                    },
                    as: 'uid',
                    in: {
                      user: '$$uid',
                      count: {
                        $size: {
                          $filter: {
                            input: '$comments',
                            as: 'c',
                            cond: { $eq: ['$$c.user', '$$uid'] },
                          },
                        },
                      },
                    },
                  },
                },
                as: 'stat',
                in: '$$stat',
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'commenterStats.user',
            foreignField: '_id',
            as: 'commenterDetails',
          },
        },
        {
          $project: { 'commenterDetails.password': 0 },
        },
        {
          $addFields: {
            commenterStats: {
              $map: {
                input: '$commenterStats',
                as: 'stat',
                in: {
                  $mergeObjects: [
                    '$$stat',
                    {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$commenterDetails',
                              as: 'userDoc',
                              cond: { $eq: ['$$userDoc._id', '$$stat.user'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: { commenterDetails: 0, comments: 0 },
        },
        {
          $lookup: {
            from: 'reactions',
            localField: '_id',
            foreignField: 'post',
            as: 'reactions',
          },
        },
        {
          $lookup: {
            from: 'reactions',
            let: { postId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$post', '$$postId'] } } },
              { $group: { _id: '$status', count: { $sum: 1 } } },
              {
                $project: {
                  k: '$_id',
                  v: '$count',
                  _id: 0,
                },
              },
            ],
            as: 'reactions',
          },
        },
        {
          $addFields: {
            reactions: { $arrayToObject: '$reactions' },
          },
        },
        {
          $project: {
            'reactions.Neutral': 0,
          },
        },
      ]);

      expect(result).toEqual(mockPosts);
    });

    it('should throw an error if aggregation fails', async () => {
      const error = new Error('Aggregation error');
      postModel.aggregate.mockRejectedValue(error);

      await expect(service.test('2023-01-01', '2023-01-31')).rejects.toThrow(
        'Error fetching posts',
      );
    });
  });
});
