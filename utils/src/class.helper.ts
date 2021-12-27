import { ClassType } from "@nestjs-yalc/types";

export function isClass(func: any): func is ClassType {
  return (
    typeof func === "function" &&
    /^class\s/.test(Function.prototype.toString.call(func))
  );
}
