//
// Adds coweb session IDs to the ext field of Bayeux messages. Required by
// the Java server implementation to distinguish sessions.
//
// Copyright (c) The Dojo Foundation 2011. All Rights Reserved.
// Copyright (c) IBM Corporation 2008, 2011. All Rights Reserved.
//
/*global define*/
define(function() {
    /**
     * @constructor
     * @param {String} args.sessionid Unique session ID received from the 
     * server in response to a SessionInterface.prepare
     */
    var CowebExtension = function(args) {
        this._cometd = null;
        this._sessionid = args.sessionid;
    };
    
    /**
     * Called when cometd registers the extension.
     *
     * @param {String} name
     * @param {Object} cometd
     */
    CowebExtension.prototype.registered = function(name, cometd) {
        this._cometd = cometd;
    };

    /**
     * Called when cometd unregisters the extension.
     *
     * @param {String} name
     * @param {Object} cometd
     */    
    CowebExtension.prototype.unregistered = function(name, cometd) {
        this._cometd = null;
    };
    
    /**
     * Called when the cometd passes an outgoing message to the extension.
     * Adds an ext.coweb.sessionid field to the object.
     *
     * @param {Object} msg
     */
    CowebExtension.prototype.outgoing = function(msg) {
        var ext = msg.ext = msg.ext || {};
        var coweb = msg.ext.coweb = msg.ext.coweb || {};
        coweb.sessionid = this._sessionid;
        return msg;
    };

    return CowebExtension;
});
