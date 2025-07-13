import { Controller, Post } from '@nestjs/common';
import { ForecastService } from './forecast.service';

@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Post('net-profit/retrain')
  async retrainNetProfit() {
    return this.forecastService.retrainNetProfit();
  }
}
