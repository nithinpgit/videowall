var mongoose  = require('mongoose');
function escapeIp(v) {
    //return htmlentities(v,"ENT_QUOTES");
    return v;
}
var userSchema = mongoose.Schema({
    firstName                   : { type: String, set: escapeIp },
    lastName                    : { type: String, set: escapeIp },
    email                       : { type: String, set: escapeIp },
    password                    : { type: String, set: escapeIp },
    country                     : { type: String, set: escapeIp },
    logo                        : { type: String, set: escapeIp }, 
},
{
    timestamps: true
});
// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
