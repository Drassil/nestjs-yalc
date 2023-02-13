import * as $ from "../crud-gen.type.js";

class Test {
  testField: string;
}

class TestConnection implements $.IConnection {
  name = "";
  nodes = [];
  pageData = new $.PageDataCrudGen();
}

describe("CrudGen Gql type test", () => {
  it("Check creation", async () => {
    const testCrudGenType = $.default<Test>(Test);
    const classed = new testCrudGenType();

    expect(testCrudGenType).toBeDefined();
    expect(classed).toBeDefined();
  });

  it("Check already existing typemap", async () => {
    $.typeMap["Test"] = TestConnection;
    const testCrudGenType = $.default<Test>(Test);

    expect(testCrudGenType).toBeDefined();
    delete $.typeMap["Test"];
  });
});
