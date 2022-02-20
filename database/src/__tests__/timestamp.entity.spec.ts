import { BaseEntity } from 'typeorm';
import { EntityWithTimestamps } from '../timestamp.entity';

describe('EntityWithTimestamps entity test', () => {
  it('should be defined', () => {
    const result = EntityWithTimestamps(BaseEntity);

    expect(result).toBeDefined();
  });
});
