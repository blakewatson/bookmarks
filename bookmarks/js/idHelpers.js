/**
 * Assign an ID to an object. Will make sure the ID doesn't already exist.
 * @param {object} entity Object to which to assign an ID
 * @param {array} list list of existing entities
 * @returns {object}
 */
export const assignRandomId = (entity, list) => {
  const idExists = (id) => list.some((entity) => entity.id === id);

  do {
    var id = makeRandomId();
  } while (idExists(id));

  return { ...entity, id };
};

/**
 * Generates a random ID string.
 * @param {number} length The number of characters in the string
 * @returns {string}
 */
export const makeRandomId = (length = 8) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};