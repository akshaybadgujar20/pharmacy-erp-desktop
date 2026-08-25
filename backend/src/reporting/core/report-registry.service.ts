import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type {
  ReportDefinition,
  ReportDefinitionMeta,
} from './report-definition.interface';

@Injectable()
export class ReportRegistryService {
  private readonly definitions = new Map<string, ReportDefinition>();

  register(definition: ReportDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new ApplicationException(
        ErrorCode.CONFLICT,
        `Report already registered: ${definition.id}`,
        HttpStatus.CONFLICT,
        { reportId: definition.id },
      );
    }

    this.definitions.set(definition.id, definition);
  }

  get(id: string): ReportDefinition {
    const definition = this.definitions.get(id);

    if (!definition) {
      throw new ApplicationException(
        ErrorCode.REPORT_NOT_FOUND,
        `Report not found: ${id}`,
        HttpStatus.NOT_FOUND,
        { reportId: id },
      );
    }

    return definition;
  }

  list(): ReportDefinitionMeta[] {
    return Array.from(this.definitions.values()).map((definition) => ({
      id: definition.id,
      name: definition.name,
      category: definition.category,
      permission: definition.permission,
    }));
  }

  listForUser(permissions: string[]): ReportDefinitionMeta[] {
    return this.list().filter((definition) =>
      permissions.includes(definition.permission),
    );
  }
}
