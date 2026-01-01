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
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Authenticated } from '@/decorators/auth.decorator';
import { CurrentUser } from '@/decorators/current-user.decorator';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('test')
  async test(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.postService.test(startDate, endDate);
  }

  @Authenticated()
  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.postService.create(createPostDto, userId);
  }

  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNum = parseInt(page) || 1;
    const maxLimit = 20;
    const limitNum = Math.min(parseInt(limit) || 10, maxLimit);

    return this.postService.findAll(pageNum, limitNum);
  }

  @Get('author/:id')
  findByAuthor(@Param('id') id: string) {
    console.log('Author ID:', id);
    return this.postService.findByAuthor(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('Post ID:', id);
    return this.postService.findOne(id);
  }

  @Authenticated()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }

  @Authenticated()
  @Patch('reaction')
  async reactPost(
    @Body() reaction: { postId: string; status: string },
    @CurrentUser('userId') userId: string,
  ) {
    return this.postService.likePost(reaction.postId, userId, reaction.status);
  }

  @Authenticated()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser('userId') userId: string,
  ) {
    console.log('Update Post ID:', id);
    return this.postService.update(id, userId, updatePostDto);
  }
}
