//
// Tests the UnamangedHubCollab implementation of CollabInterface.
//
// @todo: test bad callback handlers
// 
// Copyright (c) The Dojo Foundation 2011. All Rights Reserved.
//
/*global define module test raises deepEqual ok equal*/
define([
    'coweb/collab/UnmanagedHubCollab',
    'org/OpenAjax',
    'coweb/topics'
], function(UnmanagedHubCollab, OpenAjax, topics) {
    module('collab', {
        setup: function() {
            this.collab = new UnmanagedHubCollab();
            this.collab.init({id : 'test'});
        },
        teardown: function() {
            this.collab.unsubscribeAll();
            delete this.collab;
        }
    });
    
    test('missing id', 2, function() {
        var collab2 = new UnmanagedHubCollab();
        raises(collab2.init);
        try {
            collab2.init({});
        } catch(e) {
            ok(e);
        }
    });
    
    test('missing init', 5, function() {
        var collab2 = new UnmanagedHubCollab();
        raises(collab2.sendSync);
        raises(collab2.subscribeSync);
        raises(collab2.subscribeStateResponse);
        raises(collab2.sendStateResponse);
        raises(collab2.postService);
    });
    
    test('subscribe ready', 7, function() {
        var target = {a : 'a', b : 'b'},
            cb = function(info) {
                deepEqual(info, target);
            },
            obj = {
                sentinel : 'sentinel',
                cb : function(info) {
                    equal(this.sentinel, 'sentinel');
                    cb(info);
                }
            };
        
        this.collab.subscribeConferenceReady(cb);
        this.collab.subscribeConferenceReady(obj, obj.cb);
        this.collab.subscribeConferenceReady(obj, 'cb');
        raises(this.collab.subscribeConferenceReady, 'bad function');
        try {
            this.collab.subscribeConferenceReady(obj, 'foo');
        } catch(e) {
            ok(true, 'bad function');
        }
        OpenAjax.hub.publish(topics.READY, target);
    });
    
    test('subscribe end', 7, function() {
        var target = true,
            cb = function(connected) {
                equal(connected, target);
            },
            obj = {
                sentinel : 'sentinel',
                cb : function(connected) {
                    equal(this.sentinel, 'sentinel');
                    cb(connected);
                }
            };
        
        this.collab.subscribeConferenceEnd(cb);
        this.collab.subscribeConferenceEnd(obj, obj.cb);
        this.collab.subscribeConferenceEnd(obj, 'cb');
        raises(this.collab.subscribeConferenceEnd, 'bad function');
        try {
            this.collab.subscribeConferenceEnd(obj, 'foo');
        } catch(e) {
            ok(true, 'bad function');
        }
        OpenAjax.hub.publish(topics.END, target);
    });
    
    test('subscribe join', 7, function() {
        var target = {a : 'a', b : 'b'},
            cb = function(info) {
                deepEqual(info, target);
            },
            obj = {
                sentinel : 'sentinel',
                cb : function(info) {
                    equal(this.sentinel, 'sentinel');
                    cb(info);
                }
            };
        
        this.collab.subscribeSiteJoin(cb);
        this.collab.subscribeSiteJoin(obj, obj.cb);
        this.collab.subscribeSiteJoin(obj, 'cb');
        raises(this.collab.subscribeSiteJoin, 'bad function');
        try {
            this.collab.subscribeSiteJoin(obj, 'foo');
        } catch(e) {
            ok(true, 'bad function');
        }
        OpenAjax.hub.publish(topics.SITE_JOIN, target);
    });
    
    test('subscribe leave', 7, function() {
        var target = {a : 'a', b : 'b'},
            cb = function(info) {
                deepEqual(info, target);
            },
            obj = {
                sentinel : 'sentinel',
                cb : function(info) {
                    equal(this.sentinel, 'sentinel');
                    cb(info);
                }
            };
        
        this.collab.subscribeSiteLeave(cb);
        this.collab.subscribeSiteLeave(obj, obj.cb);
        this.collab.subscribeSiteLeave(obj, 'cb');
        raises(this.collab.subscribeSiteLeave, 'bad function');
        try {
            this.collab.subscribeSiteLeave(obj, 'foo');
        } catch(e) {
            ok(true, 'bad function');
        }
        OpenAjax.hub.publish(topics.SITE_LEAVE, target);
    });
        
    test('subscribe sync', 20, function() {
        var name = 'a.b.c',
            target = {
                topic : topics.SYNC+name+'.'+this.collab.id, 
                value : 'b',
                type : 'update',
                position : 1,
                site : 10
            },
            cb = function(topic, val, type, pos, site) {
                equal(topic, target.topic);
                equal(val, target.value);
                equal(type, target.type);
                equal(pos, target.position);
                equal(site, target.site);
            },
            obj = {
                sentinel : 'sentinel',
                cb : function() {
                    equal(this.sentinel, 'sentinel');
                    cb.apply(this, arguments);
                }
            };
        
        this.collab.subscribeSync(name, cb);
        this.collab.subscribeSync(name, obj, obj.cb);
        this.collab.subscribeSync(name, obj, 'cb');
        raises(this.collab.subscribeSync, 'bad sync name');
        try {
            this.collab.subscribeSync(name, obj, 'foo');
        } catch(e) {
            ok(true, 'bad function');
        }
        try {
            this.collab.subscribeSync(null, obj, 'foo');
        } catch(x) {
            ok(true, 'bad sync name');
        }
        OpenAjax.hub.publish(target.topic, target);
    });
    
    test('send sync', 2, function() {
        var tok,
            name = 'a.b.c.d',
            topic = topics.SYNC+name+'.'+this.collab.id,
            target = {
                value : 'b',
                type : 'insert',
                position : 1
            };
        tok = OpenAjax.hub.subscribe(topic, function(topic, params) {
            deepEqual(params, target);
        });
        this.collab.sendSync(name, target.value, target.type, target.position);
        OpenAjax.hub.unsubscribe(tok);
        
        // check defaults
        target.type = 'update';
        target.position = 0;
        tok = OpenAjax.hub.subscribe(topic, function(topic, params) {
            deepEqual(params, target);
        });
        this.collab.sendSync(name, target.value);
    });
    
    test('get sync name', 1, function() {
        var name = 'a.b.c',
            target = {
                topic : topics.SYNC+name+'.'+this.collab.id
            },
            cb = function(topic) {
                equal(this.collab.getSyncNameFromTopic(topic), name);
            };
        
        this.collab.subscribeSync(name, this, cb);
        OpenAjax.hub.publish(target.topic, target);
    });
    
    test('subscribe state request', 7, function() {
        var target = 'token',
            cb = function(token) {
                equal(token, target);
            },
            obj = {
                sentinel : 'sentinel',
                cb : function(token) {
                    equal(this.sentinel, 'sentinel');
                    cb(token);
                }
            };
        
        this.collab.subscribeStateRequest(cb);
        this.collab.subscribeStateRequest(obj, obj.cb);
        this.collab.subscribeStateRequest(obj, 'cb');
        raises(this.collab.subscribeStateRequest, 'bad function');
        try {
            this.collab.subscribeStateRequest(obj, 'foo');
        } catch(e) {
            ok(true, 'bad function');
        }
        OpenAjax.hub.publish(topics.GET_STATE, target);
    });
    
    test('subscribe state response', 5, function() {
        var topic = topics.SET_STATE+this.collab.id,
            target = {
                a : 'a',
                b : 'b'
            },
            cb = function(state) {
                deepEqual(state, target);
            },
            obj = {
                sentinel : 'sentinel',
                cb : function(state) {
                    equal(this.sentinel, 'sentinel');
                    cb(state);
                }
            };
        
        this.collab.subscribeStateResponse(cb);
        this.collab.subscribeStateResponse(obj, obj.cb);
        this.collab.subscribeStateResponse(obj, 'cb');
        OpenAjax.hub.publish(topic, target);
    });
    
    test('send state response', 1, function() {
        
    });
    
    test('subscribe service', 1, function() {
        
    });
    
    test('post to service', 1, function() {
        
    });
    
    test('unsubscribe service', 1, function() {
        
    });
    
    test('unsubscribe', 1, function() {
        
    });
    
    test('unsubscribe all', 1, function() {
        
    });
});