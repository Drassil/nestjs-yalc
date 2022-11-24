import { returnProperty } from '@nestjs-yalc/utils/returnValue';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CrudGenField, CrudGenObject } from '../object.decorator';

@Entity()
export class TestEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
}

@CrudGenObject()
export class TestEntityDto extends TestEntity {
  @CrudGenField({ gqlOptions: { name: 'entityId' } })
  id: number;
}

export class TestEntityRelation extends TestEntity {
  @OneToMany(
    () => TestEntityRelation2,
    returnProperty<TestEntityRelation2>('TestEntityRelation'),
  )
  @JoinColumn({
    name: 'TestEntityRelation',
    referencedColumnName: 'TestEntityRelation',
  })
  TestEntityRelation2: TestEntityRelation2;
}

export class TestEntityRelation2 extends TestEntity {
  @ManyToOne(
    () => TestEntityRelation,
    returnProperty<TestEntityRelation>('TestEntityRelation2'),
  )
  @JoinColumn({
    name: 'TestEntityRelation2',
    referencedColumnName: 'TestEntityRelation2',
  })
  TestEntityRelation: TestEntityRelation;
}