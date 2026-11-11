/**
 * localStorage key that used to hold the language chosen with the navbar
 * switch. The address alone decides the language now (French at /, English
 * under /en): the key is only kept so `reset` can erase old values.
 */
export const LANGUAGE_KEY = 'lang';
/** localStorage key holding the colour theme chosen with the navbar toggle. */
export const THEME_KEY = 'theme';
/** localStorage key holding the snowfall choice: "on" or "off". */
export const SNOW_KEY = 'snow';
/** localStorage key counting visits: the coffee-maker pod restarts once more each time. */
export const COFFEE_KEY = 'coffee-restarts';
/** localStorage key holding the hashes of the flags unlocked in the terminal. */
export const FLAGS_KEY = 'flags';
/** localStorage key: "1" while the terminal session is a root shell (earned with the flags). */
export const ROOT_KEY = 'root';
/** localStorage keys: when the first and the last flag were unlocked, in ms. */
export const FLAGS_START_KEY = 'flags-start';
export const FLAGS_DONE_KEY = 'flags-done';
