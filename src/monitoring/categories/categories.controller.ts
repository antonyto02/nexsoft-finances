import { Body, Controller, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('monitoring/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.categoriesService.create(createCategoryDto);
    return {
      data,
      message: 'Category created successfully',
    };
  }
}
