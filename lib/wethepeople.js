/**
 * An interface to the We The People API Wrapper
 */

var WeThePeople = require('wethepeople-wrapper');
var wtpConfig = require('config').get('WE_THE_PEOPLE');

var wtp;
if(process.env.NODE_ENV === 'production'){
  wtp = WeThePeople(wtpConfig.get("API_KEY"));
} else {
  wtp = WeThePeople(wtpConfig.get("API_KEY"), true);
}

/**
 * Sign a petition on behalf of the user.
 *
 * @param petitionId The id of the petition to sign
 * @param firstName The first name of the signatory
 * @param lastName The last name of the signatory
 * @param email The email of the signatory
 * @param cb The callback
 */
var sign = function(petitionId, firstName, lastName, email, cb){
  wtp.signatures.signPetition(
    {
      "petition_id": petitionId,
      "email": email,
      "first_name": firstName,
      "last_name": lastName,
    },
    function(res){
      console.log('res');
      console.log(res);
      cb();
    }, function(err){
      console.log('err');
      console.log(err);
      cb(err);
    }
  );
}

module.exports.sign = sign;
