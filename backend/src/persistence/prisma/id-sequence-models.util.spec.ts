import {
  getAllocatableModel,
  getAllocatableModels,
  ID_SEQUENCE_MODEL_NAME,
} from './id-sequence-models.util';

describe('id-sequence-models.util', () => {
  it('discovers allocatable models from Prisma DMMF', () => {
    const models = getAllocatableModels();
    expect(models.length).toBeGreaterThanOrEqual(70);
  });

  it('includes Country with physical table name', () => {
    const country = getAllocatableModel('Country');
    expect(country).toEqual({
      modelName: 'Country',
      tableName: 'Country',
    });
  });

  it('includes Customer for integration-style allocation', () => {
    expect(getAllocatableModel('Customer')).toBeDefined();
  });

  it('excludes IdSequence counter table', () => {
    const models = getAllocatableModels();
    expect(models.some((m) => m.modelName === ID_SEQUENCE_MODEL_NAME)).toBe(
      false,
    );
  });
});
