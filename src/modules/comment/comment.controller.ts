import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Authenticated } from '@/decorators/auth.decorator';
import { CurrentUser } from '@/decorators/current-user.decorator';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Authenticated()
  @Post('post/:postId')
  create(
    @Param('postId') postId: string,
    @CurrentUser('userId') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.create(createCommentDto, userId, postId);
  }

  // Removed the reply feature as per the request, keeping the code for future reference
  // @Authenticated()
  // @Post('reply/:commentId')
  // createReply(
  //   @Param('commentId') commentId: string,
  //   @CurrentUser('userId') userId: string,
  //   @Body() createCommentDto: CreateCommentDto,
  // ) {
  //   return this.commentService.createReply(createCommentDto, userId, commentId);
  // }

  // Find all comments for a specific post
  @Get('post/:postId')
  findAll(
    @Param('postId') postId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const maxLimit = 20;
    const limitNum = Math.min(parseInt(limit) || 10, maxLimit);
    return this.commentService.findAll(postId, pageNum, limitNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Authenticated()
  @Patch(':commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.commentService.update(commentId, updateCommentDto, userId);
  }

  @Authenticated()
  @Delete(':commentId')
  remove(
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.commentService.remove(commentId, userId);
  }
}
