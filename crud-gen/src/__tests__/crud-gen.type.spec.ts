/* eslint-disable prettier/prettier */
import * as $ from '../crud-gen.type';

class Test {
  testField: string;
}

class TestConnection implements $.IConnection {
  name = '';
  nodes = [];
  pageData = new $.PageDataAgGrid();
}

describe('AgGrid Gql type test', () => {
  it('Check creation', async () => {
    const testAGGridType = $.default<Test>(Test);
    const classed = new testAGGridType();

    expect(testAGGridType).toBeDefined();
    expect(classed).toBeDefined();
  });

  it('Check already existing typemap', async () => {
    $.typeMap['Test'] = TestConnection;
    const testAGGridType = $.default<Test>(Test);

    expect(testAGGridType).toBeDefined();
    delete $.typeMap['Test'];
  });
});
