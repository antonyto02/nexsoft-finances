import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { extractCompanyId } from '../../utils/token';

@Controller('monitoring/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Headers('authorization') auth?: string) {
    const companyId = extractCompanyId(auth);
    const data = await this.categoriesService.findAll(companyId);
    return { data };
  }

  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Headers('authorization') auth?: string,
  ) {
    const companyId = extractCompanyId(auth);
    const data = await this.categoriesService.create(createCategoryDto, companyId);
    return {
      data,
      message: 'Category created successfully',
    };
  }

  @Patch(':oldName')
  async update(
    @Param('oldName') oldName: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    await this.categoriesService.update(oldName, dto);
    return { message: 'Categor\u00eda actualizada correctamente' };
  }

  @Delete(':name')
  async remove(@Param('name') name: string) {
    await this.categoriesService.remove(name);
    return { message: 'Category deleted successfully' };
  }
}
