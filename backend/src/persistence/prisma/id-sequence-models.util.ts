import { Prisma } from '@prisma/client';

export const ID_SEQUENCE_MODEL_NAME = 'IdSequence';

export interface AllocatableModel {
  modelName: string;
  tableName: string;
}

type DmmfField =
  (typeof Prisma.dmmf.datamodel.models)[number]['fields'][number];

/** Prisma 7 client DMMF often omits `isId`; all business models use `id BigInt @id`. */
function isBigIntPrimaryKeyField(field: DmmfField): boolean {
  if (field.kind !== 'scalar' || field.type !== 'BigInt') {
    return false;
  }
  if (field.isId === true) {
    return true;
  }
  return field.name === 'id';
}

export function getAllocatableModels(): AllocatableModel[] {
  return Prisma.dmmf.datamodel.models
    .filter((model) => model.name !== ID_SEQUENCE_MODEL_NAME)
    .filter((model) => model.fields.some(isBigIntPrimaryKeyField))
    .map((model) => ({
      modelName: model.name,
      tableName: model.dbName ?? model.name,
    }));
}

export function getAllocatableModel(
  modelName: string,
): AllocatableModel | undefined {
  return getAllocatableModels().find((model) => model.modelName === modelName);
}
