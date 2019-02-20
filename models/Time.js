var { db, helpers } = require('../database')

class Time {
  static insert(userId, date, distance, duration) {
    // run the insert query
    var timeId = helpers.insertRow(
      'INSERT INTO time (userId, date, distance, duration) VALUES (?, ?, ?, ?)',
      [userId, date, distance, duration]
    )
    return timeId
  }

  static select() {
      var allRows = helpers.getRows('SELECT * FROM time');
      return allRows;
  }

  static delete(id) {
    helpers.runAndExpectNoRows('DELETE FROM time WHERE id = ?', [id]);
  }

  static updateTime(date, distance, duration, id) {
    helpers.runAndExpectNoRows('UPDATE time SET date = ?, distance = ?, duration = ? WHERE id = ?', [date, distance, duration, id]);
  }

  static findById(id, userId) {
    var row = helpers.getRow('SELECT * FROM time WHERE id = ? AND userId = ?', [id, userId])

    if (row) {
      return new Time(row)
    } else {
      return null
    }
  };

  static findByUserId(userId) {
    var rows = helpers.getRows('SELECT * FROM time WHERE userId = ?', [userId])

    if (rows) {
      return rows.map((row) => new Time(row))
    } else {
      return null
    }
  }

  constructor(databaseRow) {
    this.id = databaseRow.id
    this.date = databaseRow.date
    this.distance = databaseRow.distance
    this.duration = databaseRow.duration
  }
}

module.exports = Time