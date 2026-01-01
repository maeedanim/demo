import { Injectable, Logger } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './entities/comment.entity';
import { PostService } from '@/modules/post/post.service';
import { isErrorResponse } from '@/utils/type-guards';
import { IComment } from '@/interfaces/comment.interface';
import { IError } from '@/interfaces/error.interface';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    private readonly postService: PostService,
  ) {}
  private readonly logger = new Logger(CommentService.name);

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
    postId: string,
  ) {
    this.logger.log('Creating comment:', createCommentDto);
    this.logger.log('User ID:', userId);
    this.logger.log('Post ID:', postId);
    try {
      //Check if the post exists
      const post = await this.postService.findOne(postId);
      if (isErrorResponse(post)) {
        this.logger.error('Post not found:', post);
        return post;
      }
      this.logger.debug('Post found:', post);

      const newComment = new this.commentModel({
        ...createCommentDto,
        user: userId,
        post: postId,
      });
      this.logger.debug('New comment data:', newComment);
      await newComment.save();

      return {
        message: 'Comment added successfully',
        status: 201,
        comment: newComment,
      };
    } catch (error) {
      this.logger.error('Error creating comment:', error);
      throw new Error('Error creating comment');
    }
  }

  //removing reply feature, kept the code for future reference
  // async createReply(
  //   createCommentDto: CreateCommentDto,
  //   userId: string,
  //   commentId: string,
  // ) {
  //   this.logger.log('Creating comment:', createCommentDto);
  //   this.logger.log('User ID:', userId);
  //   this.logger.log('Comment ID:', commentId);
  //   try {
  //     const comment: IComment[] = await this.commentModel.aggregate([
  //       {
  //         $match: { _id: new Types.ObjectId(commentId) },
  //       },
  //       {
  //         $lookup: {
  //           from: 'posts',
  //           localField: 'post',
  //           foreignField: '_id',
  //           as: 'post',
  //         },
  //       },
  //       {
  //         $unwind: { path: '$post' },
  //       },
  //     ]);
  //     this.logger.debug('Comment found:', comment);
  //     const parentComment = comment[0];
  //     this.logger.debug('Parent comment:', parentComment);

  //     if (
  //       parentComment &&
  //       parentComment.post['deleted'] == false &&
  //       parentComment.deleted == false
  //     ) {
  //       this.logger.debug('Parent Comment found:', parentComment);
  //       this.logger.debug('Post found:', parentComment.post);
  //       const newComment = new this.commentModel({
  //         ...createCommentDto,
  //         user: userId,
  //         post: parentComment.post,
  //         parentComment: commentId,
  //       });
  //       this.logger.debug('New comment data:', newComment);
  //       await newComment.save();
  //       this.logger.log('Comment added successfully');
  //       return {
  //         message: 'Comment added successfully',
  //         status: 201,
  //         comment: newComment,
  //       };
  //     } else {
  //       return {
  //         message: 'Comment not found or post is deleted',
  //         status: 404,
  //         comment: null,
  //       };
  //     }
  //   } catch (error) {
  //     this.logger.error('Error creating comment:', error);
  //     throw new Error('Error creating comment');
  //   }
  // }

  async findAll(postId: string, pageNum: number, limitNum: number) {
    //finds all in one post
    this.logger.log('Fetching all comments for post:', postId);
    try {
      const post = await this.postService.findOne(postId);
      if (isErrorResponse(post)) {
        this.logger.error('Post not found:', post);
        return post;
      }

      this.logger.debug('Post found:', post);

      const skip = (pageNum - 1) * limitNum;

      const [comments, total] = await Promise.all([
        this.commentModel
          .aggregate([
            {
              $match: { post: new Types.ObjectId(postId), deleted: false },
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
              $unwind: { path: '$user' },
            },
            { $project: { 'user.password': 0 } },
            { $sort: { createdAt: -1 } }, // Sort by newest first
            { $skip: skip },
            { $limit: limitNum },
          ])
          .exec(),

        this.commentModel
          .countDocuments({ post: postId, deleted: false })
          .exec(),
      ]);

      this.logger.debug('Post found:', post);
      return {
        data: comments,
        meta: {
          total,
          totalPages: Math.ceil(total / limitNum),
          currentPage: pageNum,
          pageSize: limitNum,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching comments:', error);
      throw new Error('Error fetching comments');
    }
  }

  async findOne(id: string): Promise<IComment | IError> {
    this.logger.log('Fetching comment:', id);
    try {
      const existingComment: IComment[] | null =
        await this.commentModel.aggregate([
          {
            $match: {
              _id: new Types.ObjectId(id),
              deleted: false,
            },
          },
          {
            $lookup: {
              from: 'posts',
              localField: 'post',
              foreignField: '_id',
              as: 'post',
            },
          },
          { $unwind: '$post' },
        ]);
      if (existingComment.length === 0) {
        this.logger.warn('Comment not found');
        return {
          message: 'Comment not found',
          statusCode: 404,
        };
      }
      return existingComment[0];
    } catch (error) {
      this.logger.error('Error fetching comment:', error);
      throw new Error('Error fetching comment');
    }
  }

  async update(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ) {
    this.logger.log('Updating comment:', commentId);
    this.logger.log('User ID:', userId);
    this.logger.log('Update data:', updateCommentDto);

    try {
      const existingComment = await this.findOne(commentId);
      if (isErrorResponse(existingComment)) {
        this.logger.error('Comment not found:', existingComment);
        return existingComment;
      }
      this.logger.debug('Comment found:', existingComment);
      if (existingComment.user.toString() !== userId) {
        this.logger.warn('User not authorized to update comment');
        return {
          message: 'User not authorized to update comment',
          statusCode: 403,
        };
      }
      const updatedComment = await this.commentModel.findByIdAndUpdate(
        commentId,
        { ...updateCommentDto },
        { new: true },
      );
      this.logger.log('Comment updated successfully');
      return {
        message: 'Comment updated successfully',
        status: 200,
        comment: updatedComment,
      };
    } catch (error) {
      this.logger.error('Error updating comment:', error);
      throw new Error('Error updating comment');
    }
  }

  async remove(commentId: string, userId: string) {
    this.logger.log('Removing comment:', commentId);
    this.logger.log('User ID:', userId);
    try {
      const existingComment = await this.findOne(commentId);
      if (isErrorResponse(existingComment)) {
        this.logger.error('Comment not found:', existingComment);
        return existingComment;
      }

      if (
        existingComment.user.toString() !== userId &&
        typeof existingComment.post != 'string' &&
        existingComment.post.user?.toString() !== userId
      ) {
        this.logger.warn('User not authorized to delete comment');
        return {
          message: 'User not authorized to delete comment',
          statusCode: 403,
        };
      }
      await this.commentModel.findByIdAndUpdate(
        commentId,
        { deleted: true },
        { new: true },
      );
      this.logger.log('Comment removed successfully');
      return {
        message: 'Comment removed successfully',
        status: 200,
      };
    } catch (error) {
      this.logger.error('Error removing comment:', error);
      throw new Error('Error removing comment');
    }
  }
}
