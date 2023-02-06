import { BaseEntity, Repository } from 'typeorm';
import { KafkaController } from '../kafka.controller.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';

class TestEntity {
  testProperty: string;
}

describe('Kafka Controller', () => {
  let repository: DeepMocked<Repository<BaseEntity>>;
  let controller: KafkaController<BaseEntity>;
  beforeAll(() => {
    repository = createMock<Repository<BaseEntity>>();
    controller = new KafkaController(repository);
  });
  it('Should be defined', async () => {
    expect(controller).toBeDefined();

    await expect(controller.deleteEntity({})).resolves.toBeDefined();
    await expect(controller.saveEntity({})).resolves.toBeDefined();
    await expect(controller.saveEntityOrUpdate({}, [])).resolves.toBeDefined();
  });

  it('Should filter the target value', () => {
    const test = new TestEntity();
    test.testProperty = 'testProperty';
    const result = controller.checkTargetValue(test, 'testProperty', [
      'testProperty',
    ]);
    expect(result).toBeTruthy();
  });
});
