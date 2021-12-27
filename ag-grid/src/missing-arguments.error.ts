import { BadRequestException } from "@nestjs/common";
import { AgGridErrors } from "./strings.enum";

export class ArgumentsError extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class MissingArgumentsError extends ArgumentsError {
  constructor(message?: string) {
    super(message ?? AgGridErrors.REQUIRED_ARGS);
  }
}
