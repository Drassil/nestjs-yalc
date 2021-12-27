export enum FilterErrors {
  FILTER_NOT_SUPPORTED = "This filter is not supported",
  BAD_FILTER_TYPE = "The 'filters' field must be a string",
  INVALID_ARGUMENT = "Invalid argument",
  INVALID_OPERATOR = "Invalid operator",
  INVALID_CONDITION = "Invalid condition",
  NOT_POSSIBLE_EXCEPTION = "Cannot execute without filters",
  STRING_WHERE = '"where" property cannot be a string',
  INVALID_PROPERTY = "Invalid property",
  FILTER_PROHIBITED = "Cannot filter on property you cannot request",
  BAD_FILTER = "This is not a valid filter",
}

export enum AgGridErrors {
  REQUIRED_ARGS = "You should provide at least one of the arguments",
}
