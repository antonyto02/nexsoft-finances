import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  Transaction,
  TransactionDocument,
} from '../../transactions/transaction.schema';
import {
  DailySummary,
  DailySummaryDocument,
} from '../daily-summary/daily-summary.schema';
import {
  MonthlySummary,
  MonthlySummaryDocument,
} from '../monthly-summary/monthly-summary.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(DailySummary.name)
    private readonly dailySummaryModel: Model<DailySummaryDocument>,
    @InjectModel(MonthlySummary.name)
    private readonly monthlySummaryModel: Model<MonthlySummaryDocument>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    companyId: string,
  ): Promise<Category> {
    const created = new this.categoryModel({
      ...createCategoryDto,
      is_active: true,
      company_id: companyId,
    });
    return created.save();
  }

  async findAll(companyId: string): Promise<Category[]> {
    return this.categoryModel.find({ company_id: companyId }).lean();
  }

  async update(oldName: string, dto: UpdateCategoryDto): Promise<void> {
    if (!dto.newName) {
      throw new BadRequestException('newName is required');
    }

    const category = await this.categoryModel.findOne({ name: oldName });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const conflict = await this.categoryModel.findOne({ name: dto.newName });
    if (conflict) {
      throw new ConflictException('Category name already exists');
    }

    category.name = dto.newName;
    await category.save();

    await this.transactionModel.updateMany(
      { category: oldName },
      { $set: { category: dto.newName } },
    );

    const dailyDocs = await this.dailySummaryModel.find({
      $or: [
        { [`categories_income.${oldName}`]: { $exists: true } },
        { [`categories_expense.${oldName}`]: { $exists: true } },
      ],
    });

    for (const doc of dailyDocs) {
      if (
        doc.categories_income &&
        doc.categories_income[oldName] !== undefined
      ) {
        doc.categories_income[dto.newName] = doc.categories_income[oldName];
        delete doc.categories_income[oldName];
        doc.markModified('categories_income');
      }
      if (
        doc.categories_expense &&
        doc.categories_expense[oldName] !== undefined
      ) {
        doc.categories_expense[dto.newName] = doc.categories_expense[oldName];
        delete doc.categories_expense[oldName];
        doc.markModified('categories_expense');
      }
      await doc.save();
    }

    const monthlyDocs = await this.monthlySummaryModel.find({
      $or: [
        { [`categories_income.${oldName}`]: { $exists: true } },
        { [`categories_expense.${oldName}`]: { $exists: true } },
      ],
    });

    for (const doc of monthlyDocs) {
      if (
        doc.categories_income &&
        doc.categories_income[oldName] !== undefined
      ) {
        doc.categories_income[dto.newName] = doc.categories_income[oldName];
        delete doc.categories_income[oldName];
        doc.markModified('categories_income');
      }
      if (
        doc.categories_expense &&
        doc.categories_expense[oldName] !== undefined
      ) {
        doc.categories_expense[dto.newName] = doc.categories_expense[oldName];
        delete doc.categories_expense[oldName];
        doc.markModified('categories_expense');
      }
      await doc.save();
    }
  }

  async remove(name: string): Promise<void> {
    const category = await this.categoryModel.findOne({ name });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    category.is_active = false;
    await category.save();
  }
}
