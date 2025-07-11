import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { MonthlySummary } from '../monitoring/monthly-summary/monthly-summary.schema';

@Injectable()
export class ForecastService {
  constructor(
    @InjectModel(MonthlySummary.name)
    private readonly summaryModel: Model<MonthlySummary>,
    private readonly configService: ConfigService,
  ) {}

  async retrainNetProfit(): Promise<any> {
    const summaries = await this.summaryModel
      .find({}, { month: 1, year: 1, totals: 1 })
      .sort({ year: 1, month: 1 })
      .lean();

    const data = summaries.map((s) => ({
      month: `${s.year}-${String(s.month).padStart(2, '0')}`,
      net_profit: s.totals.net_profit,
    }));

    if (data.length < 12) {
      throw new BadRequestException('Not enough data to retrain');
    }

    const baseUrl = this.configService.get<string>('FORECAST_SERVICE_URL');
    if (!baseUrl) {
      throw new Error('FORECAST_SERVICE_URL not configured');
    }
    const url = `${baseUrl}/predict/net-profit`;
    const response = await axios.post(url, data);
    return response.data;
  }
}
