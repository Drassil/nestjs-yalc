import * as EntityError from '../entity.error';

const fixedMessage = 'fixedErrorText';
const fixedError = new Error(fixedMessage);
describe('Entity error', () => {
  const error = new EntityError.EntityError(fixedMessage, fixedError);

  it('should be defined', () => {
    expect(error).toBeDefined();
  });

  it('ErrorsEnum should have all the values', () => {
    expect(Object.keys(EntityError.EntityErrorsEnum)).toEqual([
      'CREATION_FAILED',
      'UPDATE_FAILED',
      'DELETE_FAILED',
    ]);
  });

  it('should have the correct message', () => {
    expect(error.message).toEqual(fixedMessage);
  });

  it('should use the error stack', () => {
    expect(error.stack).toEqual(fixedError.stack);
  });
});

describe('Create entity error', () => {
  it('should have the custom error stack', () => {
    const error = new EntityError.CreateEntityError(fixedError);
    expect(error.stack).toEqual(fixedError.stack);
  });

  it('should use the default error messages', () => {
    const customError = new EntityError.CreateEntityError();
    expect(customError.message).toEqual(
      EntityError.EntityErrorsEnum.CREATION_FAILED,
    );
  });
});

describe('Update entity error', () => {
  it('should have the custom error stack', () => {
    const error = new EntityError.UpdateEntityError(fixedError);
    expect(error.stack).toEqual(fixedError.stack);
  });

  it('should use the default error message', () => {
    const customError = new EntityError.UpdateEntityError();
    expect(customError.message).toEqual(
      EntityError.EntityErrorsEnum.UPDATE_FAILED,
    );
  });
});

describe('Delete entity error', () => {
  it('should have the custom error stack', () => {
    const error = new EntityError.DeleteEntityError(fixedError);
    expect(error.stack).toEqual(fixedError.stack);
  });

  it('should use the default error message', () => {
    const customError = new EntityError.DeleteEntityError();
    expect(customError.message).toEqual(
      EntityError.EntityErrorsEnum.DELETE_FAILED,
    );
  });
});
