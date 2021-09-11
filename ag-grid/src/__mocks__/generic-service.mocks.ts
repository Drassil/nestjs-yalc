import { BaseEntity } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { AgGridRepository } from '@nestjs-yalc/ag-grid/ag-grid.repository';

export const baseEntityRepository = createMock<AgGridRepository<BaseEntity>>();
