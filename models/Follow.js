var { db, helpers } = require('../database')
 
class Follow {
    static follow(id, followId) {
        helpers.insertRow('INSERT INTO follow (userId, followId) VALUES (?, ?)', [id, followId]);
      }
    
      static getFollowing(userId) {
        var rows = helpers.getRows('SELECT * FROM follow WHERE userId = ?', [userId])
    
        if (rows) {
          return rows.map((row) => new User(row))
        } else {
          return null
        }
      }
    
      static getFollowers(userId) {
        var rows = helpers.getRows('SELECT * FROM follow WHERE followId = ?', [userId])
    
        if (rows) {
          return rows.map((row) => new User(row))
        } else {
          return null
        }
      }
    
      static checkFollowers(userId, followId) {
        var row = helpers.getRow('SELECT * FROM follow WHERE userId = ? AND followId = ?' , [userId, followId]);
    
        if (row) {
          return row;
        } else {
          return null;
        }
      }
    

    static getFollowing(userId) {
        var rows = helpers.getRows('SELECT * FROM follow WHERE userId = ?', [userId])

        if (rows) {
        return rows.map((row) => new Follow(row))
        } else {
        return null
        }
    }

    static getFollowers(userId) {
        var rows = helpers.getRows('SELECT * FROM follow WHERE followId = ?', [userId])

        if (rows) {
        return rows.map((row) => new Follow(row))
        } else {
        return null
        }
    }

    constructor(databaseRow) {
        this.id = databaseRow.id
        this.name = databaseRow.userId
        this.email = databaseRow.followId
    }
}

module.exports = Follow