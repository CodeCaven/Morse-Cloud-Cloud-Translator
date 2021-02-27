
/**
 * All functions used by the server in www
 * @module functions 
 * */
// can add a constructor for the overall object as first function
module.exports = {
    /**
    * This function creates the logger used in the app.
    * @param {string} the directory to store the log file
    * @returns the logger
    */
    setLogger : function(logDir){
  // Create the log directory if it does not exist
        const fs = require('fs');
        var winston = require('winston');
        const env = process.env.NODE_ENV || 'development'; // if the env is not specified, then it is development

        if (!fs.existsSync(logDir)) { 
            fs.mkdirSync(logDir);
        }

        const logger = new (winston.Logger)({
            transports: [
            new (winston.transports.Console)({
            colorize : true,
            // colorize the output
            level
             : 'info' //dynamic level
            }),
            new (winston.transports.File)({
            filename : logDir + "/ results.log", // file name
            level
            : env === 'development' ? 'debug' : 'info' //dynamic level
            })
            ]
        });

        return logger;
    },
    
    /**
    * This function determines and sets the code.
    * @param {object} input javascript object
    * @param {string} input logger
    * @param {number} input length on long motion
    */
    setCode : function(obj, log, long){
        
        if(obj.motionLength<long){
            obj.code = 'S';
            log.info("Detected short motion of Length = " + obj.motionLength + "sec");
        }
        else{
            obj.code = 'L';
            log.info("Detected long motion of Length = " + obj.motionLength + "sec");
        }
    },

    /**
    * This function sets the length of the motion.
    * @param {object} input javascript object
    * @param {number} input sensor time delay
    */
    setLength : function(obj, delay){
        
        obj.motionEnd = Date.now();
        obj.motionLength = ((obj.motionEnd - obj.motionStart)/1000.0) - delay;
        obj.motionLength = obj.motionLength.toFixed(2);

        // fix for negative time events
        if(obj.motionLength < 0)
            obj.motionLength = 0.05; 
    },

    /**
    * This function returns a port value.
    * @param number or string
    */
    normalizePort : function(val){
        var port = parseInt(val, 10);
        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }
        return false;
    }
}