/**
 * Exported by the app modules and used within the apps
 * NOTE: a system can run multiple apps at the same time
 */
export const APP_LOGGER_SERVICE = 'APP_LOGGER_SERVICE';
export const APP_EVENT_SERVICE = 'APP_EVENT_SERVICE';

/**
 * Globally exported from the main yalc module
 */
export const SYSTEM_EVENT_SERVICE = 'SYSTEM_EVENT_SERVICE';
export const SYSTEM_LOGGER_SERVICE = 'SYSTEM_LOGGER_SERVICE';

export const CURAPP_CONF_ALIAS = 'conf';

/**
 * Provider token to access the alias value of the app
 */
export const APP_ALIAS_TOKEN = 'APP_ALIAS_TOKEN';
/**
 * Provider token to access the option values of the app
 */
export const APP_OPTION_TOKEN = 'APP_OPTION_TOKEN';
/**
 * Provider token to access the option values of the current module
 */
export const MODULE_OPTION_TOKEN = 'MODULE_OPTION_TOKEN';
/**
 * Provider token to access the alias value of the current module
 */
export const MODULE_ALIAS_TOKEN = 'MODULE_ALIAS_TOKEN';

export const MAIN_APP_CONFIG_SERVICE = 'MAIN_APP_CONFIG_SERVICE';
