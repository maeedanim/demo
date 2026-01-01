import { Injectable, Logger } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostDocument } from './entities/post.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IPost } from '@/interfaces/post.interface';
import { IError } from '@/interfaces/error.interface';
import { isErrorResponse } from '@/utils/type-guards';
import { IReaction } from '@/interfaces/reaction.interface';
import { Reaction, ReactionDocument } from './entities/reaction.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(Reaction.name)
    private readonly reactionModel: Model<ReactionDocument>,
  ) {}

  private readonly logger = new Logger(PostService.name);

  async create(createPostDto: CreatePostDto, author: string) {
    try {
      this.logger.log('Post created by:', author);

      const newPost = new this.postModel({
        ...createPostDto,
        user: author,
      });
      this.logger.debug('New post data:', newPost);
      await newPost.save();
      return {
        message: 'Post created successfully',
        status: 201,
        post: newPost,
      };
    } catch (error) {
      this.logger.error('Error creating post:', error);
      throw new Error('Error creating post');
    }
  }

  async findAll(page: number, limit: number) {
    try {
      this.logger.log(`Fetching posts | Page: ${page}, Limit: ${limit}`);

      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        this.postModel
          .aggregate([
            {
              $match: { deleted: false },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
              },
            },
            {
              $project: {
                'user.password': 0, // Exclude password
              },
            },
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
            }, //keeping only like and dislike, neutral can be used if we want to know if there are interactions
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
                  {
                    $count: 'count',
                  },
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
            { $sort: { createdAt: -1 } }, // Sort by newest first
            { $skip: skip },
            { $limit: limit },
          ])
          .exec(),

        this.postModel.countDocuments().exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: posts,
        meta: {
          total,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching posts:', error);
      throw new Error('Error fetching posts');
    }
  }

  async findByAuthor(userId: string) {
    try {
      this.logger.log('Fetching all posts');
      const posts = await this.postModel.find({ user: userId });
      this.logger.debug('Posts:', posts);
      return posts;
    } catch (error) {
      this.logger.error('Error fetching posts:', error);
      throw new Error('Error fetching posts');
    }
  }

  async findOne(id: string): Promise<IPost | IError> {
    try {
      const existingPost = await this.postModel.findOne({
        _id: id,
        deleted: false,
      });
      if (!existingPost || existingPost.deleted) {
        this.logger.warn('Post not found');
        return {
          message: 'Post not found',
          statusCode: 404,
        };
      }
      return existingPost;
    } catch (error) {
      this.logger.error('Error fetching post:', error);
      throw new Error('Error fetching post');
    }
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    try {
      this.logger.log('Updating post with ID:', id);
      this.logger.debug('Update data:', updatePostDto);
      const existingPost = await this.findOne(id);
      if (isErrorResponse(existingPost)) {
        return existingPost;
      }
      if (existingPost.user && existingPost.user.toString() !== userId) {
        this.logger.debug('Post Author', existingPost.user);
        this.logger.debug('Current User', userId);
        return {
          message: 'Unauthorized update attempt',
          statusCode: 401,
        };
      }
      Object.assign(existingPost, updatePostDto);
      await existingPost.save();
      this.logger.log('Post updated successfully');
      this.logger.debug('Updated post data:', existingPost);

      return {
        message: 'Post updated successfully',
        status: 200,
        post: existingPost,
      };
    } catch (error) {
      this.logger.error('Error updating post:', error);
      throw new Error('Error updating post');
    }
  }

  async remove(id: string) {
    try {
      this.logger.log('Deleting post with ID:', id);
      const existingPost = await this.findOne(id);
      if (isErrorResponse(existingPost)) {
        return existingPost;
      }
      existingPost.deleted = true;
      await existingPost.save();
      this.logger.log('Post deleted successfully');
      return {
        message: 'Post deleted successfully',
        status: 200,
        post: existingPost,
      };
    } catch (error) {
      this.logger.error('Error deleting post:', error);
      throw new Error('Error deleting post');
    }
  }

  async likePost(postId: string, userId: string, status: string) {
    try {
      this.logger.log('Reacting to post with ID:', postId);
      const existingPost = await this.findOne(postId);
      if (isErrorResponse(existingPost)) {
        return existingPost;
      }
      const reaction: IReaction | null = await this.reactionModel.findOne({
        user: userId,
        post: postId,
      });
      if (!reaction) {
        this.logger.log('User reacting for the first time');
        const newReaction = new this.reactionModel({
          user: userId,
          post: postId,
          status: status,
        });
        await newReaction.save();
        this.logger.log('Post reaction successful');
        return {
          message: 'Post reaction successful',
          status: 200,
        };
      } else if (reaction && reaction.status.toString() != status) {
        this.logger.log('User changed their reaction');
        reaction.status = status as unknown as ['Like', 'Dislike', 'Neutral'];
        await reaction.save();
        return {
          message: 'Post reaction successful',
          status: 200,
        };
      } else if (reaction && reaction.status.toString() == status) {
        this.logger.warn('User already reacted with the same reaction');
        return {
          message: 'User already reacted with the same reaction',
          status: 400,
        };
      }
    } catch (error) {
      this.logger.error('Error liking post:', error);
      throw new Error('Error liking post');
    }
  }

  async test(startDate: string, endDate: string) {
    try {
      const matchConditions: any = { deleted: false };

      if (startDate) {
        matchConditions.createdAt = { $gte: new Date(startDate) };
      }

      if (endDate) {
        matchConditions.createdAt = matchConditions.createdAt
          ? { ...matchConditions.createdAt, $lte: new Date(endDate) }
          : { $lte: new Date(endDate) };
      }

      const posts = await this.postModel.aggregate([
        {
          $match: matchConditions,
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
                      { $eq: ['$deleted', false] }, // or whatever your deleted flag is
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
                      $setUnion: ['$comments.user', []], // unique users
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
          $project: { 'commenterDetails.password': 0 }, // Exclude password
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
        }, //keeping only like and dislike, neutral can be used if we want to know if there are interactions
      ]);
      this.logger.debug('Posts:', posts);
      return posts;
    } catch (error) {
      this.logger.error('Error fetching posts:', error);
      throw new Error('Error fetching posts');
    }
  }
}
