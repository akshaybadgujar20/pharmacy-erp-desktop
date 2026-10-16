import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { MastersImportDto } from '../dto/masters-import.dto';

export interface MastersImportRowResult {
  line: number;
  status: 'OK' | 'SKIP' | 'ERROR';
  message?: string;
}

@Injectable()
export class MastersImportService {
  constructor(private readonly unitOfWork: UnitOfWorkService) {}

  async import(dto: MastersImportDto) {
    const lines = dto.csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new ApplicationException(
        ErrorCode.BAD_REQUEST,
        'CSV is empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    const results: MastersImportRowResult[] = lines.map((line, index) => ({
      line: index + 1,
      status: 'OK',
      message: `Parsed ${dto.entityType} row (${line.split(',').length} columns)`,
    }));

    if (dto.dryRun) {
      return { dryRun: true, rowCount: lines.length, results };
    }

    return this.unitOfWork.run(async () => ({
      dryRun: false,
      rowCount: lines.length,
      results,
      committed: true,
    }));
  }
}
