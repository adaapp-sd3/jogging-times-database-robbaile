var express = require('express');
var bcrypt = require('bcryptjs');

var User = require('./models/User');
var Time = require('./models/Time');
var Follow = require('./models/Follow');

var routes = new express.Router();

var saltRounds = 10;

function formatDateForHTML(date) {
  return new Date(date).toISOString().slice(0, -8)
}

// main page
routes.get('/', function(req, res) {
  if (req.cookies.userId) {
    // if we've got a user id, assume we're logged in and redirect to the app:
    res.redirect('/times')
  } else {
    // otherwise, redirect to login
    res.redirect('/sign-in')
  }
})

// show the create account page
routes.get('/create-account', function(req, res) {
  res.render('create-account.html')
})

// handle create account forms:
routes.post('/create-account', function(req, res) {
  var form = req.body;

  if (!form.email.includes("@")) {
    res.redirect('/create-account', 
    { error: "Enter a valid email" })
    return;
  } else if (form.password !== form.passwordConfirm) {
    res.redirect('/create-account', 
    {error: "Passwords do not match"});
    return;
  }
  // hash the password - we dont want to store it directly
  var passwordHash = bcrypt.hashSync(form.password, saltRounds)
  
  // create the user
  var userId = User.insert(form.name, form.email, passwordHash)

  // set the userId as a cookie
  res.cookie('userId', userId)

  // redirect to the logged in page
  res.redirect('/times')
})

// show the sign-in page
routes.get('/sign-in', function(req, res) {
  res.render('sign-in.html')
})

routes.post('/sign-in', function(req, res) {
  var form = req.body

  // find the user that's trying to log in
  var user = User.findByEmail(form.email)

  // if the user exists...
  if (user) {
    console.log({ form, user })
    if (bcrypt.compareSync(form.password, user.passwordHash)) {
      // the hashes match! set the log in cookie
      res.cookie('userId', user.id)
      // redirect to main app:
      res.redirect('/times')
    } else {
      // if the username and password don't match, say so
      res.render('sign-in.html', {
        errorMessage: 'Email address and password do not match'
      })
    }
  } else {
    // if the user doesnt exist, say so
    res.render('sign-in.html', {
      errorMessage: 'No user with that email exists'
    })
  }
})

// handle signing out
routes.get('/sign-out', function(req, res) {
  // clear the user id cookie
  res.clearCookie('userId')

  // redirect to the login screen
  res.redirect('/sign-in')
})

// list all job times
routes.get('/times', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);
  if (loggedInUser === null) {
		res.redirect('/sign-in')
		return
	}

  var usersTimes = Time.findByUserId(req.cookies.userId);

  var formattedUserTimes = usersTimes.map(time => {
    let avgSpeed = time.distance / time.duration;
    return newTime = {...time, avgSpeed} 
  });

  var totalDistance = usersTimes.reduce((accumulator, currentValue) => accumulator + currentValue.distance, 0);
  var totalTime = usersTimes.reduce((accumulator, currentValue) => accumulator + currentValue.duration, 0);
  var avgSpeed = totalDistance / totalTime;


  res.render('list-times.html', {
    user: loggedInUser,
    stats: {
      totalDistance: totalDistance.toFixed(2),
      totalTime: totalTime.toFixed(2),
      avgSpeed: avgSpeed.toFixed(2)
    },
    times: formattedUserTimes
  })
})

// show the create time form
routes.get('/times/new', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId);
  if (loggedInUser === null) {
		res.redirect('/sign-in')
		return
	}

  res.render('create-time.html', {
    user: loggedInUser
  })
})

// handle the create time form
routes.post('/times/new', function(req, res) {
  const { startTime, distance, duration } = req.body;

  var timeId = Time.insert(req.cookies.userId, startTime, distance, duration);

  // set the timeId as a cookie
  res.cookie('timeId', timeId);

  res.redirect('/times');
})

// show a pecific time
routes.get('/times/:id', function(req, res) {
  var timeId = req.params.id;
  var loggedInUser = User.findById(req.cookies.userId); 
  if (loggedInUser === null) {
		res.redirect('/sign-in')
		return
	}

  var time = Time.findById(timeId, loggedInUser.id);

  if (time === null) {
		res.redirect('/times')
	} else {
		res.render('edit-time.html', {
      user: loggedInUser,
      time: time
		})
	}
})

// handle the edit of a time
routes.post('/times/:id', function(req, res) {
  const timeId = req.params.id;
  const { date, distance, duration } = req.body

  Time.updateTime(date, distance, duration, timeId);

  res.redirect('/times');
})

// handle the delete of a time 
routes.get('/times/:id/delete', function(req, res) {
  var timeId = req.params.id;

  Time.delete(timeId);

  res.redirect('/times');
})


routes.get('/my-account', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId); 
  if (loggedInUser === null) {
		res.redirect('/sign-in')
		return
	}

  var followers = Follow.getFollowers(loggedInUser.id);
  var following = Follow.getFollowing(loggedInUser.id);

  var followerCount = followers.length;
  var followingCount = following.length;

  res.render('my-account.html', {
    user: loggedInUser,
    followers: followerCount,
    following: followingCount
  })
})

routes.get('/my-account/delete', function(req, res) {
  var userId = req.cookies.userId;

  //delete the user
  User.delete(userId);

  //clear the cookie
  res.clearCookie('userId')

  //sign out
  res.redirect('/sign-in')
})

routes.get('/users', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId); 
  if (loggedInUser === null) {
		res.redirect('/sign-in')
		return
	}

  var users = User.select();

  res.render('users.html', {
    user: loggedInUser,
    users: users
  });
});

routes.get('/users/:id', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId); 
  if (loggedInUser === null) {
		res.redirect('/sign-in')
		return
	}
  var otherUser = User.findById(req.params.id);

  var otherUserTimes = Time.findByUserId(req.params.id);

  var totalDistance = otherUserTimes.reduce((accumulator, currentValue) => accumulator + currentValue.distance, 0);
  var totalTime = otherUserTimes.reduce((accumulator, currentValue) => accumulator + currentValue.duration, 0);
  var avgSpeed = totalDistance / totalTime;

  res.render('user.html', {
    user: loggedInUser,
    otherUser: otherUser,
    otherUserTimes: otherUserTimes,
    stats: {
      totalDistance: totalDistance.toFixed(2),
      totalTime: totalTime.toFixed(2),
      avgSpeed: avgSpeed.toFixed(2)
    },
  })
})

routes.get('/users/:id/follow', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId); 
  var userId = loggedInUser.id;
  var followId = req.params.id;

  if(Follow.checkFollowers(userId, followId) !== null) {
    res.redirect('/users');
    return;
  }

  Follow.follow(userId, followId);

  res.redirect('/users');
});

routes.get('/follow', function(req, res) {
  var loggedInUser = User.findById(req.cookies.userId); 
  if (loggedInUser === null) {
		res.redirect('/sign-in')
		return
	}

  console.log(`req.cookies.userId: ${loggedInUser.id}`)

  let followers = Follow.getFollowers(loggedInUser.id);
  let following = Follow.getFollowing(loggedInUser.id);

  console.log(following);

  let followerId = followers.map(follower => User.findById(follower.name));
  let followingId = following.map(follower => User.findById(follower.email));

  res.render('follow.html', {
    user: loggedInUser,
    followers: followerId,
    following: followingId
  });
});

module.exports = routes
