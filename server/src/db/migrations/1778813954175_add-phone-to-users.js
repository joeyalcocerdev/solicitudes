/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('users', {
    phone: { type: 'varchar(20)' }
  })
}

exports.down = (pgm) => {
  pgm.dropColumn('users', 'phone')
}
