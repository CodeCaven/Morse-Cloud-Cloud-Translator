/** 
The Morse Code Client
TEAM 20
Last modified: 22/05/2017

This is the client page for the app
The client is responsible for the logic in the app
It will also push events to firebase for the server

 */

var event_id = 0;
var char_gap = 5000;
var word_gap = 10000;

var last = 0;
var time_out = 3000;

var newest = '';
var letter = '';
var delta_t;
var new_time;
var motionL;
var brackets = 0;

var event = {
  signal: '',
  message: ''
};

var interval;
var timerSwitch = false;

var morseTable = {
  'SL' : 'A',
  'LSSS' : 'B',
  'LSLS' : 'C',
  'LSS' : 'D',
  'S': 'E',
  'SSLS' : 'F',
  'LLS' : 'G',
  'SSSS' : 'H',
  'SS' : 'I',
  'SLLL' : 'J',
  'LSL' : 'K',
  'SLSS' : 'L',
  'LL' : 'M',
  'LS' : 'N',
  'LLL' : 'O',
  'SLLS' : 'P',
  'LLSL' : 'Q',
  'SLS' : 'R',
  'SSS' : 'S',
  'L' : 'T',
  'SSL' : 'U',
  'SSSL' : 'V',
  'SLL' : 'W',
  'LSSL' : 'X',
  'LSLL' : 'Y',
  'LLSS' : 'Z',
  'LLLLL' : '0',
  'SLLLL' : '1',
  'SSLLL' : '2',
  'SSSLL' : '3',
  'SSSSL' : '4',
  'SSSSS' : '5',
  'LSSSS' : '6',
  'LLSSS' : '7',
  'LLLSS' : '8',
  'LLLLS' : '9',
  'SLSLSL' : '.',
  'LLSLL' : ',',
  'LLLSSS' : ':',
  'SSLLSS' : '?',
  'SLLLLS' : "'",
  'LSSSSL' : '-',
  'LSSLS' : '/',
  'LSLLSL' : '(',
  'SLSSLS' : '"',
  'SLLSLS' : '@',
  'LSSSL' : '=',
  'SSSLSL' : '!'
};


/** Listens to toggle
 * @function 
 * 
 */
function motionChange(){
    if(document.getElementById("Switch").checked){
       window.MorseCode.saveMessage('on');
       timerSwitch = true;
    }else{
        window.MorseCode.saveMessage('off');
        timerSwitch=false;
        MorseCode.startTimer();
    }
}


/** Client morse class
 * @class
 */
function MorseCode() {
  this.checkSetup();
  this.initFirebase();
  this.loadMessages();
}

  /** Initialise firebase variables
   * @callback 
   * 
   */
  MorseCode.prototype.initFirebase = function () {
    this.database = firebase.database();
    this.storage = firebase.storage();
  };

  /** Called when an event is added to database and on initialisation
   * @callback 
   * 
   */
  MorseCode.prototype.loadMessages = function () {
    
    this.messagesRef = this.database.ref('sprint1');
    this.messagesRef.off();
    this.startTimer();
    timerSwitch = true;

    var setMessage = function (data) {
      
      var val = data.val();
      new_time = val.time;
      motionL = val.length*1000;
      newest = val.code;

      if(newest != undefined){ // don't do this when posting a client side message
        this.setDelta(val.id);
        this.decode();
        this.displayMessage(event.signal, event.message);
        this.startTimer();
      }

    }.bind(this);
    this.messagesRef.limitToLast(1).on('child_added', setMessage);
  };

  /** Pushes data to firebase
   * @callback 
   * @param sensor on or off
   */
  MorseCode.prototype.saveMessage = function (actionC) {
    // Add a new message entry to the Firebase Database.
    this.messagesRef.push({
      action: actionC,
      id: event_id,
      time: Date.now()
    }).then(function () {
      event_id += 1;
      console.log("Message saved to Firebase");
    }.bind(this)).catch(function (error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  };

  /** Change the interface display
   * @callback 
   * @param new signal
   * @param new message
   */
  MorseCode.prototype.displayMessage = function (signal, message) {
      document.getElementById('signal').innerText = signal;
      document.getElementById('message').innerText = message;  
  };

  /** Checks the table for a letter
   * @callback 
   * @return the letter or symbol to indicate none found
   */
  MorseCode.prototype.checkLetter = function () {
    
    var temp = morseTable[event.signal];
    // logic for brackets
    if(temp == '('){
      if(brackets == 1){
        temp = ')';
        brackets = 0;
      }
      else{
        brackets = 1;
      }
      return temp;
    }
    // $ means no match or end signal
    if(temp == undefined){
        event.signal = 'error';
        return '$';
    }
    else if(temp == '!'){
      event.signal = '';
      event.message = '';
      this.saveMessage('off');
      return '$';
    }
    else{
      return temp;
    }
  };

  /** Sets the time between events
   * @callback 
   * @param event id as set by server, zero will be first signal
   */
  MorseCode.prototype.setDelta = function (id) {
      if (id == 0){
        delta_t = 0;
      } 
      else{
        delta_t = new_time - last - time_out - motionL;
      }
      last = new_time;
      
      if(delta_t > 120000){ // if  2 minutes have passed new message
        delta_t = 0;
        newest = '';
        event.signal = '';
        event.message = '';
      }
  };

  /** The decode algoritm based on time since events
   * Tested in sumulator.js
   * @callback 
   * Precondition: delta_t must be set
   */
  MorseCode.prototype.decode = function () {
    if(event.signal == 'error'){
      event.signal = '';
    }
    
    if(delta_t <= char_gap){ // SIGNAL
          event.signal = event.signal + newest;
    }
    else if(delta_t <= word_gap){ // LETTER
        letter = this.checkLetter(); // check letter
        if(letter != '$'){
          event.message = event.message + letter; // add to message
          event.signal = newest;
        }
    }
    else{ // A WORD
      letter = this.checkLetter(); // check letter
      if(letter != '$'){
        event.message = event.message + letter; // add to message
        event.message = event.message + " "; // add a space
        event.signal = newest;
      }
    }
  };

  /** This function implements the timer, performs display
   * @callback 
   * 
   */
  MorseCode.prototype.startTimer = function () {
    clearInterval(interval);//clear last timer

    var startTime = new Date().getTime();

        function update(){
        var endTime=new Date().getTime();
        var timer = Math.round((endTime-startTime)/1000);
        var msg=document.getElementById("timer");
        msg.innerHTML = timer + "s";
      }
    
    // wait for sensor reset
    setTimeout(function () {
        console.log('STARTING TIMER');
      }, time_out)

    if(timerSwitch){
      interval = setInterval(update,1000);
    }else{
      document.getElementById('timer').innerHTML = '0s';
    }
  };

  /** Checks valid firebase conditions
   * @callback 
   */
  MorseCode.prototype.checkSetup = function () {
    if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
      window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
    } else if (config.storageBucket === '') {
      window.alert('Your Firebase Storage bucket has not been enabled.');
    }
  };

window.onload = function () {
  window.MorseCode = new MorseCode(); 
  window.addEventListener('error', function (e) {
    var error = e.error;
    console.log(error);
  });
};

