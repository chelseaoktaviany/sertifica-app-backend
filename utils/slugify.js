const slugify = require('slugify');

function generateNameSlug(name) {
  return slugify(name, {
    lower: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

module.exports = { generateNameSlug };
