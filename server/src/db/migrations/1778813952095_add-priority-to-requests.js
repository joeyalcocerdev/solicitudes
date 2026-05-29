/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('requests', {
    priority: { type: 'varchar(20)', notNull: true, default: 'normal' }
  })
}

exports.down = (pgm) => {
  pgm.dropColumn('requests', 'priority')
}
