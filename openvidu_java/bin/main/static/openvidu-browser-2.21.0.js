(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],2:[function(require,module,exports){
/* jshint node: true */
'use strict';

var normalice = require('normalice');

/**
  # freeice

  The `freeice` module is a simple way of getting random STUN or TURN server
  for your WebRTC application.  The list of servers (just STUN at this stage)
  were sourced from this [gist](https://gist.github.com/zziuni/3741933).

  ## Example Use

  The following demonstrates how you can use `freeice` with
  [rtc-quickconnect](https://github.com/rtc-io/rtc-quickconnect):

  <<< examples/quickconnect.js

  As the `freeice` module generates ice servers in a list compliant with the
  WebRTC spec you will be able to use it with raw `RTCPeerConnection`
  constructors and other WebRTC libraries.

  ## Hey, don't use my STUN/TURN server!

  If for some reason your free STUN or TURN server ends up in the
  list of servers ([stun](https://github.com/DamonOehlman/freeice/blob/master/stun.json) or
  [turn](https://github.com/DamonOehlman/freeice/blob/master/turn.json))
  that is used in this module, you can feel
  free to open an issue on this repository and those servers will be removed
  within 24 hours (or sooner).  This is the quickest and probably the most
  polite way to have something removed (and provides us some visibility
  if someone opens a pull request requesting that a server is added).

  ## Please add my server!

  If you have a server that you wish to add to the list, that's awesome! I'm
  sure I speak on behalf of a whole pile of WebRTC developers who say thanks.
  To get it into the list, feel free to either open a pull request or if you
  find that process a bit daunting then just create an issue requesting
  the addition of the server (make sure you provide all the details, and if
  you have a Terms of Service then including that in the PR/issue would be
  awesome).

  ## I know of a free server, can I add it?

  Sure, if you do your homework and make sure it is ok to use (I'm currently
  in the process of reviewing the terms of those STUN servers included from
  the original list).  If it's ok to go, then please see the previous entry
  for how to add it.

  ## Current List of Servers

  * current as at the time of last `README.md` file generation

  ### STUN

  <<< stun.json

  ### TURN

  <<< turn.json

**/

var freeice = function(opts) {
  // if a list of servers has been provided, then use it instead of defaults
  var servers = {
    stun: (opts || {}).stun || require('./stun.json'),
    turn: (opts || {}).turn || require('./turn.json')
  };

  var stunCount = (opts || {}).stunCount || 2;
  var turnCount = (opts || {}).turnCount || 0;
  var selected;

  function getServers(type, count) {
    var out = [];
    var input = [].concat(servers[type]);
    var idx;

    while (input.length && out.length < count) {
      idx = (Math.random() * input.length) | 0;
      out = out.concat(input.splice(idx, 1));
    }

    return out.map(function(url) {
        //If it's a not a string, don't try to "normalice" it otherwise using type:url will screw it up
        if ((typeof url !== 'string') && (! (url instanceof String))) {
            return url;
        } else {
            return normalice(type + ':' + url);
        }
    });
  }

  // add stun servers
  selected = [].concat(getServers('stun', stunCount));

  if (turnCount) {
    selected = selected.concat(getServers('turn', turnCount));
  }

  return selected;
};

module.exports = freeice;
},{"./stun.json":3,"./turn.json":4,"normalice":11}],3:[function(require,module,exports){
module.exports=[
  "stun.l.google.com:19302",
  "stun1.l.google.com:19302",
  "stun2.l.google.com:19302",
  "stun3.l.google.com:19302",
  "stun4.l.google.com:19302",
  "stun.ekiga.net",
  "stun.ideasip.com",
  "stun.schlund.de",
  "stun.stunprotocol.org:3478",
  "stun.voiparound.com",
  "stun.voipbuster.com",
  "stun.voipstunt.com",
  "stun.voxgratia.org"
]

},{}],4:[function(require,module,exports){
module.exports=[]

},{}],5:[function(require,module,exports){
var WildEmitter = require('wildemitter');

function getMaxVolume (analyser, fftBins) {
  var maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);

  for(var i=4, ii=fftBins.length; i < ii; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  };

  return maxVolume;
}


var audioContextType;
if (typeof window !== 'undefined') {
  audioContextType = window.AudioContext || window.webkitAudioContext;
}
// use a single audio context due to hardware limits
var audioContext = null;
module.exports = function(stream, options) {
  var harker = new WildEmitter();

  // make it not break in non-supported browsers
  if (!audioContextType) return harker;

  //Config
  var options = options || {},
      smoothing = (options.smoothing || 0.1),
      interval = (options.interval || 50),
      threshold = options.threshold,
      play = options.play,
      history = options.history || 10,
      running = true;

  // Ensure that just a single AudioContext is internally created
  audioContext = options.audioContext || audioContext || new audioContextType();

  var sourceNode, fftBins, analyser;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = smoothing;
  fftBins = new Float32Array(analyser.frequencyBinCount);

  if (stream.jquery) stream = stream[0];
  if (stream instanceof HTMLAudioElement || stream instanceof HTMLVideoElement) {
    //Audio Tag
    sourceNode = audioContext.createMediaElementSource(stream);
    if (typeof play === 'undefined') play = true;
    threshold = threshold || -50;
  } else {
    //WebRTC Stream
    sourceNode = audioContext.createMediaStreamSource(stream);
    threshold = threshold || -50;
  }

  sourceNode.connect(analyser);
  if (play) analyser.connect(audioContext.destination);

  harker.speaking = false;

  harker.suspend = function() {
    return audioContext.suspend();
  }
  harker.resume = function() {
    return audioContext.resume();
  }
  Object.defineProperty(harker, 'state', { get: function() {
    return audioContext.state;
  }});
  audioContext.onstatechange = function() {
    harker.emit('state_change', audioContext.state);
  }

  harker.setThreshold = function(t) {
    threshold = t;
  };

  harker.setInterval = function(i) {
    interval = i;
  };

  harker.stop = function() {
    running = false;
    harker.emit('volume_change', -100, threshold);
    if (harker.speaking) {
      harker.speaking = false;
      harker.emit('stopped_speaking');
    }
    analyser.disconnect();
    sourceNode.disconnect();
  };
  harker.speakingHistory = [];
  for (var i = 0; i < history; i++) {
      harker.speakingHistory.push(0);
  }

  // Poll the analyser node to determine if speaking
  // and emit events if changed
  var looper = function() {
    setTimeout(function() {

      //check if stop has been called
      if(!running) {
        return;
      }

      var currentVolume = getMaxVolume(analyser, fftBins);

      harker.emit('volume_change', currentVolume, threshold);

      var history = 0;
      if (currentVolume > threshold && !harker.speaking) {
        // trigger quickly, short history
        for (var i = harker.speakingHistory.length - 3; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history >= 2) {
          harker.speaking = true;
          harker.emit('speaking');
        }
      } else if (currentVolume < threshold && harker.speaking) {
        for (var i = 0; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history == 0) {
          harker.speaking = false;
          harker.emit('stopped_speaking');
        }
      }
      harker.speakingHistory.shift();
      harker.speakingHistory.push(0 + (currentVolume > threshold));

      looper();
    }, interval);
  };
  looper();

  return harker;
}

},{"wildemitter":37}],6:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],7:[function(require,module,exports){
/* 
 * JSNLog 2.30.0
 * Open source under the MIT License.
 * Copyright 2012-2017 Mattijs Perdeck All rights reserved.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function JL(loggerName) {
    // If name is empty, return the root logger
    if (!loggerName) {
        return JL.__;
    }
    // Implements Array.reduce. JSNLog supports IE8+ and reduce is not supported in that browser.
    // Same interface as the standard reduce, except that 
    if (!Array.prototype.reduce) {
        Array.prototype.reduce = function (callback, initialValue) {
            var previousValue = initialValue;
            for (var i = 0; i < this.length; i++) {
                previousValue = callback(previousValue, this[i], i, this);
            }
            return previousValue;
        };
    }
    var accumulatedLoggerName = '';
    var logger = ('.' + loggerName).split('.').reduce(function (prev, curr, idx, arr) {
        // if loggername is a.b.c, than currentLogger will be set to the loggers
        // root   (prev: JL, curr: '')
        // a      (prev: JL.__, curr: 'a')
        // a.b    (prev: JL.__.__a, curr: 'b')
        // a.b.c  (prev: JL.__.__a.__a.b, curr: 'c')
        // Note that when a new logger name is encountered (such as 'a.b.c'),
        // a new logger object is created and added as a property to the parent ('a.b').
        // The root logger is added as a property of the JL object itself.
        // It is essential that the name of the property containing the child logger
        // contains the full 'path' name of the child logger ('a.b.c') instead of
        // just the bit after the last period ('c').
        // This is because the parent inherits properties from its ancestors.
        // So if the root has a child logger 'c' (stored in a property 'c' of the root logger),
        // then logger 'a.b' has that same property 'c' through inheritance.
        // The names of the logger properties start with __, so the root logger 
        // (which has name ''), has a nice property name '__'.              
        // accumulatedLoggerName evaluates false ('' is falsy) in first iteration when prev is the root logger.
        // accumulatedLoggerName will be the logger name corresponding with the logger in currentLogger.
        // Keep in mind that the currentLogger may not be defined yet, so can't get the name from
        // the currentLogger object itself. 
        if (accumulatedLoggerName) {
            accumulatedLoggerName += '.' + curr;
        }
        else {
            accumulatedLoggerName = curr;
        }
        var currentLogger = prev['__' + accumulatedLoggerName];
        // If the currentLogger (or the actual logger being sought) does not yet exist, 
        // create it now.
        if (currentLogger === undefined) {
            // Set the prototype of the Logger constructor function to the parent of the logger
            // to be created. This way, __proto of the new logger object will point at the parent.
            // When logger.level is evaluated and is not present, the JavaScript runtime will 
            // walk down the prototype chain to find the first ancestor with a level property.
            //
            // Note that prev at this point refers to the parent logger.
            JL.Logger.prototype = prev;
            currentLogger = new JL.Logger(accumulatedLoggerName);
            prev['__' + accumulatedLoggerName] = currentLogger;
        }
        return currentLogger;
    }, JL.__);
    return logger;
}
(function (JL) {
    // Initialise requestId to empty string. If you don't do this and the user
    // does not set it via setOptions, then the JSNLog-RequestId header will
    // have value "undefined", which doesn't look good in a log.
    //
    // Note that you always want to send a requestId as part of log requests,
    // otherwise the server side component doesn't know this is a log request
    // and may create a new request id for the log request, causing confusion
    // in the log.
    JL.requestId = '';
    // Number uniquely identifying every log entry within the request.
    JL.entryId = 0;
    // Allow property injection of these classes, to enable unit testing
    JL._createXMLHttpRequest = function () { return new XMLHttpRequest(); };
    JL._getTime = function () { return (new Date).getTime(); };
    JL._console = console;
    // ----- private variables
    JL._appenderNames = [];
    /**
    Copies the value of a property from one object to the other.
    This is used to copy property values as part of setOption for loggers and appenders.

    Because loggers inherit property values from their parents, it is important never to
    create a property on a logger if the intent is to inherit from the parent.

    Copying rules:
    1) if the from property is undefined (for example, not mentioned in a JSON object), the
       to property is not affected at all.
    2) if the from property is null, the to property is deleted (so the logger will inherit from
       its parent).
    3) Otherwise, the from property is copied to the to property.
    */
    function copyProperty(propertyName, from, to) {
        if (from[propertyName] === undefined) {
            return;
        }
        if (from[propertyName] === null) {
            delete to[propertyName];
            return;
        }
        to[propertyName] = from[propertyName];
    }
    /**
    Returns true if a log should go ahead.
    Does not check level.

    @param filters
        Filters that determine whether a log can go ahead.
    */
    function allow(filters) {
        // If enabled is not null or undefined, then if it is false, then return false
        // Note that undefined==null (!)
        if (!(JL.enabled == null)) {
            if (!JL.enabled) {
                return false;
            }
        }
        // If the regex contains a bug, that will throw an exception.
        // Ignore this, and pass the log item (better too much than too little).
        try {
            if (filters.userAgentRegex) {
                if (!new RegExp(filters.userAgentRegex).test(navigator.userAgent)) {
                    return false;
                }
            }
        }
        catch (e) { }
        try {
            if (filters.ipRegex && JL.clientIP) {
                if (!new RegExp(filters.ipRegex).test(JL.clientIP)) {
                    return false;
                }
            }
        }
        catch (e) { }
        return true;
    }
    /**
    Returns true if a log should go ahead, based on the message.

    @param filters
        Filters that determine whether a log can go ahead.

    @param message
        Message to be logged.
    */
    function allowMessage(filters, message) {
        // If the regex contains a bug, that will throw an exception.
        // Ignore this, and pass the log item (better too much than too little).
        try {
            if (filters.disallow) {
                if (new RegExp(filters.disallow).test(message)) {
                    return false;
                }
            }
        }
        catch (e) { }
        return true;
    }
    // If logObject is a function, the function is evaluated (without parameters)
    // and the result returned.
    // Otherwise, logObject itself is returned.
    function stringifyLogObjectFunction(logObject) {
        if (typeof logObject == "function") {
            if (logObject instanceof RegExp) {
                return logObject.toString();
            }
            else {
                return logObject();
            }
        }
        return logObject;
    }
    var StringifiedLogObject = /** @class */ (function () {
        // * msg - 
        //      if the logObject is a scalar (after possible function evaluation), this is set to
        //      string representing the scalar. Otherwise it is left undefined.
        // * meta -
        //      if the logObject is an object (after possible function evaluation), this is set to
        //      that object. Otherwise it is left undefined.
        // * finalString -
        //      This is set to the string representation of logObject (after possible function evaluation),
        //      regardless of whether it is an scalar or an object. An object is stringified to a JSON string.
        //      Note that you can't call this field "final", because as some point this was a reserved
        //      JavaScript keyword and using final trips up some minifiers.
        function StringifiedLogObject(msg, meta, finalString) {
            this.msg = msg;
            this.meta = meta;
            this.finalString = finalString;
        }
        return StringifiedLogObject;
    }());
    // Takes a logObject, which can be 
    // * a scalar
    // * an object
    // * a parameterless function, which returns the scalar or object to log.
    // Returns a stringifiedLogObject
    function stringifyLogObject(logObject) {
        // Note that this works if logObject is null.
        // typeof null is object.
        // JSON.stringify(null) returns "null".
        var actualLogObject = stringifyLogObjectFunction(logObject);
        var finalString;
        // Note that typeof actualLogObject should not be "function", because that has 
        // been resolved with stringifyLogObjectFunction.
        switch (typeof actualLogObject) {
            case "string":
                return new StringifiedLogObject(actualLogObject, null, actualLogObject);
            case "number":
                finalString = actualLogObject.toString();
                return new StringifiedLogObject(finalString, null, finalString);
            case "boolean":
                finalString = actualLogObject.toString();
                return new StringifiedLogObject(finalString, null, finalString);
            case "undefined":
                return new StringifiedLogObject("undefined", null, "undefined");
            case "object":
                if ((actualLogObject instanceof RegExp) ||
                    (actualLogObject instanceof String) ||
                    (actualLogObject instanceof Number) ||
                    (actualLogObject instanceof Boolean)) {
                    finalString = actualLogObject.toString();
                    return new StringifiedLogObject(finalString, null, finalString);
                }
                else {
                    if (typeof JL.serialize === 'function') {
                        finalString = JL.serialize.call(this, actualLogObject);
                    }
                    else {
                        finalString = JSON.stringify(actualLogObject);
                    }
                    // Set the msg field to "" instead of null. Some Winston transports
                    // assume that the msg field is not null.
                    return new StringifiedLogObject("", actualLogObject, finalString);
                }
            default:
                return new StringifiedLogObject("unknown", null, "unknown");
        }
    }
    function setOptions(options) {
        copyProperty("enabled", options, this);
        copyProperty("maxMessages", options, this);
        copyProperty("defaultAjaxUrl", options, this);
        copyProperty("clientIP", options, this);
        copyProperty("requestId", options, this);
        copyProperty("defaultBeforeSend", options, this);
        copyProperty("serialize", options, this);
        return this;
    }
    JL.setOptions = setOptions;
    function getAllLevel() { return -2147483648; }
    JL.getAllLevel = getAllLevel;
    function getTraceLevel() { return 1000; }
    JL.getTraceLevel = getTraceLevel;
    function getDebugLevel() { return 2000; }
    JL.getDebugLevel = getDebugLevel;
    function getInfoLevel() { return 3000; }
    JL.getInfoLevel = getInfoLevel;
    function getWarnLevel() { return 4000; }
    JL.getWarnLevel = getWarnLevel;
    function getErrorLevel() { return 5000; }
    JL.getErrorLevel = getErrorLevel;
    function getFatalLevel() { return 6000; }
    JL.getFatalLevel = getFatalLevel;
    function getOffLevel() { return 2147483647; }
    JL.getOffLevel = getOffLevel;
    function levelToString(level) {
        if (level <= 1000) {
            return "trace";
        }
        if (level <= 2000) {
            return "debug";
        }
        if (level <= 3000) {
            return "info";
        }
        if (level <= 4000) {
            return "warn";
        }
        if (level <= 5000) {
            return "error";
        }
        return "fatal";
    }
    // ---------------------
    var Exception = /** @class */ (function () {
        // data replaces message. It takes not just strings, but also objects and functions, just like the log function.
        // internally, the string representation is stored in the message property (inherited from Error)
        //
        // inner: inner exception. Can be null or undefined. 
        function Exception(data, inner) {
            this.inner = inner;
            this.name = "JL.Exception";
            this.message = stringifyLogObject(data).finalString;
        }
        return Exception;
    }());
    JL.Exception = Exception;
    // Derive Exception from Error (a Host object), so browsers
    // are more likely to produce a stack trace for it in their console.
    //
    // Note that instanceof against an object created with this constructor
    // will return true in these cases:
    // <object> instanceof JL.Exception);
    // <object> instanceof Error);
    Exception.prototype = new Error();
    // ---------------------
    var LogItem = /** @class */ (function () {
        // l: level
        // m: message
        // n: logger name
        // t (timeStamp) is number of milliseconds since 1 January 1970 00:00:00 UTC
        // u: number uniquely identifying this entry for this request.
        //
        // Keeping the property names really short, because they will be sent in the
        // JSON payload to the server.
        function LogItem(l, m, n, t, u) {
            this.l = l;
            this.m = m;
            this.n = n;
            this.t = t;
            this.u = u;
        }
        return LogItem;
    }());
    JL.LogItem = LogItem;
    function newLogItem(levelNbr, message, loggerName) {
        JL.entryId++;
        return new LogItem(levelNbr, message, loggerName, JL._getTime(), JL.entryId);
    }
    function clearTimer(timer) {
        if (timer.id) {
            clearTimeout(timer.id);
            timer.id = null;
        }
    }
    function setTimer(timer, timeoutMs, callback) {
        var that = this;
        if (!timer.id) {
            timer.id = setTimeout(function () {
                // use call to ensure that the this as used inside sendBatch when it runs is the
                // same this at this point.
                callback.call(that);
            }, timeoutMs);
        }
    }
    var Appender = /** @class */ (function () {
        // sendLogItems takes an array of log items. It will be called when
        // the appender has items to process (such as, send to the server).
        // sendLogItems will call successCallback after the items have been successfully sent.
        //
        // Note that after sendLogItems returns, the appender may truncate
        // the LogItem array, so the function has to copy the content of the array
        // in some fashion (eg. serialize) before returning.
        function Appender(appenderName, sendLogItems) {
            this.appenderName = appenderName;
            this.sendLogItems = sendLogItems;
            this.level = JL.getTraceLevel();
            // set to super high level, so if user increases level, level is unlikely to get 
            // above sendWithBufferLevel
            this.sendWithBufferLevel = 2147483647;
            this.storeInBufferLevel = -2147483648;
            this.bufferSize = 0; // buffering switch off by default
            this.batchSize = 1;
            this.maxBatchSize = 20;
            this.batchTimeout = 2147483647;
            this.sendTimeout = 5000;
            // Holds all log items with levels higher than storeInBufferLevel 
            // but lower than level. These items may never be sent.
            this.buffer = [];
            // Holds all items that we do want to send, until we have a full
            // batch (as determined by batchSize).
            this.batchBuffer = [];
            // Holds the id of the timer implementing the batch timeout.
            // Can be null.
            // This is an object, so it can be passed to a method that updated the timer variable.
            this.batchTimeoutTimer = { id: null };
            // Holds the id of the timer implementing the send timeout.
            // Can be null.
            this.sendTimeoutTimer = { id: null };
            // Number of log items that has been skipped due to batch buffer at max size,
            // since appender creation or since creation of the last "skipped" warning log entry.
            this.nbrLogItemsSkipped = 0;
            // Will be 0 if no log request is outstanding at the moment.
            // Otherwise the number of log items in the outstanding request.
            this.nbrLogItemsBeingSent = 0;
            var emptyNameErrorMessage = "Trying to create an appender without a name or with an empty name";
            // This evaluates to true if appenderName is either null or undefined!
            // Do not check here if the name is "", because that would stop you creating the 
            // default appender.
            if (appenderName == undefined) {
                throw emptyNameErrorMessage;
            }
            if (JL._appenderNames.indexOf(appenderName) != -1) {
                // If user passed in "", that will now have been picked up as a duplicate
                // because default appender also uses "".
                if (!appenderName) {
                    throw emptyNameErrorMessage;
                }
                throw "Multiple appenders use the same name " + appenderName;
            }
            JL._appenderNames.push(appenderName);
        }
        Appender.prototype.addLogItemsToBuffer = function (logItems) {
            // If the batch buffer has reached its maximum limit, 
            // skip the log item and increase the "skipped items" counter.
            if (this.batchBuffer.length >= this.maxBatchSize) {
                this.nbrLogItemsSkipped += logItems.length;
                return;
            }
            // If maxMessages is not null or undefined, then decrease it by the batch size.
            // This can result in a negative maxMessages.
            // Note that undefined==null (!)
            //
            // Note that we may be sending more messages than the maxMessages limit allows,
            // if we stored trace messages. Rationale is the buffer for trace messages is limited,
            // and if we cut off at exactly maxMessages, we'd also loose the high severity message
            // that caused the trace messages to be sent (unless we cater for this specifically, which
            // is more complexity).
            //
            // If there are multiple appenders sending the same message, maxMessage will be decreased
            // by each appender for the same message. This is:
            // 1) only appenders know whether a message will actually be sent (based on storeInBufferLevel),
            //    so the loggers couldn't do this update;
            // 2) if you have multiple appenders hitting the same server, this may be what you want.
            //
            // In most cases there is only 1 appender, so this then doesn't matter.
            if (!(JL.maxMessages == null)) {
                if (JL.maxMessages < 1) {
                    return;
                }
                JL.maxMessages -= logItems.length;
            }
            this.batchBuffer = this.batchBuffer.concat(logItems);
            // If this is the first item in the buffer, set the timer
            // to ensure it will be sent within the timeout period.
            // If it is not the first item, leave the timer alone so to not to 
            // increase the timeout for the first item.
            //
            // To determine if this is the first item, look at the timer variable.
            // Do not look at the buffer length, because we also put items in the buffer
            // via a concat (bypassing this function).
            //
            // The setTimer method only sets the timer if it is not already running.
            var that = this;
            setTimer(this.batchTimeoutTimer, this.batchTimeout, function () {
                that.sendBatch.call(that);
            });
        };
        ;
        Appender.prototype.batchBufferHasOverdueMessages = function () {
            for (var i = 0; i < this.batchBuffer.length; i++) {
                var messageAgeMs = JL._getTime() - this.batchBuffer[i].t;
                if (messageAgeMs > this.batchTimeout) {
                    return true;
                }
            }
            return false;
        };
        // Returns true if no more message will ever be added to the batch buffer,
        // but the batch buffer has messages now - so if there are not enough to make up a batch,
        // and there is no batch timeout, then they will never be sent. This is especially important if 
        // maxMessages was reached while jsnlog.js was retrying sending messages to the server.
        Appender.prototype.batchBufferHasStrandedMessage = function () {
            return (!(JL.maxMessages == null)) && (JL.maxMessages < 1) && (this.batchBuffer.length > 0);
        };
        Appender.prototype.sendBatchIfComplete = function () {
            if ((this.batchBuffer.length >= this.batchSize) ||
                this.batchBufferHasOverdueMessages() ||
                this.batchBufferHasStrandedMessage()) {
                this.sendBatch();
            }
        };
        Appender.prototype.onSendingEnded = function () {
            clearTimer(this.sendTimeoutTimer);
            this.nbrLogItemsBeingSent = 0;
            this.sendBatchIfComplete();
        };
        Appender.prototype.setOptions = function (options) {
            copyProperty("level", options, this);
            copyProperty("ipRegex", options, this);
            copyProperty("userAgentRegex", options, this);
            copyProperty("disallow", options, this);
            copyProperty("sendWithBufferLevel", options, this);
            copyProperty("storeInBufferLevel", options, this);
            copyProperty("bufferSize", options, this);
            copyProperty("batchSize", options, this);
            copyProperty("maxBatchSize", options, this);
            copyProperty("batchTimeout", options, this);
            copyProperty("sendTimeout", options, this);
            if (this.bufferSize < this.buffer.length) {
                this.buffer.length = this.bufferSize;
            }
            if (this.maxBatchSize < this.batchSize) {
                throw new JL.Exception({
                    "message": "maxBatchSize cannot be smaller than batchSize",
                    "maxBatchSize": this.maxBatchSize,
                    "batchSize": this.batchSize
                });
            }
            return this;
        };
        /**
        Called by a logger to log a log item.
        If in response to this call one or more log items need to be processed
        (eg., sent to the server), this method calls this.sendLogItems
        with an array with all items to be processed.

        Note that the name and parameters of this function must match those of the log function of
        a Winston transport object, so that users can use these transports as appenders.
        That is why there are many parameters that are not actually used by this function.

        level - string with the level ("trace", "debug", etc.) Only used by Winston transports.
        msg - human readable message. Undefined if the log item is an object. Only used by Winston transports.
        meta - log object. Always defined, because at least it contains the logger name. Only used by Winston transports.
        callback - function that is called when the log item has been logged. Only used by Winston transports.
        levelNbr - level as a number. Not used by Winston transports.
        message - log item. If the user logged an object, this is the JSON string.  Not used by Winston transports.
        loggerName: name of the logger.  Not used by Winston transports.
        */
        Appender.prototype.log = function (level, msg, meta, callback, levelNbr, message, loggerName) {
            var logItem;
            if (!allow(this)) {
                return;
            }
            if (!allowMessage(this, message)) {
                return;
            }
            if (levelNbr < this.storeInBufferLevel) {
                // Ignore the log item completely
                return;
            }
            logItem = newLogItem(levelNbr, message, loggerName);
            if (levelNbr < this.level) {
                // Store in the hold buffer. Do not send.
                if (this.bufferSize > 0) {
                    this.buffer.push(logItem);
                    // If we exceeded max buffer size, remove oldest item
                    if (this.buffer.length > this.bufferSize) {
                        this.buffer.shift();
                    }
                }
                return;
            }
            // Want to send the item
            this.addLogItemsToBuffer([logItem]);
            if (levelNbr >= this.sendWithBufferLevel) {
                // Want to send the contents of the buffer.
                //
                // Send the buffer AFTER sending the high priority item.
                // If you were to send the high priority item after the buffer,
                // if we're close to maxMessages or maxBatchSize,
                // then the trace messages in the buffer could crowd out the actual high priority item.
                if (this.buffer.length) {
                    this.addLogItemsToBuffer(this.buffer);
                    this.buffer.length = 0;
                }
            }
            this.sendBatchIfComplete();
        };
        ;
        // Processes the batch buffer
        //
        // Make this public, so it can be called from outside the library,
        // when the page is unloaded.
        Appender.prototype.sendBatch = function () {
            // Do not clear the batch timer if you don't go ahead here because
            // a send is already in progress. Otherwise the messages that were stopped from going out
            // may get ignored because the batch timer never went off.
            if (this.nbrLogItemsBeingSent > 0) {
                return;
            }
            clearTimer(this.batchTimeoutTimer);
            if (this.batchBuffer.length == 0) {
                return;
            }
            // Decided at this point to send contents of the buffer
            this.nbrLogItemsBeingSent = this.batchBuffer.length;
            var that = this;
            setTimer(this.sendTimeoutTimer, this.sendTimeout, function () {
                that.onSendingEnded.call(that);
            });
            this.sendLogItems(this.batchBuffer, function () {
                // Log entries have been successfully sent to server
                // Remove the first (nbrLogItemsBeingSent) items in the batch buffer, because they are the ones
                // that were sent.
                that.batchBuffer.splice(0, that.nbrLogItemsBeingSent);
                // If items had to be skipped, add a WARN message
                if (that.nbrLogItemsSkipped > 0) {
                    that.batchBuffer.push(newLogItem(getWarnLevel(), "Lost " + that.nbrLogItemsSkipped + " messages. Either connection with the server was down or logging was disabled via the enabled option. Reduce lost messages by increasing the ajaxAppender option maxBatchSize.", that.appenderName));
                    that.nbrLogItemsSkipped = 0;
                }
                that.onSendingEnded.call(that);
            });
        };
        return Appender;
    }());
    JL.Appender = Appender;
    // ---------------------
    var AjaxAppender = /** @class */ (function (_super) {
        __extends(AjaxAppender, _super);
        function AjaxAppender(appenderName) {
            return _super.call(this, appenderName, AjaxAppender.prototype.sendLogItemsAjax) || this;
        }
        AjaxAppender.prototype.setOptions = function (options) {
            copyProperty("url", options, this);
            copyProperty("beforeSend", options, this);
            _super.prototype.setOptions.call(this, options);
            return this;
        };
        AjaxAppender.prototype.sendLogItemsAjax = function (logItems, successCallback) {
            // JSON.stringify is only supported on IE8+
            // Use try-catch in case we get an exception here.
            //
            // The "r" field is now obsolete. When writing a server side component, 
            // read the HTTP header "JSNLog-RequestId"
            // to get the request id.
            //
            // The .Net server side component
            // now uses the JSNLog-RequestId HTTP Header, because this allows it to
            // detect whether the incoming request has a request id.
            // If the request id were in the json payload, it would have to read the json
            // from the stream, interfering with normal non-logging requests.
            //
            // To see what characters you can use in the HTTP header, visit:
            // http://stackoverflow.com/questions/3561381/custom-http-headers-naming-conventions/3561399#3561399
            //
            // It needs this ability, so users of NLog can set a requestId variable in NLog
            // before the server side component tries to log the client side log message
            // through an NLog logger.
            // Unlike Log4Net, NLog doesn't allow you to register an object whose ToString()
            // is only called when it tries to log something, so the requestId has to be 
            // determined right at the start of request processing.
            try {
                // Do not send logs, if JL.enabled is set to false.
                //
                // Do not call successCallback here. After each timeout, jsnlog will retry sending the message.
                // If jsnlog gets re-enabled, it will then log the number of messages logged.
                // If it doesn't get re-enabled, amount of cpu cycles wasted is minimal.
                if (!allow(this)) {
                    return;
                }
                // If a request is in progress, abort it.
                // Otherwise, it may call the success callback, which will be very confusing.
                // It may also stop the inflight request from resulting in a log at the server.
                if (this.xhr && (this.xhr.readyState != 0) && (this.xhr.readyState != 4)) {
                    this.xhr.abort();
                }
                // Because a react-native XMLHttpRequest cannot be reused it needs to be recreated with each request
                this.xhr = JL._createXMLHttpRequest();
                // Only determine the url right before you send a log request.
                // Do not set the url when constructing the appender.
                //
                // This is because the server side component sets defaultAjaxUrl
                // in a call to setOptions, AFTER the JL object and the default appender
                // have been created. 
                var ajaxUrl = "/jsnlog.logger";
                // This evaluates to true if defaultAjaxUrl is null or undefined
                if (!(JL.defaultAjaxUrl == null)) {
                    ajaxUrl = JL.defaultAjaxUrl;
                }
                if (this.url) {
                    ajaxUrl = this.url;
                }
                this.xhr.open('POST', ajaxUrl);
                this.xhr.setRequestHeader('Content-Type', 'application/json');
                this.xhr.setRequestHeader('JSNLog-RequestId', JL.requestId);
                var that = this;
                this.xhr.onreadystatechange = function () {
                    // On most browsers, if the request fails (eg. internet is gone),
                    // it will set xhr.readyState == 4 and xhr.status != 200 (0 if request could not be sent) immediately.
                    // However, Edge and IE will not change the readyState at all if the internet goes away while waiting
                    // for a response.
                    // Some servers will return a 204 (success, no content) when the JSNLog endpoint
                    // returns the empty response. So check on any code in the 2.. range, not just 200.
                    if ((that.xhr.readyState == 4) && (that.xhr.status >= 200 && that.xhr.status < 300)) {
                        successCallback();
                    }
                };
                var json = {
                    r: JL.requestId,
                    lg: logItems
                };
                // call beforeSend callback
                // first try the callback on the appender
                // then the global defaultBeforeSend callback
                if (typeof this.beforeSend === 'function') {
                    this.beforeSend.call(this, this.xhr, json);
                }
                else if (typeof JL.defaultBeforeSend === 'function') {
                    JL.defaultBeforeSend.call(this, this.xhr, json);
                }
                var finalmsg = JSON.stringify(json);
                this.xhr.send(finalmsg);
            }
            catch (e) { }
        };
        return AjaxAppender;
    }(Appender));
    JL.AjaxAppender = AjaxAppender;
    // ---------------------
    var ConsoleAppender = /** @class */ (function (_super) {
        __extends(ConsoleAppender, _super);
        function ConsoleAppender(appenderName) {
            return _super.call(this, appenderName, ConsoleAppender.prototype.sendLogItemsConsole) || this;
        }
        ConsoleAppender.prototype.clog = function (logEntry) {
            JL._console.log(logEntry);
        };
        ConsoleAppender.prototype.cerror = function (logEntry) {
            if (JL._console.error) {
                JL._console.error(logEntry);
            }
            else {
                this.clog(logEntry);
            }
        };
        ConsoleAppender.prototype.cwarn = function (logEntry) {
            if (JL._console.warn) {
                JL._console.warn(logEntry);
            }
            else {
                this.clog(logEntry);
            }
        };
        ConsoleAppender.prototype.cinfo = function (logEntry) {
            if (JL._console.info) {
                JL._console.info(logEntry);
            }
            else {
                this.clog(logEntry);
            }
        };
        // IE11 has a console.debug function. But its console doesn't have 
        // the option to show/hide debug messages (the same way Chrome and FF do),
        // even though it does have such buttons for Error, Warn, Info.
        //
        // For now, this means that debug messages can not be hidden on IE.
        // Live with this, seeing that it works fine on FF and Chrome, which
        // will be much more popular with developers.
        ConsoleAppender.prototype.cdebug = function (logEntry) {
            if (JL._console.debug) {
                JL._console.debug(logEntry);
            }
            else {
                this.cinfo(logEntry);
            }
        };
        ConsoleAppender.prototype.sendLogItemsConsole = function (logItems, successCallback) {
            try {
                // Do not send logs, if JL.enabled is set to false
                //
                // Do not call successCallback here. After each timeout, jsnlog will retry sending the message.
                // If jsnlog gets re-enabled, it will then log the number of messages logged.
                // If it doesn't get re-enabled, amount of cpu cycles wasted is minimal.
                if (!allow(this)) {
                    return;
                }
                if (!JL._console) {
                    return;
                }
                var i;
                for (i = 0; i < logItems.length; ++i) {
                    var li = logItems[i];
                    var msg = li.n + ": " + li.m;
                    // Only log the timestamp if we're on the server
                    // (window is undefined). On the browser, the user
                    // sees the log entry probably immediately, so in that case
                    // the timestamp is clutter.
                    if (typeof window === 'undefined') {
                        msg = new Date(li.t) + " | " + msg;
                    }
                    if (li.l <= JL.getDebugLevel()) {
                        this.cdebug(msg);
                    }
                    else if (li.l <= JL.getInfoLevel()) {
                        this.cinfo(msg);
                    }
                    else if (li.l <= JL.getWarnLevel()) {
                        this.cwarn(msg);
                    }
                    else {
                        this.cerror(msg);
                    }
                }
            }
            catch (e) {
            }
            successCallback();
        };
        return ConsoleAppender;
    }(Appender));
    JL.ConsoleAppender = ConsoleAppender;
    // --------------------
    var Logger = /** @class */ (function () {
        function Logger(loggerName) {
            this.loggerName = loggerName;
            // Create seenRexes, otherwise this logger will use the seenRexes
            // of its parent via the prototype chain.
            this.seenRegexes = [];
        }
        Logger.prototype.setOptions = function (options) {
            copyProperty("level", options, this);
            copyProperty("userAgentRegex", options, this);
            copyProperty("disallow", options, this);
            copyProperty("ipRegex", options, this);
            copyProperty("appenders", options, this);
            copyProperty("onceOnly", options, this);
            // Reset seenRegexes, in case onceOnly has been changed.
            this.seenRegexes = [];
            return this;
        };
        // Turns an exception into an object that can be sent to the server.
        Logger.prototype.buildExceptionObject = function (e) {
            var excObject = {};
            if (e.stack) {
                excObject.stack = e.stack;
            }
            else {
                excObject.e = e;
            }
            if (e.message) {
                excObject.message = e.message;
            }
            if (e.name) {
                excObject.name = e.name;
            }
            if (e.data) {
                excObject.data = e.data;
            }
            if (e.inner) {
                excObject.inner = this.buildExceptionObject(e.inner);
            }
            return excObject;
        };
        // Logs a log item.
        // Parameter e contains an exception (or null or undefined).
        //
        // Reason that processing exceptions is done at this low level is that
        // 1) no need to spend the cpu cycles if the logger is switched off
        // 2) fatalException takes both a logObject and an exception, and the logObject
        //    may be a function that should only be executed if the logger is switched on.
        //
        // If an exception is passed in, the contents of logObject is attached to the exception
        // object in a new property logData.
        // The resulting exception object is than worked into a message to the server.
        //
        // If there is no exception, logObject itself is worked into the message to the server.
        Logger.prototype.log = function (level, logObject, e) {
            var i = 0;
            var compositeMessage;
            var excObject;
            // If we can't find any appenders, do nothing
            if (!this.appenders) {
                return this;
            }
            if (((level >= this.level)) && allow(this)) {
                if (e) {
                    excObject = this.buildExceptionObject(e);
                    excObject.logData = stringifyLogObjectFunction(logObject);
                }
                else {
                    excObject = logObject;
                }
                compositeMessage = stringifyLogObject(excObject);
                if (allowMessage(this, compositeMessage.finalString)) {
                    // See whether message is a duplicate
                    if (this.onceOnly) {
                        i = this.onceOnly.length - 1;
                        while (i >= 0) {
                            if (new RegExp(this.onceOnly[i]).test(compositeMessage.finalString)) {
                                if (this.seenRegexes[i]) {
                                    return this;
                                }
                                this.seenRegexes[i] = true;
                            }
                            i--;
                        }
                    }
                    // Pass message to all appenders
                    // Note that these appenders could be Winston transports
                    // https://github.com/flatiron/winston
                    compositeMessage.meta = compositeMessage.meta || {};
                    // Note that if the user is logging an object, compositeMessage.meta will hold a reference to that object.
                    // Do not add fields to compositeMessage.meta, otherwise the user's object will get that field out of the blue.
                    i = this.appenders.length - 1;
                    while (i >= 0) {
                        this.appenders[i].log(levelToString(level), compositeMessage.msg, compositeMessage.meta, function () { }, level, compositeMessage.finalString, this.loggerName);
                        i--;
                    }
                }
            }
            return this;
        };
        Logger.prototype.trace = function (logObject) { return this.log(getTraceLevel(), logObject); };
        Logger.prototype.debug = function (logObject) { return this.log(getDebugLevel(), logObject); };
        Logger.prototype.info = function (logObject) { return this.log(getInfoLevel(), logObject); };
        Logger.prototype.warn = function (logObject) { return this.log(getWarnLevel(), logObject); };
        Logger.prototype.error = function (logObject) { return this.log(getErrorLevel(), logObject); };
        Logger.prototype.fatal = function (logObject) { return this.log(getFatalLevel(), logObject); };
        Logger.prototype.fatalException = function (logObject, e) { return this.log(getFatalLevel(), logObject, e); };
        return Logger;
    }());
    JL.Logger = Logger;
    function createAjaxAppender(appenderName) {
        return new AjaxAppender(appenderName);
    }
    JL.createAjaxAppender = createAjaxAppender;
    function createConsoleAppender(appenderName) {
        return new ConsoleAppender(appenderName);
    }
    JL.createConsoleAppender = createConsoleAppender;
    // -----------------------
    // In the browser, the default appender is the AjaxAppender.
    // Under nodejs (where there is no "window"), use the ConsoleAppender instead.
    // 
    // Do NOT create an AjaxAppender object if you are not on a browser (that is, window is not defined).
    // That would try to create an XmlHttpRequest object, which will crash outside a browser.
    var defaultAppender;
    if (typeof window !== 'undefined') {
        defaultAppender = new AjaxAppender("");
    }
    else {
        defaultAppender = new ConsoleAppender("");
    }
    // Create root logger
    //
    // Note that this is the parent of all other loggers.
    // Logger "x" will be stored at
    // JL.__.x
    // Logger "x.y" at
    // JL.__.x.y
    JL.__ = new JL.Logger("");
    JL.__.setOptions({
        level: JL.getDebugLevel(),
        appenders: [defaultAppender]
    });
})(JL || (JL = {}));
if (typeof exports !== 'undefined') {
    // Allows SystemJs to import jsnlog.js. See
    // https://github.com/mperdeck/jsnlog.js/issues/56
    exports.__esModule = true;
    exports.JL = JL;
}
// Support AMD module format
var define;
if (typeof define == 'function' && define.amd) {
    define('jsnlog', [], function () {
        return JL;
    });
}
// If the __jsnlog_configure global function has been
// created, call it now. This allows you to create a global function
// setting logger options etc. inline in the page before jsnlog.js
// has been loaded.
if (typeof __jsnlog_configure == 'function') {
    __jsnlog_configure(JL);
}
// Create onerror handler to log uncaught exceptions to the server side log, but only if there 
// is no such handler already.
// Must use "typeof window" here, because in NodeJs, window is not defined at all, so cannot refer to window in any way.
if (typeof window !== 'undefined' && !window.onerror) {
    window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
        // Send object with all data to server side log, using severity fatal, 
        // from logger "onerrorLogger"
        //
        // Use errorMsg.message if available, so Angular 4 template errors will be logged.
        // See https://github.com/mperdeck/jsnlog.js/pull/68
        JL("onerrorLogger").fatalException({
            "msg": "Uncaught Exception",
            "errorMsg": errorMsg ? (errorMsg.message || errorMsg) : '',
            "url": url,
            "line number": lineNumber, "column": column
        }, errorObj);
        // Tell browser to run its own error handler as well   
        return false;
    };
}
// Deal with unhandled exceptions thrown in promises
if (typeof window !== 'undefined' && !window.onunhandledrejection) {
    window.onunhandledrejection = function (event) {
        // Send object with all data to server side log, using severity fatal, 
        // from logger "onerrorLogger".
        // Need to check both event.reason.message and event.message,
        // because SystemJs wraps exceptions and throws a new object which doesn't have a reason property.
        // See https://github.com/systemjs/systemjs/issues/1309
        JL("onerrorLogger").fatalException({
            "msg": "unhandledrejection",
            "errorMsg": event.reason ? event.reason.message : event.message || null
        }, event.reason);
    };
}

},{}],8:[function(require,module,exports){
'use strict';

/**
 * @param typeMap [Object] Map of MIME type -> Array[extensions]
 * @param ...
 */
function Mime() {
  this._types = Object.create(null);
  this._extensions = Object.create(null);

  for (let i = 0; i < arguments.length; i++) {
    this.define(arguments[i]);
  }

  this.define = this.define.bind(this);
  this.getType = this.getType.bind(this);
  this.getExtension = this.getExtension.bind(this);
}

/**
 * Define mimetype -> extension mappings.  Each key is a mime-type that maps
 * to an array of extensions associated with the type.  The first extension is
 * used as the default extension for the type.
 *
 * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
 *
 * If a type declares an extension that has already been defined, an error will
 * be thrown.  To suppress this error and force the extension to be associated
 * with the new type, pass `force`=true.  Alternatively, you may prefix the
 * extension with "*" to map the type to extension, without mapping the
 * extension to the type.
 *
 * e.g. mime.define({'audio/wav', ['wav']}, {'audio/x-wav', ['*wav']});
 *
 *
 * @param map (Object) type definitions
 * @param force (Boolean) if true, force overriding of existing definitions
 */
Mime.prototype.define = function(typeMap, force) {
  for (let type in typeMap) {
    let extensions = typeMap[type].map(function(t) {
      return t.toLowerCase();
    });
    type = type.toLowerCase();

    for (let i = 0; i < extensions.length; i++) {
      const ext = extensions[i];

      // '*' prefix = not the preferred type for this extension.  So fixup the
      // extension, and skip it.
      if (ext[0] === '*') {
        continue;
      }

      if (!force && (ext in this._types)) {
        throw new Error(
          'Attempt to change mapping for "' + ext +
          '" extension from "' + this._types[ext] + '" to "' + type +
          '". Pass `force=true` to allow this, otherwise remove "' + ext +
          '" from the list of extensions for "' + type + '".'
        );
      }

      this._types[ext] = type;
    }

    // Use first extension as default
    if (force || !this._extensions[type]) {
      const ext = extensions[0];
      this._extensions[type] = (ext[0] !== '*') ? ext : ext.substr(1);
    }
  }
};

/**
 * Lookup a mime type based on extension
 */
Mime.prototype.getType = function(path) {
  path = String(path);
  let last = path.replace(/^.*[/\\]/, '').toLowerCase();
  let ext = last.replace(/^.*\./, '').toLowerCase();

  let hasPath = last.length < path.length;
  let hasDot = ext.length < last.length - 1;

  return (hasDot || !hasPath) && this._types[ext] || null;
};

/**
 * Return file extension associated with a mime type
 */
Mime.prototype.getExtension = function(type) {
  type = /^\s*([^;\s]*)/.test(type) && RegExp.$1;
  return type && this._extensions[type.toLowerCase()] || null;
};

module.exports = Mime;

},{}],9:[function(require,module,exports){
'use strict';

let Mime = require('./Mime');
module.exports = new Mime(require('./types/standard'));

},{"./Mime":8,"./types/standard":10}],10:[function(require,module,exports){
module.exports = {"application/andrew-inset":["ez"],"application/applixware":["aw"],"application/atom+xml":["atom"],"application/atomcat+xml":["atomcat"],"application/atomdeleted+xml":["atomdeleted"],"application/atomsvc+xml":["atomsvc"],"application/atsc-dwd+xml":["dwd"],"application/atsc-held+xml":["held"],"application/atsc-rsat+xml":["rsat"],"application/bdoc":["bdoc"],"application/calendar+xml":["xcs"],"application/ccxml+xml":["ccxml"],"application/cdfx+xml":["cdfx"],"application/cdmi-capability":["cdmia"],"application/cdmi-container":["cdmic"],"application/cdmi-domain":["cdmid"],"application/cdmi-object":["cdmio"],"application/cdmi-queue":["cdmiq"],"application/cu-seeme":["cu"],"application/dash+xml":["mpd"],"application/davmount+xml":["davmount"],"application/docbook+xml":["dbk"],"application/dssc+der":["dssc"],"application/dssc+xml":["xdssc"],"application/ecmascript":["es","ecma"],"application/emma+xml":["emma"],"application/emotionml+xml":["emotionml"],"application/epub+zip":["epub"],"application/exi":["exi"],"application/express":["exp"],"application/fdt+xml":["fdt"],"application/font-tdpfr":["pfr"],"application/geo+json":["geojson"],"application/gml+xml":["gml"],"application/gpx+xml":["gpx"],"application/gxf":["gxf"],"application/gzip":["gz"],"application/hjson":["hjson"],"application/hyperstudio":["stk"],"application/inkml+xml":["ink","inkml"],"application/ipfix":["ipfix"],"application/its+xml":["its"],"application/java-archive":["jar","war","ear"],"application/java-serialized-object":["ser"],"application/java-vm":["class"],"application/javascript":["js","mjs"],"application/json":["json","map"],"application/json5":["json5"],"application/jsonml+json":["jsonml"],"application/ld+json":["jsonld"],"application/lgr+xml":["lgr"],"application/lost+xml":["lostxml"],"application/mac-binhex40":["hqx"],"application/mac-compactpro":["cpt"],"application/mads+xml":["mads"],"application/manifest+json":["webmanifest"],"application/marc":["mrc"],"application/marcxml+xml":["mrcx"],"application/mathematica":["ma","nb","mb"],"application/mathml+xml":["mathml"],"application/mbox":["mbox"],"application/mediaservercontrol+xml":["mscml"],"application/metalink+xml":["metalink"],"application/metalink4+xml":["meta4"],"application/mets+xml":["mets"],"application/mmt-aei+xml":["maei"],"application/mmt-usd+xml":["musd"],"application/mods+xml":["mods"],"application/mp21":["m21","mp21"],"application/mp4":["mp4s","m4p"],"application/msword":["doc","dot"],"application/mxf":["mxf"],"application/n-quads":["nq"],"application/n-triples":["nt"],"application/node":["cjs"],"application/octet-stream":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"],"application/oda":["oda"],"application/oebps-package+xml":["opf"],"application/ogg":["ogx"],"application/omdoc+xml":["omdoc"],"application/onenote":["onetoc","onetoc2","onetmp","onepkg"],"application/oxps":["oxps"],"application/p2p-overlay+xml":["relo"],"application/patch-ops-error+xml":["xer"],"application/pdf":["pdf"],"application/pgp-encrypted":["pgp"],"application/pgp-signature":["asc","sig"],"application/pics-rules":["prf"],"application/pkcs10":["p10"],"application/pkcs7-mime":["p7m","p7c"],"application/pkcs7-signature":["p7s"],"application/pkcs8":["p8"],"application/pkix-attr-cert":["ac"],"application/pkix-cert":["cer"],"application/pkix-crl":["crl"],"application/pkix-pkipath":["pkipath"],"application/pkixcmp":["pki"],"application/pls+xml":["pls"],"application/postscript":["ai","eps","ps"],"application/provenance+xml":["provx"],"application/pskc+xml":["pskcxml"],"application/raml+yaml":["raml"],"application/rdf+xml":["rdf","owl"],"application/reginfo+xml":["rif"],"application/relax-ng-compact-syntax":["rnc"],"application/resource-lists+xml":["rl"],"application/resource-lists-diff+xml":["rld"],"application/rls-services+xml":["rs"],"application/route-apd+xml":["rapd"],"application/route-s-tsid+xml":["sls"],"application/route-usd+xml":["rusd"],"application/rpki-ghostbusters":["gbr"],"application/rpki-manifest":["mft"],"application/rpki-roa":["roa"],"application/rsd+xml":["rsd"],"application/rss+xml":["rss"],"application/rtf":["rtf"],"application/sbml+xml":["sbml"],"application/scvp-cv-request":["scq"],"application/scvp-cv-response":["scs"],"application/scvp-vp-request":["spq"],"application/scvp-vp-response":["spp"],"application/sdp":["sdp"],"application/senml+xml":["senmlx"],"application/sensml+xml":["sensmlx"],"application/set-payment-initiation":["setpay"],"application/set-registration-initiation":["setreg"],"application/shf+xml":["shf"],"application/sieve":["siv","sieve"],"application/smil+xml":["smi","smil"],"application/sparql-query":["rq"],"application/sparql-results+xml":["srx"],"application/srgs":["gram"],"application/srgs+xml":["grxml"],"application/sru+xml":["sru"],"application/ssdl+xml":["ssdl"],"application/ssml+xml":["ssml"],"application/swid+xml":["swidtag"],"application/tei+xml":["tei","teicorpus"],"application/thraud+xml":["tfi"],"application/timestamped-data":["tsd"],"application/toml":["toml"],"application/trig":["trig"],"application/ttml+xml":["ttml"],"application/ubjson":["ubj"],"application/urc-ressheet+xml":["rsheet"],"application/urc-targetdesc+xml":["td"],"application/voicexml+xml":["vxml"],"application/wasm":["wasm"],"application/widget":["wgt"],"application/winhlp":["hlp"],"application/wsdl+xml":["wsdl"],"application/wspolicy+xml":["wspolicy"],"application/xaml+xml":["xaml"],"application/xcap-att+xml":["xav"],"application/xcap-caps+xml":["xca"],"application/xcap-diff+xml":["xdf"],"application/xcap-el+xml":["xel"],"application/xcap-ns+xml":["xns"],"application/xenc+xml":["xenc"],"application/xhtml+xml":["xhtml","xht"],"application/xliff+xml":["xlf"],"application/xml":["xml","xsl","xsd","rng"],"application/xml-dtd":["dtd"],"application/xop+xml":["xop"],"application/xproc+xml":["xpl"],"application/xslt+xml":["*xsl","xslt"],"application/xspf+xml":["xspf"],"application/xv+xml":["mxml","xhvml","xvml","xvm"],"application/yang":["yang"],"application/yin+xml":["yin"],"application/zip":["zip"],"audio/3gpp":["*3gpp"],"audio/adpcm":["adp"],"audio/amr":["amr"],"audio/basic":["au","snd"],"audio/midi":["mid","midi","kar","rmi"],"audio/mobile-xmf":["mxmf"],"audio/mp3":["*mp3"],"audio/mp4":["m4a","mp4a"],"audio/mpeg":["mpga","mp2","mp2a","mp3","m2a","m3a"],"audio/ogg":["oga","ogg","spx","opus"],"audio/s3m":["s3m"],"audio/silk":["sil"],"audio/wav":["wav"],"audio/wave":["*wav"],"audio/webm":["weba"],"audio/xm":["xm"],"font/collection":["ttc"],"font/otf":["otf"],"font/ttf":["ttf"],"font/woff":["woff"],"font/woff2":["woff2"],"image/aces":["exr"],"image/apng":["apng"],"image/avif":["avif"],"image/bmp":["bmp"],"image/cgm":["cgm"],"image/dicom-rle":["drle"],"image/emf":["emf"],"image/fits":["fits"],"image/g3fax":["g3"],"image/gif":["gif"],"image/heic":["heic"],"image/heic-sequence":["heics"],"image/heif":["heif"],"image/heif-sequence":["heifs"],"image/hej2k":["hej2"],"image/hsj2":["hsj2"],"image/ief":["ief"],"image/jls":["jls"],"image/jp2":["jp2","jpg2"],"image/jpeg":["jpeg","jpg","jpe"],"image/jph":["jph"],"image/jphc":["jhc"],"image/jpm":["jpm"],"image/jpx":["jpx","jpf"],"image/jxr":["jxr"],"image/jxra":["jxra"],"image/jxrs":["jxrs"],"image/jxs":["jxs"],"image/jxsc":["jxsc"],"image/jxsi":["jxsi"],"image/jxss":["jxss"],"image/ktx":["ktx"],"image/ktx2":["ktx2"],"image/png":["png"],"image/sgi":["sgi"],"image/svg+xml":["svg","svgz"],"image/t38":["t38"],"image/tiff":["tif","tiff"],"image/tiff-fx":["tfx"],"image/webp":["webp"],"image/wmf":["wmf"],"message/disposition-notification":["disposition-notification"],"message/global":["u8msg"],"message/global-delivery-status":["u8dsn"],"message/global-disposition-notification":["u8mdn"],"message/global-headers":["u8hdr"],"message/rfc822":["eml","mime"],"model/3mf":["3mf"],"model/gltf+json":["gltf"],"model/gltf-binary":["glb"],"model/iges":["igs","iges"],"model/mesh":["msh","mesh","silo"],"model/mtl":["mtl"],"model/obj":["obj"],"model/step+xml":["stpx"],"model/step+zip":["stpz"],"model/step-xml+zip":["stpxz"],"model/stl":["stl"],"model/vrml":["wrl","vrml"],"model/x3d+binary":["*x3db","x3dbz"],"model/x3d+fastinfoset":["x3db"],"model/x3d+vrml":["*x3dv","x3dvz"],"model/x3d+xml":["x3d","x3dz"],"model/x3d-vrml":["x3dv"],"text/cache-manifest":["appcache","manifest"],"text/calendar":["ics","ifb"],"text/coffeescript":["coffee","litcoffee"],"text/css":["css"],"text/csv":["csv"],"text/html":["html","htm","shtml"],"text/jade":["jade"],"text/jsx":["jsx"],"text/less":["less"],"text/markdown":["markdown","md"],"text/mathml":["mml"],"text/mdx":["mdx"],"text/n3":["n3"],"text/plain":["txt","text","conf","def","list","log","in","ini"],"text/richtext":["rtx"],"text/rtf":["*rtf"],"text/sgml":["sgml","sgm"],"text/shex":["shex"],"text/slim":["slim","slm"],"text/spdx":["spdx"],"text/stylus":["stylus","styl"],"text/tab-separated-values":["tsv"],"text/troff":["t","tr","roff","man","me","ms"],"text/turtle":["ttl"],"text/uri-list":["uri","uris","urls"],"text/vcard":["vcard"],"text/vtt":["vtt"],"text/xml":["*xml"],"text/yaml":["yaml","yml"],"video/3gpp":["3gp","3gpp"],"video/3gpp2":["3g2"],"video/h261":["h261"],"video/h263":["h263"],"video/h264":["h264"],"video/iso.segment":["m4s"],"video/jpeg":["jpgv"],"video/jpm":["*jpm","jpgm"],"video/mj2":["mj2","mjp2"],"video/mp2t":["ts"],"video/mp4":["mp4","mp4v","mpg4"],"video/mpeg":["mpeg","mpg","mpe","m1v","m2v"],"video/ogg":["ogv"],"video/quicktime":["qt","mov"],"video/webm":["webm"]};
},{}],11:[function(require,module,exports){
/**
  # normalice

  Normalize an ice server configuration object (or plain old string) into a format
  that is usable in all browsers supporting WebRTC.  Primarily this module is designed
  to help with the transition of the `url` attribute of the configuration object to
  the `urls` attribute.

  ## Example Usage

  <<< examples/simple.js

**/

var protocols = [
  'stun:',
  'turn:'
];

module.exports = function(input) {
  var url = (input || {}).url || input;
  var protocol;
  var parts;
  var output = {};

  // if we don't have a string url, then allow the input to passthrough
  if (typeof url != 'string' && (! (url instanceof String))) {
    return input;
  }

  // trim the url string, and convert to an array
  url = url.trim();

  // if the protocol is not known, then passthrough
  protocol = protocols[protocols.indexOf(url.slice(0, 5))];
  if (! protocol) {
    return input;
  }

  // now let's attack the remaining url parts
  url = url.slice(5);
  parts = url.split('@');

  output.username = input.username;
  output.credential = input.credential;
  // if we have an authentication part, then set the credentials
  if (parts.length > 1) {
    url = parts[1];
    parts = parts[0].split(':');

    // add the output credential and username
    output.username = parts[0];
    output.credential = (input || {}).credential || parts[1] || '';
  }

  output.url = protocol + url;
  output.urls = [ output.url ];

  return output;
};

},{}],12:[function(require,module,exports){
(function (global){(function (){
/*!
 * Platform.js v1.3.6
 * Copyright 2014-2020 Benjamin Tan
 * Copyright 2011-2013 John-David Dalton
 * Available under MIT license
 */
;(function() {
  'use strict';

  /** Used to determine if values are of the language type `Object`. */
  var objectTypes = {
    'function': true,
    'object': true
  };

  /** Used as a reference to the global object. */
  var root = (objectTypes[typeof window] && window) || this;

  /** Backup possible global object. */
  var oldRoot = root;

  /** Detect free variable `exports`. */
  var freeExports = objectTypes[typeof exports] && exports;

  /** Detect free variable `module`. */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
    root = freeGlobal;
  }

  /**
   * Used as the maximum length of an array-like object.
   * See the [ES6 spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
   * for more details.
   */
  var maxSafeInteger = Math.pow(2, 53) - 1;

  /** Regular expression to detect Opera. */
  var reOpera = /\bOpera/;

  /** Possible global object. */
  var thisBinding = this;

  /** Used for native method references. */
  var objectProto = Object.prototype;

  /** Used to check for own properties of an object. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /** Used to resolve the internal `[[Class]]` of values. */
  var toString = objectProto.toString;

  /*--------------------------------------------------------------------------*/

  /**
   * Capitalizes a string value.
   *
   * @private
   * @param {string} string The string to capitalize.
   * @returns {string} The capitalized string.
   */
  function capitalize(string) {
    string = String(string);
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * A utility function to clean up the OS name.
   *
   * @private
   * @param {string} os The OS name to clean up.
   * @param {string} [pattern] A `RegExp` pattern matching the OS name.
   * @param {string} [label] A label for the OS.
   */
  function cleanupOS(os, pattern, label) {
    // Platform tokens are defined at:
    // http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
    // http://web.archive.org/web/20081122053950/http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
    var data = {
      '10.0': '10',
      '6.4':  '10 Technical Preview',
      '6.3':  '8.1',
      '6.2':  '8',
      '6.1':  'Server 2008 R2 / 7',
      '6.0':  'Server 2008 / Vista',
      '5.2':  'Server 2003 / XP 64-bit',
      '5.1':  'XP',
      '5.01': '2000 SP1',
      '5.0':  '2000',
      '4.0':  'NT',
      '4.90': 'ME'
    };
    // Detect Windows version from platform tokens.
    if (pattern && label && /^Win/i.test(os) && !/^Windows Phone /i.test(os) &&
        (data = data[/[\d.]+$/.exec(os)])) {
      os = 'Windows ' + data;
    }
    // Correct character case and cleanup string.
    os = String(os);

    if (pattern && label) {
      os = os.replace(RegExp(pattern, 'i'), label);
    }

    os = format(
      os.replace(/ ce$/i, ' CE')
        .replace(/\bhpw/i, 'web')
        .replace(/\bMacintosh\b/, 'Mac OS')
        .replace(/_PowerPC\b/i, ' OS')
        .replace(/\b(OS X) [^ \d]+/i, '$1')
        .replace(/\bMac (OS X)\b/, '$1')
        .replace(/\/(\d)/, ' $1')
        .replace(/_/g, '.')
        .replace(/(?: BePC|[ .]*fc[ \d.]+)$/i, '')
        .replace(/\bx86\.64\b/gi, 'x86_64')
        .replace(/\b(Windows Phone) OS\b/, '$1')
        .replace(/\b(Chrome OS \w+) [\d.]+\b/, '$1')
        .split(' on ')[0]
    );

    return os;
  }

  /**
   * An iteration utility for arrays and objects.
   *
   * @private
   * @param {Array|Object} object The object to iterate over.
   * @param {Function} callback The function called per iteration.
   */
  function each(object, callback) {
    var index = -1,
        length = object ? object.length : 0;

    if (typeof length == 'number' && length > -1 && length <= maxSafeInteger) {
      while (++index < length) {
        callback(object[index], index, object);
      }
    } else {
      forOwn(object, callback);
    }
  }

  /**
   * Trim and conditionally capitalize string values.
   *
   * @private
   * @param {string} string The string to format.
   * @returns {string} The formatted string.
   */
  function format(string) {
    string = trim(string);
    return /^(?:webOS|i(?:OS|P))/.test(string)
      ? string
      : capitalize(string);
  }

  /**
   * Iterates over an object's own properties, executing the `callback` for each.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} callback The function executed per own property.
   */
  function forOwn(object, callback) {
    for (var key in object) {
      if (hasOwnProperty.call(object, key)) {
        callback(object[key], key, object);
      }
    }
  }

  /**
   * Gets the internal `[[Class]]` of a value.
   *
   * @private
   * @param {*} value The value.
   * @returns {string} The `[[Class]]`.
   */
  function getClassOf(value) {
    return value == null
      ? capitalize(value)
      : toString.call(value).slice(8, -1);
  }

  /**
   * Host objects can return type values that are different from their actual
   * data type. The objects we are concerned with usually return non-primitive
   * types of "object", "function", or "unknown".
   *
   * @private
   * @param {*} object The owner of the property.
   * @param {string} property The property to check.
   * @returns {boolean} Returns `true` if the property value is a non-primitive, else `false`.
   */
  function isHostType(object, property) {
    var type = object != null ? typeof object[property] : 'number';
    return !/^(?:boolean|number|string|undefined)$/.test(type) &&
      (type == 'object' ? !!object[property] : true);
  }

  /**
   * Prepares a string for use in a `RegExp` by making hyphens and spaces optional.
   *
   * @private
   * @param {string} string The string to qualify.
   * @returns {string} The qualified string.
   */
  function qualify(string) {
    return String(string).replace(/([ -])(?!$)/g, '$1?');
  }

  /**
   * A bare-bones `Array#reduce` like utility function.
   *
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @returns {*} The accumulated result.
   */
  function reduce(array, callback) {
    var accumulator = null;
    each(array, function(value, index) {
      accumulator = callback(accumulator, value, index, array);
    });
    return accumulator;
  }

  /**
   * Removes leading and trailing whitespace from a string.
   *
   * @private
   * @param {string} string The string to trim.
   * @returns {string} The trimmed string.
   */
  function trim(string) {
    return String(string).replace(/^ +| +$/g, '');
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a new platform object.
   *
   * @memberOf platform
   * @param {Object|string} [ua=navigator.userAgent] The user agent string or
   *  context object.
   * @returns {Object} A platform object.
   */
  function parse(ua) {

    /** The environment context object. */
    var context = root;

    /** Used to flag when a custom context is provided. */
    var isCustomContext = ua && typeof ua == 'object' && getClassOf(ua) != 'String';

    // Juggle arguments.
    if (isCustomContext) {
      context = ua;
      ua = null;
    }

    /** Browser navigator object. */
    var nav = context.navigator || {};

    /** Browser user agent string. */
    var userAgent = nav.userAgent || '';

    ua || (ua = userAgent);

    /** Used to flag when `thisBinding` is the [ModuleScope]. */
    var isModuleScope = isCustomContext || thisBinding == oldRoot;

    /** Used to detect if browser is like Chrome. */
    var likeChrome = isCustomContext
      ? !!nav.likeChrome
      : /\bChrome\b/.test(ua) && !/internal|\n/i.test(toString.toString());

    /** Internal `[[Class]]` value shortcuts. */
    var objectClass = 'Object',
        airRuntimeClass = isCustomContext ? objectClass : 'ScriptBridgingProxyObject',
        enviroClass = isCustomContext ? objectClass : 'Environment',
        javaClass = (isCustomContext && context.java) ? 'JavaPackage' : getClassOf(context.java),
        phantomClass = isCustomContext ? objectClass : 'RuntimeObject';

    /** Detect Java environments. */
    var java = /\bJava/.test(javaClass) && context.java;

    /** Detect Rhino. */
    var rhino = java && getClassOf(context.environment) == enviroClass;

    /** A character to represent alpha. */
    var alpha = java ? 'a' : '\u03b1';

    /** A character to represent beta. */
    var beta = java ? 'b' : '\u03b2';

    /** Browser document object. */
    var doc = context.document || {};

    /**
     * Detect Opera browser (Presto-based).
     * http://www.howtocreate.co.uk/operaStuff/operaObject.html
     * http://dev.opera.com/articles/view/opera-mini-web-content-authoring-guidelines/#operamini
     */
    var opera = context.operamini || context.opera;

    /** Opera `[[Class]]`. */
    var operaClass = reOpera.test(operaClass = (isCustomContext && opera) ? opera['[[Class]]'] : getClassOf(opera))
      ? operaClass
      : (opera = null);

    /*------------------------------------------------------------------------*/

    /** Temporary variable used over the script's lifetime. */
    var data;

    /** The CPU architecture. */
    var arch = ua;

    /** Platform description array. */
    var description = [];

    /** Platform alpha/beta indicator. */
    var prerelease = null;

    /** A flag to indicate that environment features should be used to resolve the platform. */
    var useFeatures = ua == userAgent;

    /** The browser/environment version. */
    var version = useFeatures && opera && typeof opera.version == 'function' && opera.version();

    /** A flag to indicate if the OS ends with "/ Version" */
    var isSpecialCasedOS;

    /* Detectable layout engines (order is important). */
    var layout = getLayout([
      { 'label': 'EdgeHTML', 'pattern': 'Edge' },
      'Trident',
      { 'label': 'WebKit', 'pattern': 'AppleWebKit' },
      'iCab',
      'Presto',
      'NetFront',
      'Tasman',
      'KHTML',
      'Gecko'
    ]);

    /* Detectable browser names (order is important). */
    var name = getName([
      'Adobe AIR',
      'Arora',
      'Avant Browser',
      'Breach',
      'Camino',
      'Electron',
      'Epiphany',
      'Fennec',
      'Flock',
      'Galeon',
      'GreenBrowser',
      'iCab',
      'Iceweasel',
      'K-Meleon',
      'Konqueror',
      'Lunascape',
      'Maxthon',
      { 'label': 'Microsoft Edge', 'pattern': '(?:Edge|Edg|EdgA|EdgiOS)' },
      'Midori',
      'Nook Browser',
      'PaleMoon',
      'PhantomJS',
      'Raven',
      'Rekonq',
      'RockMelt',
      { 'label': 'Samsung Internet', 'pattern': 'SamsungBrowser' },
      'SeaMonkey',
      { 'label': 'Silk', 'pattern': '(?:Cloud9|Silk-Accelerated)' },
      'Sleipnir',
      'SlimBrowser',
      { 'label': 'SRWare Iron', 'pattern': 'Iron' },
      'Sunrise',
      'Swiftfox',
      'Vivaldi',
      'Waterfox',
      'WebPositive',
      { 'label': 'Yandex Browser', 'pattern': 'YaBrowser' },
      { 'label': 'UC Browser', 'pattern': 'UCBrowser' },
      'Opera Mini',
      { 'label': 'Opera Mini', 'pattern': 'OPiOS' },
      'Opera',
      { 'label': 'Opera', 'pattern': 'OPR' },
      'Chromium',
      'Chrome',
      { 'label': 'Chrome', 'pattern': '(?:HeadlessChrome)' },
      { 'label': 'Chrome Mobile', 'pattern': '(?:CriOS|CrMo)' },
      { 'label': 'Firefox', 'pattern': '(?:Firefox|Minefield)' },
      { 'label': 'Firefox for iOS', 'pattern': 'FxiOS' },
      { 'label': 'IE', 'pattern': 'IEMobile' },
      { 'label': 'IE', 'pattern': 'MSIE' },
      'Safari'
    ]);

    /* Detectable products (order is important). */
    var product = getProduct([
      { 'label': 'BlackBerry', 'pattern': 'BB10' },
      'BlackBerry',
      { 'label': 'Galaxy S', 'pattern': 'GT-I9000' },
      { 'label': 'Galaxy S2', 'pattern': 'GT-I9100' },
      { 'label': 'Galaxy S3', 'pattern': 'GT-I9300' },
      { 'label': 'Galaxy S4', 'pattern': 'GT-I9500' },
      { 'label': 'Galaxy S5', 'pattern': 'SM-G900' },
      { 'label': 'Galaxy S6', 'pattern': 'SM-G920' },
      { 'label': 'Galaxy S6 Edge', 'pattern': 'SM-G925' },
      { 'label': 'Galaxy S7', 'pattern': 'SM-G930' },
      { 'label': 'Galaxy S7 Edge', 'pattern': 'SM-G935' },
      'Google TV',
      'Lumia',
      'iPad',
      'iPod',
      'iPhone',
      'Kindle',
      { 'label': 'Kindle Fire', 'pattern': '(?:Cloud9|Silk-Accelerated)' },
      'Nexus',
      'Nook',
      'PlayBook',
      'PlayStation Vita',
      'PlayStation',
      'TouchPad',
      'Transformer',
      { 'label': 'Wii U', 'pattern': 'WiiU' },
      'Wii',
      'Xbox One',
      { 'label': 'Xbox 360', 'pattern': 'Xbox' },
      'Xoom'
    ]);

    /* Detectable manufacturers. */
    var manufacturer = getManufacturer({
      'Apple': { 'iPad': 1, 'iPhone': 1, 'iPod': 1 },
      'Alcatel': {},
      'Archos': {},
      'Amazon': { 'Kindle': 1, 'Kindle Fire': 1 },
      'Asus': { 'Transformer': 1 },
      'Barnes & Noble': { 'Nook': 1 },
      'BlackBerry': { 'PlayBook': 1 },
      'Google': { 'Google TV': 1, 'Nexus': 1 },
      'HP': { 'TouchPad': 1 },
      'HTC': {},
      'Huawei': {},
      'Lenovo': {},
      'LG': {},
      'Microsoft': { 'Xbox': 1, 'Xbox One': 1 },
      'Motorola': { 'Xoom': 1 },
      'Nintendo': { 'Wii U': 1,  'Wii': 1 },
      'Nokia': { 'Lumia': 1 },
      'Oppo': {},
      'Samsung': { 'Galaxy S': 1, 'Galaxy S2': 1, 'Galaxy S3': 1, 'Galaxy S4': 1 },
      'Sony': { 'PlayStation': 1, 'PlayStation Vita': 1 },
      'Xiaomi': { 'Mi': 1, 'Redmi': 1 }
    });

    /* Detectable operating systems (order is important). */
    var os = getOS([
      'Windows Phone',
      'KaiOS',
      'Android',
      'CentOS',
      { 'label': 'Chrome OS', 'pattern': 'CrOS' },
      'Debian',
      { 'label': 'DragonFly BSD', 'pattern': 'DragonFly' },
      'Fedora',
      'FreeBSD',
      'Gentoo',
      'Haiku',
      'Kubuntu',
      'Linux Mint',
      'OpenBSD',
      'Red Hat',
      'SuSE',
      'Ubuntu',
      'Xubuntu',
      'Cygwin',
      'Symbian OS',
      'hpwOS',
      'webOS ',
      'webOS',
      'Tablet OS',
      'Tizen',
      'Linux',
      'Mac OS X',
      'Macintosh',
      'Mac',
      'Windows 98;',
      'Windows '
    ]);

    /*------------------------------------------------------------------------*/

    /**
     * Picks the layout engine from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected layout engine.
     */
    function getLayout(guesses) {
      return reduce(guesses, function(result, guess) {
        return result || RegExp('\\b' + (
          guess.pattern || qualify(guess)
        ) + '\\b', 'i').exec(ua) && (guess.label || guess);
      });
    }

    /**
     * Picks the manufacturer from an array of guesses.
     *
     * @private
     * @param {Array} guesses An object of guesses.
     * @returns {null|string} The detected manufacturer.
     */
    function getManufacturer(guesses) {
      return reduce(guesses, function(result, value, key) {
        // Lookup the manufacturer by product or scan the UA for the manufacturer.
        return result || (
          value[product] ||
          value[/^[a-z]+(?: +[a-z]+\b)*/i.exec(product)] ||
          RegExp('\\b' + qualify(key) + '(?:\\b|\\w*\\d)', 'i').exec(ua)
        ) && key;
      });
    }

    /**
     * Picks the browser name from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected browser name.
     */
    function getName(guesses) {
      return reduce(guesses, function(result, guess) {
        return result || RegExp('\\b' + (
          guess.pattern || qualify(guess)
        ) + '\\b', 'i').exec(ua) && (guess.label || guess);
      });
    }

    /**
     * Picks the OS name from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected OS name.
     */
    function getOS(guesses) {
      return reduce(guesses, function(result, guess) {
        var pattern = guess.pattern || qualify(guess);
        if (!result && (result =
              RegExp('\\b' + pattern + '(?:/[\\d.]+|[ \\w.]*)', 'i').exec(ua)
            )) {
          result = cleanupOS(result, pattern, guess.label || guess);
        }
        return result;
      });
    }

    /**
     * Picks the product name from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected product name.
     */
    function getProduct(guesses) {
      return reduce(guesses, function(result, guess) {
        var pattern = guess.pattern || qualify(guess);
        if (!result && (result =
              RegExp('\\b' + pattern + ' *\\d+[.\\w_]*', 'i').exec(ua) ||
              RegExp('\\b' + pattern + ' *\\w+-[\\w]*', 'i').exec(ua) ||
              RegExp('\\b' + pattern + '(?:; *(?:[a-z]+[_-])?[a-z]+\\d+|[^ ();-]*)', 'i').exec(ua)
            )) {
          // Split by forward slash and append product version if needed.
          if ((result = String((guess.label && !RegExp(pattern, 'i').test(guess.label)) ? guess.label : result).split('/'))[1] && !/[\d.]+/.test(result[0])) {
            result[0] += ' ' + result[1];
          }
          // Correct character case and cleanup string.
          guess = guess.label || guess;
          result = format(result[0]
            .replace(RegExp(pattern, 'i'), guess)
            .replace(RegExp('; *(?:' + guess + '[_-])?', 'i'), ' ')
            .replace(RegExp('(' + guess + ')[-_.]?(\\w)', 'i'), '$1 $2'));
        }
        return result;
      });
    }

    /**
     * Resolves the version using an array of UA patterns.
     *
     * @private
     * @param {Array} patterns An array of UA patterns.
     * @returns {null|string} The detected version.
     */
    function getVersion(patterns) {
      return reduce(patterns, function(result, pattern) {
        return result || (RegExp(pattern +
          '(?:-[\\d.]+/|(?: for [\\w-]+)?[ /-])([\\d.]+[^ ();/_-]*)', 'i').exec(ua) || 0)[1] || null;
      });
    }

    /**
     * Returns `platform.description` when the platform object is coerced to a string.
     *
     * @name toString
     * @memberOf platform
     * @returns {string} Returns `platform.description` if available, else an empty string.
     */
    function toStringPlatform() {
      return this.description || '';
    }

    /*------------------------------------------------------------------------*/

    // Convert layout to an array so we can add extra details.
    layout && (layout = [layout]);

    // Detect Android products.
    // Browsers on Android devices typically provide their product IDS after "Android;"
    // up to "Build" or ") AppleWebKit".
    // Example:
    // "Mozilla/5.0 (Linux; Android 8.1.0; Moto G (5) Plus) AppleWebKit/537.36
    // (KHTML, like Gecko) Chrome/70.0.3538.80 Mobile Safari/537.36"
    if (/\bAndroid\b/.test(os) && !product &&
        (data = /\bAndroid[^;]*;(.*?)(?:Build|\) AppleWebKit)\b/i.exec(ua))) {
      product = trim(data[1])
        // Replace any language codes (eg. "en-US").
        .replace(/^[a-z]{2}-[a-z]{2};\s*/i, '')
        || null;
    }
    // Detect product names that contain their manufacturer's name.
    if (manufacturer && !product) {
      product = getProduct([manufacturer]);
    } else if (manufacturer && product) {
      product = product
        .replace(RegExp('^(' + qualify(manufacturer) + ')[-_.\\s]', 'i'), manufacturer + ' ')
        .replace(RegExp('^(' + qualify(manufacturer) + ')[-_.]?(\\w)', 'i'), manufacturer + ' $2');
    }
    // Clean up Google TV.
    if ((data = /\bGoogle TV\b/.exec(product))) {
      product = data[0];
    }
    // Detect simulators.
    if (/\bSimulator\b/i.test(ua)) {
      product = (product ? product + ' ' : '') + 'Simulator';
    }
    // Detect Opera Mini 8+ running in Turbo/Uncompressed mode on iOS.
    if (name == 'Opera Mini' && /\bOPiOS\b/.test(ua)) {
      description.push('running in Turbo/Uncompressed mode');
    }
    // Detect IE Mobile 11.
    if (name == 'IE' && /\blike iPhone OS\b/.test(ua)) {
      data = parse(ua.replace(/like iPhone OS/, ''));
      manufacturer = data.manufacturer;
      product = data.product;
    }
    // Detect iOS.
    else if (/^iP/.test(product)) {
      name || (name = 'Safari');
      os = 'iOS' + ((data = / OS ([\d_]+)/i.exec(ua))
        ? ' ' + data[1].replace(/_/g, '.')
        : '');
    }
    // Detect Kubuntu.
    else if (name == 'Konqueror' && /^Linux\b/i.test(os)) {
      os = 'Kubuntu';
    }
    // Detect Android browsers.
    else if ((manufacturer && manufacturer != 'Google' &&
        ((/Chrome/.test(name) && !/\bMobile Safari\b/i.test(ua)) || /\bVita\b/.test(product))) ||
        (/\bAndroid\b/.test(os) && /^Chrome/.test(name) && /\bVersion\//i.test(ua))) {
      name = 'Android Browser';
      os = /\bAndroid\b/.test(os) ? os : 'Android';
    }
    // Detect Silk desktop/accelerated modes.
    else if (name == 'Silk') {
      if (!/\bMobi/i.test(ua)) {
        os = 'Android';
        description.unshift('desktop mode');
      }
      if (/Accelerated *= *true/i.test(ua)) {
        description.unshift('accelerated');
      }
    }
    // Detect UC Browser speed mode.
    else if (name == 'UC Browser' && /\bUCWEB\b/.test(ua)) {
      description.push('speed mode');
    }
    // Detect PaleMoon identifying as Firefox.
    else if (name == 'PaleMoon' && (data = /\bFirefox\/([\d.]+)\b/.exec(ua))) {
      description.push('identifying as Firefox ' + data[1]);
    }
    // Detect Firefox OS and products running Firefox.
    else if (name == 'Firefox' && (data = /\b(Mobile|Tablet|TV)\b/i.exec(ua))) {
      os || (os = 'Firefox OS');
      product || (product = data[1]);
    }
    // Detect false positives for Firefox/Safari.
    else if (!name || (data = !/\bMinefield\b/i.test(ua) && /\b(?:Firefox|Safari)\b/.exec(name))) {
      // Escape the `/` for Firefox 1.
      if (name && !product && /[\/,]|^[^(]+?\)/.test(ua.slice(ua.indexOf(data + '/') + 8))) {
        // Clear name of false positives.
        name = null;
      }
      // Reassign a generic name.
      if ((data = product || manufacturer || os) &&
          (product || manufacturer || /\b(?:Android|Symbian OS|Tablet OS|webOS)\b/.test(os))) {
        name = /[a-z]+(?: Hat)?/i.exec(/\bAndroid\b/.test(os) ? os : data) + ' Browser';
      }
    }
    // Add Chrome version to description for Electron.
    else if (name == 'Electron' && (data = (/\bChrome\/([\d.]+)\b/.exec(ua) || 0)[1])) {
      description.push('Chromium ' + data);
    }
    // Detect non-Opera (Presto-based) versions (order is important).
    if (!version) {
      version = getVersion([
        '(?:Cloud9|CriOS|CrMo|Edge|Edg|EdgA|EdgiOS|FxiOS|HeadlessChrome|IEMobile|Iron|Opera ?Mini|OPiOS|OPR|Raven|SamsungBrowser|Silk(?!/[\\d.]+$)|UCBrowser|YaBrowser)',
        'Version',
        qualify(name),
        '(?:Firefox|Minefield|NetFront)'
      ]);
    }
    // Detect stubborn layout engines.
    if ((data =
          layout == 'iCab' && parseFloat(version) > 3 && 'WebKit' ||
          /\bOpera\b/.test(name) && (/\bOPR\b/.test(ua) ? 'Blink' : 'Presto') ||
          /\b(?:Midori|Nook|Safari)\b/i.test(ua) && !/^(?:Trident|EdgeHTML)$/.test(layout) && 'WebKit' ||
          !layout && /\bMSIE\b/i.test(ua) && (os == 'Mac OS' ? 'Tasman' : 'Trident') ||
          layout == 'WebKit' && /\bPlayStation\b(?! Vita\b)/i.test(name) && 'NetFront'
        )) {
      layout = [data];
    }
    // Detect Windows Phone 7 desktop mode.
    if (name == 'IE' && (data = (/; *(?:XBLWP|ZuneWP)(\d+)/i.exec(ua) || 0)[1])) {
      name += ' Mobile';
      os = 'Windows Phone ' + (/\+$/.test(data) ? data : data + '.x');
      description.unshift('desktop mode');
    }
    // Detect Windows Phone 8.x desktop mode.
    else if (/\bWPDesktop\b/i.test(ua)) {
      name = 'IE Mobile';
      os = 'Windows Phone 8.x';
      description.unshift('desktop mode');
      version || (version = (/\brv:([\d.]+)/.exec(ua) || 0)[1]);
    }
    // Detect IE 11 identifying as other browsers.
    else if (name != 'IE' && layout == 'Trident' && (data = /\brv:([\d.]+)/.exec(ua))) {
      if (name) {
        description.push('identifying as ' + name + (version ? ' ' + version : ''));
      }
      name = 'IE';
      version = data[1];
    }
    // Leverage environment features.
    if (useFeatures) {
      // Detect server-side environments.
      // Rhino has a global function while others have a global object.
      if (isHostType(context, 'global')) {
        if (java) {
          data = java.lang.System;
          arch = data.getProperty('os.arch');
          os = os || data.getProperty('os.name') + ' ' + data.getProperty('os.version');
        }
        if (rhino) {
          try {
            version = context.require('ringo/engine').version.join('.');
            name = 'RingoJS';
          } catch(e) {
            if ((data = context.system) && data.global.system == context.system) {
              name = 'Narwhal';
              os || (os = data[0].os || null);
            }
          }
          if (!name) {
            name = 'Rhino';
          }
        }
        else if (
          typeof context.process == 'object' && !context.process.browser &&
          (data = context.process)
        ) {
          if (typeof data.versions == 'object') {
            if (typeof data.versions.electron == 'string') {
              description.push('Node ' + data.versions.node);
              name = 'Electron';
              version = data.versions.electron;
            } else if (typeof data.versions.nw == 'string') {
              description.push('Chromium ' + version, 'Node ' + data.versions.node);
              name = 'NW.js';
              version = data.versions.nw;
            }
          }
          if (!name) {
            name = 'Node.js';
            arch = data.arch;
            os = data.platform;
            version = /[\d.]+/.exec(data.version);
            version = version ? version[0] : null;
          }
        }
      }
      // Detect Adobe AIR.
      else if (getClassOf((data = context.runtime)) == airRuntimeClass) {
        name = 'Adobe AIR';
        os = data.flash.system.Capabilities.os;
      }
      // Detect PhantomJS.
      else if (getClassOf((data = context.phantom)) == phantomClass) {
        name = 'PhantomJS';
        version = (data = data.version || null) && (data.major + '.' + data.minor + '.' + data.patch);
      }
      // Detect IE compatibility modes.
      else if (typeof doc.documentMode == 'number' && (data = /\bTrident\/(\d+)/i.exec(ua))) {
        // We're in compatibility mode when the Trident version + 4 doesn't
        // equal the document mode.
        version = [version, doc.documentMode];
        if ((data = +data[1] + 4) != version[1]) {
          description.push('IE ' + version[1] + ' mode');
          layout && (layout[1] = '');
          version[1] = data;
        }
        version = name == 'IE' ? String(version[1].toFixed(1)) : version[0];
      }
      // Detect IE 11 masking as other browsers.
      else if (typeof doc.documentMode == 'number' && /^(?:Chrome|Firefox)\b/.test(name)) {
        description.push('masking as ' + name + ' ' + version);
        name = 'IE';
        version = '11.0';
        layout = ['Trident'];
        os = 'Windows';
      }
      os = os && format(os);
    }
    // Detect prerelease phases.
    if (version && (data =
          /(?:[ab]|dp|pre|[ab]\d+pre)(?:\d+\+?)?$/i.exec(version) ||
          /(?:alpha|beta)(?: ?\d)?/i.exec(ua + ';' + (useFeatures && nav.appMinorVersion)) ||
          /\bMinefield\b/i.test(ua) && 'a'
        )) {
      prerelease = /b/i.test(data) ? 'beta' : 'alpha';
      version = version.replace(RegExp(data + '\\+?$'), '') +
        (prerelease == 'beta' ? beta : alpha) + (/\d+\+?/.exec(data) || '');
    }
    // Detect Firefox Mobile.
    if (name == 'Fennec' || name == 'Firefox' && /\b(?:Android|Firefox OS|KaiOS)\b/.test(os)) {
      name = 'Firefox Mobile';
    }
    // Obscure Maxthon's unreliable version.
    else if (name == 'Maxthon' && version) {
      version = version.replace(/\.[\d.]+/, '.x');
    }
    // Detect Xbox 360 and Xbox One.
    else if (/\bXbox\b/i.test(product)) {
      if (product == 'Xbox 360') {
        os = null;
      }
      if (product == 'Xbox 360' && /\bIEMobile\b/.test(ua)) {
        description.unshift('mobile mode');
      }
    }
    // Add mobile postfix.
    else if ((/^(?:Chrome|IE|Opera)$/.test(name) || name && !product && !/Browser|Mobi/.test(name)) &&
        (os == 'Windows CE' || /Mobi/i.test(ua))) {
      name += ' Mobile';
    }
    // Detect IE platform preview.
    else if (name == 'IE' && useFeatures) {
      try {
        if (context.external === null) {
          description.unshift('platform preview');
        }
      } catch(e) {
        description.unshift('embedded');
      }
    }
    // Detect BlackBerry OS version.
    // http://docs.blackberry.com/en/developers/deliverables/18169/HTTP_headers_sent_by_BB_Browser_1234911_11.jsp
    else if ((/\bBlackBerry\b/.test(product) || /\bBB10\b/.test(ua)) && (data =
          (RegExp(product.replace(/ +/g, ' *') + '/([.\\d]+)', 'i').exec(ua) || 0)[1] ||
          version
        )) {
      data = [data, /BB10/.test(ua)];
      os = (data[1] ? (product = null, manufacturer = 'BlackBerry') : 'Device Software') + ' ' + data[0];
      version = null;
    }
    // Detect Opera identifying/masking itself as another browser.
    // http://www.opera.com/support/kb/view/843/
    else if (this != forOwn && product != 'Wii' && (
          (useFeatures && opera) ||
          (/Opera/.test(name) && /\b(?:MSIE|Firefox)\b/i.test(ua)) ||
          (name == 'Firefox' && /\bOS X (?:\d+\.){2,}/.test(os)) ||
          (name == 'IE' && (
            (os && !/^Win/.test(os) && version > 5.5) ||
            /\bWindows XP\b/.test(os) && version > 8 ||
            version == 8 && !/\bTrident\b/.test(ua)
          ))
        ) && !reOpera.test((data = parse.call(forOwn, ua.replace(reOpera, '') + ';'))) && data.name) {
      // When "identifying", the UA contains both Opera and the other browser's name.
      data = 'ing as ' + data.name + ((data = data.version) ? ' ' + data : '');
      if (reOpera.test(name)) {
        if (/\bIE\b/.test(data) && os == 'Mac OS') {
          os = null;
        }
        data = 'identify' + data;
      }
      // When "masking", the UA contains only the other browser's name.
      else {
        data = 'mask' + data;
        if (operaClass) {
          name = format(operaClass.replace(/([a-z])([A-Z])/g, '$1 $2'));
        } else {
          name = 'Opera';
        }
        if (/\bIE\b/.test(data)) {
          os = null;
        }
        if (!useFeatures) {
          version = null;
        }
      }
      layout = ['Presto'];
      description.push(data);
    }
    // Detect WebKit Nightly and approximate Chrome/Safari versions.
    if ((data = (/\bAppleWebKit\/([\d.]+\+?)/i.exec(ua) || 0)[1])) {
      // Correct build number for numeric comparison.
      // (e.g. "532.5" becomes "532.05")
      data = [parseFloat(data.replace(/\.(\d)$/, '.0$1')), data];
      // Nightly builds are postfixed with a "+".
      if (name == 'Safari' && data[1].slice(-1) == '+') {
        name = 'WebKit Nightly';
        prerelease = 'alpha';
        version = data[1].slice(0, -1);
      }
      // Clear incorrect browser versions.
      else if (version == data[1] ||
          version == (data[2] = (/\bSafari\/([\d.]+\+?)/i.exec(ua) || 0)[1])) {
        version = null;
      }
      // Use the full Chrome version when available.
      data[1] = (/\b(?:Headless)?Chrome\/([\d.]+)/i.exec(ua) || 0)[1];
      // Detect Blink layout engine.
      if (data[0] == 537.36 && data[2] == 537.36 && parseFloat(data[1]) >= 28 && layout == 'WebKit') {
        layout = ['Blink'];
      }
      // Detect JavaScriptCore.
      // http://stackoverflow.com/questions/6768474/how-can-i-detect-which-javascript-engine-v8-or-jsc-is-used-at-runtime-in-androi
      if (!useFeatures || (!likeChrome && !data[1])) {
        layout && (layout[1] = 'like Safari');
        data = (data = data[0], data < 400 ? 1 : data < 500 ? 2 : data < 526 ? 3 : data < 533 ? 4 : data < 534 ? '4+' : data < 535 ? 5 : data < 537 ? 6 : data < 538 ? 7 : data < 601 ? 8 : data < 602 ? 9 : data < 604 ? 10 : data < 606 ? 11 : data < 608 ? 12 : '12');
      } else {
        layout && (layout[1] = 'like Chrome');
        data = data[1] || (data = data[0], data < 530 ? 1 : data < 532 ? 2 : data < 532.05 ? 3 : data < 533 ? 4 : data < 534.03 ? 5 : data < 534.07 ? 6 : data < 534.10 ? 7 : data < 534.13 ? 8 : data < 534.16 ? 9 : data < 534.24 ? 10 : data < 534.30 ? 11 : data < 535.01 ? 12 : data < 535.02 ? '13+' : data < 535.07 ? 15 : data < 535.11 ? 16 : data < 535.19 ? 17 : data < 536.05 ? 18 : data < 536.10 ? 19 : data < 537.01 ? 20 : data < 537.11 ? '21+' : data < 537.13 ? 23 : data < 537.18 ? 24 : data < 537.24 ? 25 : data < 537.36 ? 26 : layout != 'Blink' ? '27' : '28');
      }
      // Add the postfix of ".x" or "+" for approximate versions.
      layout && (layout[1] += ' ' + (data += typeof data == 'number' ? '.x' : /[.+]/.test(data) ? '' : '+'));
      // Obscure version for some Safari 1-2 releases.
      if (name == 'Safari' && (!version || parseInt(version) > 45)) {
        version = data;
      } else if (name == 'Chrome' && /\bHeadlessChrome/i.test(ua)) {
        description.unshift('headless');
      }
    }
    // Detect Opera desktop modes.
    if (name == 'Opera' &&  (data = /\bzbov|zvav$/.exec(os))) {
      name += ' ';
      description.unshift('desktop mode');
      if (data == 'zvav') {
        name += 'Mini';
        version = null;
      } else {
        name += 'Mobile';
      }
      os = os.replace(RegExp(' *' + data + '$'), '');
    }
    // Detect Chrome desktop mode.
    else if (name == 'Safari' && /\bChrome\b/.exec(layout && layout[1])) {
      description.unshift('desktop mode');
      name = 'Chrome Mobile';
      version = null;

      if (/\bOS X\b/.test(os)) {
        manufacturer = 'Apple';
        os = 'iOS 4.3+';
      } else {
        os = null;
      }
    }
    // Newer versions of SRWare Iron uses the Chrome tag to indicate its version number.
    else if (/\bSRWare Iron\b/.test(name) && !version) {
      version = getVersion('Chrome');
    }
    // Strip incorrect OS versions.
    if (version && version.indexOf((data = /[\d.]+$/.exec(os))) == 0 &&
        ua.indexOf('/' + data + '-') > -1) {
      os = trim(os.replace(data, ''));
    }
    // Ensure OS does not include the browser name.
    if (os && os.indexOf(name) != -1 && !RegExp(name + ' OS').test(os)) {
      os = os.replace(RegExp(' *' + qualify(name) + ' *'), '');
    }
    // Add layout engine.
    if (layout && !/\b(?:Avant|Nook)\b/.test(name) && (
        /Browser|Lunascape|Maxthon/.test(name) ||
        name != 'Safari' && /^iOS/.test(os) && /\bSafari\b/.test(layout[1]) ||
        /^(?:Adobe|Arora|Breach|Midori|Opera|Phantom|Rekonq|Rock|Samsung Internet|Sleipnir|SRWare Iron|Vivaldi|Web)/.test(name) && layout[1])) {
      // Don't add layout details to description if they are falsey.
      (data = layout[layout.length - 1]) && description.push(data);
    }
    // Combine contextual information.
    if (description.length) {
      description = ['(' + description.join('; ') + ')'];
    }
    // Append manufacturer to description.
    if (manufacturer && product && product.indexOf(manufacturer) < 0) {
      description.push('on ' + manufacturer);
    }
    // Append product to description.
    if (product) {
      description.push((/^on /.test(description[description.length - 1]) ? '' : 'on ') + product);
    }
    // Parse the OS into an object.
    if (os) {
      data = / ([\d.+]+)$/.exec(os);
      isSpecialCasedOS = data && os.charAt(os.length - data[0].length - 1) == '/';
      os = {
        'architecture': 32,
        'family': (data && !isSpecialCasedOS) ? os.replace(data[0], '') : os,
        'version': data ? data[1] : null,
        'toString': function() {
          var version = this.version;
          return this.family + ((version && !isSpecialCasedOS) ? ' ' + version : '') + (this.architecture == 64 ? ' 64-bit' : '');
        }
      };
    }
    // Add browser/OS architecture.
    if ((data = /\b(?:AMD|IA|Win|WOW|x86_|x)64\b/i.exec(arch)) && !/\bi686\b/i.test(arch)) {
      if (os) {
        os.architecture = 64;
        os.family = os.family.replace(RegExp(' *' + data), '');
      }
      if (
          name && (/\bWOW64\b/i.test(ua) ||
          (useFeatures && /\w(?:86|32)$/.test(nav.cpuClass || nav.platform) && !/\bWin64; x64\b/i.test(ua)))
      ) {
        description.unshift('32-bit');
      }
    }
    // Chrome 39 and above on OS X is always 64-bit.
    else if (
        os && /^OS X/.test(os.family) &&
        name == 'Chrome' && parseFloat(version) >= 39
    ) {
      os.architecture = 64;
    }

    ua || (ua = null);

    /*------------------------------------------------------------------------*/

    /**
     * The platform object.
     *
     * @name platform
     * @type Object
     */
    var platform = {};

    /**
     * The platform description.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.description = ua;

    /**
     * The name of the browser's layout engine.
     *
     * The list of common layout engines include:
     * "Blink", "EdgeHTML", "Gecko", "Trident" and "WebKit"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.layout = layout && layout[0];

    /**
     * The name of the product's manufacturer.
     *
     * The list of manufacturers include:
     * "Apple", "Archos", "Amazon", "Asus", "Barnes & Noble", "BlackBerry",
     * "Google", "HP", "HTC", "LG", "Microsoft", "Motorola", "Nintendo",
     * "Nokia", "Samsung" and "Sony"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.manufacturer = manufacturer;

    /**
     * The name of the browser/environment.
     *
     * The list of common browser names include:
     * "Chrome", "Electron", "Firefox", "Firefox for iOS", "IE",
     * "Microsoft Edge", "PhantomJS", "Safari", "SeaMonkey", "Silk",
     * "Opera Mini" and "Opera"
     *
     * Mobile versions of some browsers have "Mobile" appended to their name:
     * eg. "Chrome Mobile", "Firefox Mobile", "IE Mobile" and "Opera Mobile"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.name = name;

    /**
     * The alpha/beta release indicator.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.prerelease = prerelease;

    /**
     * The name of the product hosting the browser.
     *
     * The list of common products include:
     *
     * "BlackBerry", "Galaxy S4", "Lumia", "iPad", "iPod", "iPhone", "Kindle",
     * "Kindle Fire", "Nexus", "Nook", "PlayBook", "TouchPad" and "Transformer"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.product = product;

    /**
     * The browser's user agent string.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.ua = ua;

    /**
     * The browser/environment version.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.version = name && version;

    /**
     * The name of the operating system.
     *
     * @memberOf platform
     * @type Object
     */
    platform.os = os || {

      /**
       * The CPU architecture the OS is built for.
       *
       * @memberOf platform.os
       * @type number|null
       */
      'architecture': null,

      /**
       * The family of the OS.
       *
       * Common values include:
       * "Windows", "Windows Server 2008 R2 / 7", "Windows Server 2008 / Vista",
       * "Windows XP", "OS X", "Linux", "Ubuntu", "Debian", "Fedora", "Red Hat",
       * "SuSE", "Android", "iOS" and "Windows Phone"
       *
       * @memberOf platform.os
       * @type string|null
       */
      'family': null,

      /**
       * The version of the OS.
       *
       * @memberOf platform.os
       * @type string|null
       */
      'version': null,

      /**
       * Returns the OS string.
       *
       * @memberOf platform.os
       * @returns {string} The OS string.
       */
      'toString': function() { return 'null'; }
    };

    platform.parse = parse;
    platform.toString = toStringPlatform;

    if (platform.version) {
      description.unshift(version);
    }
    if (platform.name) {
      description.unshift(name);
    }
    if (os && name && !(os == String(os).split(' ')[0] && (os == name.split(' ')[0] || product))) {
      description.push(product ? '(' + os + ')' : 'on ' + os);
    }
    if (description.length) {
      platform.description = description.join(' ');
    }
    return platform;
  }

  /*--------------------------------------------------------------------------*/

  // Export platform.
  var platform = parse();

  // Some AMD build optimizers, like r.js, check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose platform on the global object to prevent errors when platform is
    // loaded by a script tag in the presence of an AMD loader.
    // See http://requirejs.org/docs/errors.html#mismatch for more details.
    root.platform = platform;

    // Define as an anonymous module so platform can be aliased through path mapping.
    define(function() {
      return platform;
    });
  }
  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
  else if (freeExports && freeModule) {
    // Export for CommonJS support.
    forOwn(platform, function(value, key) {
      freeExports[key] = value;
    });
  }
  else {
    // Export to the global object.
    root.platform = platform;
  }
}.call(this));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],13:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],14:[function(require,module,exports){
const debug = require('../internal/debug')
const { MAX_LENGTH, MAX_SAFE_INTEGER } = require('../internal/constants')
const { re, t } = require('../internal/re')

const parseOptions = require('../internal/parse-options')
const { compareIdentifiers } = require('../internal/identifiers')
class SemVer {
  constructor (version, options) {
    options = parseOptions(options)

    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
          version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      )
    }

    debug('SemVer', version, options)
    this.options = options
    this.loose = !!options.loose
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease

    const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL])

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version

    // these are actually numbers
    this.major = +m[1]
    this.minor = +m[2]
    this.patch = +m[3]

    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = []
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num
          }
        }
        return id
      })
    }

    this.build = m[5] ? m[5].split('.') : []
    this.format()
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug('SemVer.compare', this.version, this.options, other)
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options)
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options)
    }

    return (
      compareIdentifiers(this.major, other.major) ||
      compareIdentifiers(this.minor, other.minor) ||
      compareIdentifiers(this.patch, other.patch)
    )
  }

  comparePre (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options)
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0
    }

    let i = 0
    do {
      const a = this.prerelease[i]
      const b = other.prerelease[i]
      debug('prerelease compare', i, a, b)
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options)
    }

    let i = 0
    do {
      const a = this.build[i]
      const b = other.build[i]
      debug('prerelease compare', i, a, b)
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier) {
    switch (release) {
      case 'premajor':
        this.prerelease.length = 0
        this.patch = 0
        this.minor = 0
        this.major++
        this.inc('pre', identifier)
        break
      case 'preminor':
        this.prerelease.length = 0
        this.patch = 0
        this.minor++
        this.inc('pre', identifier)
        break
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0
        this.inc('patch', identifier)
        this.inc('pre', identifier)
        break
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier)
        }
        this.inc('pre', identifier)
        break

      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
          this.major++
        }
        this.minor = 0
        this.patch = 0
        this.prerelease = []
        break
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++
        }
        this.patch = 0
        this.prerelease = []
        break
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++
        }
        this.prerelease = []
        break
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre':
        if (this.prerelease.length === 0) {
          this.prerelease = [0]
        } else {
          let i = this.prerelease.length
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++
              i = -2
            }
          }
          if (i === -1) {
            // didn't increment anything
            this.prerelease.push(0)
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          if (this.prerelease[0] === identifier) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = [identifier, 0]
            }
          } else {
            this.prerelease = [identifier, 0]
          }
        }
        break

      default:
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.format()
    this.raw = this.version
    return this
  }
}

module.exports = SemVer

},{"../internal/constants":17,"../internal/debug":18,"../internal/identifiers":19,"../internal/parse-options":20,"../internal/re":21}],15:[function(require,module,exports){
const SemVer = require('../classes/semver')
const major = (a, loose) => new SemVer(a, loose).major
module.exports = major

},{"../classes/semver":14}],16:[function(require,module,exports){
const SemVer = require('../classes/semver')
const minor = (a, loose) => new SemVer(a, loose).minor
module.exports = minor

},{"../classes/semver":14}],17:[function(require,module,exports){
// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0'

const MAX_LENGTH = 256
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
  /* istanbul ignore next */ 9007199254740991

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16

module.exports = {
  SEMVER_SPEC_VERSION,
  MAX_LENGTH,
  MAX_SAFE_INTEGER,
  MAX_SAFE_COMPONENT_LENGTH
}

},{}],18:[function(require,module,exports){
(function (process){(function (){
const debug = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {}

module.exports = debug

}).call(this)}).call(this,require('_process'))

},{"_process":13}],19:[function(require,module,exports){
const numeric = /^[0-9]+$/
const compareIdentifiers = (a, b) => {
  const anum = numeric.test(a)
  const bnum = numeric.test(b)

  if (anum && bnum) {
    a = +a
    b = +b
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
}

const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a)

module.exports = {
  compareIdentifiers,
  rcompareIdentifiers
}

},{}],20:[function(require,module,exports){
// parse out just the options we care about so we always get a consistent
// obj with keys in a consistent order.
const opts = ['includePrerelease', 'loose', 'rtl']
const parseOptions = options =>
  !options ? {}
  : typeof options !== 'object' ? { loose: true }
  : opts.filter(k => options[k]).reduce((options, k) => {
    options[k] = true
    return options
  }, {})
module.exports = parseOptions

},{}],21:[function(require,module,exports){
const { MAX_SAFE_COMPONENT_LENGTH } = require('./constants')
const debug = require('./debug')
exports = module.exports = {}

// The actual regexps go on exports.re
const re = exports.re = []
const src = exports.src = []
const t = exports.t = {}
let R = 0

const createToken = (name, value, isGlobal) => {
  const index = R++
  debug(index, value)
  t[name] = index
  src[index] = value
  re[index] = new RegExp(value, isGlobal ? 'g' : undefined)
}

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*')
createToken('NUMERICIDENTIFIERLOOSE', '[0-9]+')

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

createToken('NONNUMERICIDENTIFIER', '\\d*[a-zA-Z-][a-zA-Z0-9-]*')

// ## Main Version
// Three dot-separated numeric identifiers.

createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})`)

createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`)

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]
}|${src[t.NONNUMERICIDENTIFIER]})`)

createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]
}|${src[t.NONNUMERICIDENTIFIER]})`)

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`)

createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`)

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

createToken('BUILDIDENTIFIER', '[0-9A-Za-z-]+')

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
}(?:\\.${src[t.BUILDIDENTIFIER]})*))`)

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
}${src[t.PRERELEASE]}?${
  src[t.BUILD]}?`)

createToken('FULL', `^${src[t.FULLPLAIN]}$`)

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
}${src[t.PRERELEASELOOSE]}?${
  src[t.BUILD]}?`)

createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`)

createToken('GTLT', '((?:<|>)?=?)')

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`)
createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`)

createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:${src[t.PRERELEASE]})?${
                     src[t.BUILD]}?` +
                   `)?)?`)

createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:${src[t.PRERELEASELOOSE]})?${
                          src[t.BUILD]}?` +
                        `)?)?`)

createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`)
createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`)

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
createToken('COERCE', `${'(^|[^\\d])' +
              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:$|[^\\d])`)
createToken('COERCERTL', src[t.COERCE], true)

// Tilde ranges.
// Meaning is "reasonably at or greater than"
createToken('LONETILDE', '(?:~>?)')

createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true)
exports.tildeTrimReplace = '$1~'

createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`)
createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`)

// Caret ranges.
// Meaning is "at least and backwards compatible with"
createToken('LONECARET', '(?:\\^)')

createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true)
exports.caretTrimReplace = '$1^'

createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`)
createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`)

// A simple gt/lt/eq thing, or just "" to indicate "any version"
createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`)
createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`)

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true)
exports.comparatorTrimReplace = '$1$2$3'

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
                   `\\s+-\\s+` +
                   `(${src[t.XRANGEPLAIN]})` +
                   `\\s*$`)

createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s+-\\s+` +
                        `(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s*$`)

// Star ranges basically just allow anything at all.
createToken('STAR', '(<|>)?=?\\s*\\*')
// >=0.0.0 is like a star
createToken('GTE0', '^\\s*>=\\s*0\.0\.0\\s*$')
createToken('GTE0PRE', '^\\s*>=\\s*0\.0\.0-0\\s*$')

},{"./constants":17,"./debug":18}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "v1", {
  enumerable: true,
  get: function () {
    return _v.default;
  }
});
Object.defineProperty(exports, "v3", {
  enumerable: true,
  get: function () {
    return _v2.default;
  }
});
Object.defineProperty(exports, "v4", {
  enumerable: true,
  get: function () {
    return _v3.default;
  }
});
Object.defineProperty(exports, "v5", {
  enumerable: true,
  get: function () {
    return _v4.default;
  }
});
Object.defineProperty(exports, "NIL", {
  enumerable: true,
  get: function () {
    return _nil.default;
  }
});
Object.defineProperty(exports, "version", {
  enumerable: true,
  get: function () {
    return _version.default;
  }
});
Object.defineProperty(exports, "validate", {
  enumerable: true,
  get: function () {
    return _validate.default;
  }
});
Object.defineProperty(exports, "stringify", {
  enumerable: true,
  get: function () {
    return _stringify.default;
  }
});
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return _parse.default;
  }
});

var _v = _interopRequireDefault(require("./v1.js"));

var _v2 = _interopRequireDefault(require("./v3.js"));

var _v3 = _interopRequireDefault(require("./v4.js"));

var _v4 = _interopRequireDefault(require("./v5.js"));

var _nil = _interopRequireDefault(require("./nil.js"));

var _version = _interopRequireDefault(require("./version.js"));

var _validate = _interopRequireDefault(require("./validate.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./nil.js":24,"./parse.js":25,"./stringify.js":29,"./v1.js":30,"./v3.js":31,"./v4.js":33,"./v5.js":34,"./validate.js":35,"./version.js":36}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Uint8Array(msg.length);

    for (let i = 0; i < msg.length; ++i) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  const output = [];
  const length32 = input.length * 32;
  const hexTab = '0123456789abcdef';

  for (let i = 0; i < length32; i += 8) {
    const x = input[i >> 5] >>> i % 32 & 0xff;
    const hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/**
 * Calculate output length with padding and bit length
 */


function getOutputLength(inputLength8) {
  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[getOutputLength(len) - 1] = len;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  if (input.length === 0) {
    return [];
  }

  const length8 = input.length * 8;
  const output = new Uint32Array(getOutputLength(length8));

  for (let i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

var _default = md5;
exports.default = _default;
},{}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = '00000000-0000-0000-0000-000000000000';
exports.default = _default;
},{}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  let v;
  const arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

var _default = parse;
exports.default = _default;
},{"./validate.js":35}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
exports.default = _default;
},{}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rng;
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);

function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
},{}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = [];

    for (let i = 0; i < msg.length; ++i) {
      bytes.push(msg.charCodeAt(i));
    }
  } else if (!Array.isArray(bytes)) {
    // Convert Array-like to Array
    bytes = Array.prototype.slice.call(bytes);
  }

  bytes.push(0x80);
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);

  for (let i = 0; i < N; ++i) {
    const arr = new Uint32Array(16);

    for (let j = 0; j < 16; ++j) {
      arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }

    M[i] = arr;
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);

    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }

    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];

    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var _default = sha1;
exports.default = _default;
},{}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

var _default = stringify;
exports.default = _default;
},{"./validate.js":35}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
let _nodeId;

let _clockseq; // Previous uuid creation time


let _lastMSecs = 0;
let _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || _rng.default)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  let msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  const tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || (0, _stringify.default)(b);
}

var _default = v1;
exports.default = _default;
},{"./rng.js":27,"./stringify.js":29}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _md = _interopRequireDefault(require("./md5.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v3 = (0, _v.default)('v3', 0x30, _md.default);
var _default = v3;
exports.default = _default;
},{"./md5.js":23,"./v35.js":32}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.URL = exports.DNS = void 0;

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function _default(name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = (0, _parse.default)(namespace);
    }

    if (namespace.length !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return (0, _stringify.default)(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}
},{"./parse.js":25,"./stringify.js":29}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function v4(options, buf, offset) {
  options = options || {};

  const rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`


  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return (0, _stringify.default)(rnds);
}

var _default = v4;
exports.default = _default;
},{"./rng.js":27,"./stringify.js":29}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _sha = _interopRequireDefault(require("./sha1.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v5 = (0, _v.default)('v5', 0x50, _sha.default);
var _default = v5;
exports.default = _default;
},{"./sha1.js":28,"./v35.js":32}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regex = _interopRequireDefault(require("./regex.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(uuid) {
  return typeof uuid === 'string' && _regex.default.test(uuid);
}

var _default = validate;
exports.default = _default;
},{"./regex.js":26}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function version(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.substr(14, 1), 16);
}

var _default = version;
exports.default = _default;
},{"./validate.js":35}],37:[function(require,module,exports){
/*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {

});

emitter.on('somenamespace*', function (eventName, payloads) {

});

Please note that callbacks triggered by wildcard registered events also get
the event name as the first argument.
*/

module.exports = WildEmitter;

function WildEmitter() { }

WildEmitter.mixin = function (constructor) {
    var prototype = constructor.prototype || constructor;

    prototype.isWildEmitter= true;

    // Listen on the given `event` with `fn`. Store a group name if present.
    prototype.on = function (event, groupName, fn) {
        this.callbacks = this.callbacks || {};
        var hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    };

    // Adds an `event` listener that will be invoked a single
    // time then automatically removed.
    prototype.once = function (event, groupName, fn) {
        var self = this,
            hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        function on() {
            self.off(event, on);
            func.apply(this, arguments);
        }
        this.on(event, group, on);
        return this;
    };

    // Unbinds an entire group
    prototype.releaseGroup = function (groupName) {
        this.callbacks = this.callbacks || {};
        var item, i, len, handlers;
        for (item in this.callbacks) {
            handlers = this.callbacks[item];
            for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    //console.log('removing');
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    };

    // Remove the given callback for `event` or all
    // registered callbacks.
    prototype.off = function (event, fn) {
        this.callbacks = this.callbacks || {};
        var callbacks = this.callbacks[event],
            i;

        if (!callbacks) return this;

        // remove all handlers
        if (arguments.length === 1) {
            delete this.callbacks[event];
            return this;
        }

        // remove specific handler
        i = callbacks.indexOf(fn);
        if (i !== -1) {
            callbacks.splice(i, 1);
            if (callbacks.length === 0) {
                delete this.callbacks[event];
            }
        }
        return this;
    };

    /// Emit `event` with the given args.
    // also calls any `*` handlers
    prototype.emit = function (event) {
        this.callbacks = this.callbacks || {};
        var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event],
            specialCallbacks = this.getWildcardCallbacks(event),
            i,
            len,
            item,
            listeners;

        if (callbacks) {
            listeners = callbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }

        if (specialCallbacks) {
            len = specialCallbacks.length;
            listeners = specialCallbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }

        return this;
    };

    // Helper for for finding special wildcard event handlers that match the event
    prototype.getWildcardCallbacks = function (eventName) {
        this.callbacks = this.callbacks || {};
        var item,
            split,
            result = [];

        for (item in this.callbacks) {
            split = item.split('*');
            if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
    };

};

WildEmitter.mixin(WildEmitter);

},{}],38:[function(require,module,exports){
/*!
 * EventEmitter v5.2.9 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - https://oli.me.uk/
 * @preserve
 */

;(function (exports) {
    'use strict';

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    function isValidListener (listener) {
        if (typeof listener === 'function' || listener instanceof RegExp) {
            return true
        } else if (listener && typeof listener === 'object') {
            return isValidListener(listener.listener)
        } else {
            return false
        }
    }

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        if (!isValidListener(listener)) {
            throw new TypeError('listener must be a function');
        }

        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the first argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the first argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    }
                    else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        }
        else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        }
        else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        }
        else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listenersMap = this.getListenersAsObject(evt);
        var listeners;
        var listener;
        var i;
        var key;
        var response;

        for (key in listenersMap) {
            if (listenersMap.hasOwnProperty(key)) {
                listeners = listenersMap[key].slice(0);

                for (i = 0; i < listeners.length; i++) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        }
        else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return EventEmitter;
        });
    }
    else if (typeof module === 'object' && module.exports){
        module.exports = EventEmitter;
    }
    else {
        exports.EventEmitter = EventEmitter;
    }
}(typeof window !== 'undefined' ? window : this || {}));

},{}],39:[function(require,module,exports){
module.exports={
    "author": "OpenVidu",
    "dependencies": {
        "freeice": "2.2.2",
        "hark": "1.2.3",
        "jsnlog": "2.30.0",
        "mime": "3.0.0",
        "platform": "1.3.6",
        "semver": "7.3.5",
        "uuid": "8.3.2",
        "wolfy87-eventemitter": "5.2.9",
        "events": "3.3.0",
        "inherits": "2.0.4"
    },
    "description": "OpenVidu Browser",
    "devDependencies": {
        "@types/node": "17.0.8",
        "@types/platform": "1.3.4",
        "browserify": "17.0.0",
        "grunt": "1.4.1",
        "grunt-cli": "1.4.3",
        "grunt-contrib-copy": "1.0.0",
        "grunt-contrib-sass": "2.0.0",
        "grunt-contrib-uglify": "5.0.1",
        "grunt-contrib-watch": "1.1.0",
        "grunt-postcss": "0.9.0",
        "grunt-string-replace": "1.3.1",
        "grunt-ts": "6.0.0-beta.22",
        "terser": "5.10.0",
        "tsify": "5.0.4",
        "tslint": "6.1.3",
        "typedoc": "0.22.10",
        "typescript": "4.5.4"
    },
    "license": "Apache-2.0",
    "main": "lib/index.js",
    "name": "openvidu-browser",
    "repository": {
        "type": "git",
        "url": "git://github.com/OpenVidu/openvidu"
    },
    "scripts": {
        "browserify": "VERSION=${VERSION:-dev}; mkdir -p static/js/ && cd src && ../node_modules/browserify/bin/cmd.js Main.ts -p [ tsify ] --exclude kurento-browser-extensions --debug -o ../static/js/openvidu-browser-$VERSION.js -v",
        "browserify-prod": "VERSION=${VERSION:-dev}; mkdir -p static/js/ && cd src && ../node_modules/browserify/bin/cmd.js --debug Main.ts -p [ tsify ] --exclude kurento-browser-extensions | ../node_modules/terser/bin/terser --source-map content=inline --output ../static/js/openvidu-browser-$VERSION.min.js",
        "build": "cd src/OpenVidu && ./../../node_modules/typescript/bin/tsc && cd ../.. && ./node_modules/typescript/bin/tsc --declaration src/index.ts --outDir ./lib --sourceMap --target es5 --lib dom,es5,es2015.promise,scripthost && rm -rf ./ts4.4 && mkdir -p ./ts4.4/lib && cp -r ./lib ./ts4.4 && find ./ts4.4/lib -type f ! -iname '*.d.ts' -delete && ./config/replace_for_ts44.sh",
        "docs": "./generate-docs.sh"
    },
    "types": "lib/index.d.ts",
    "typesVersions": {
        "<4.4": {
            "*": [
                "ts4.4/*"
            ]
        }
    },
    "version": "2.21.0"
}

},{}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OpenVidu_1 = require("./OpenVidu/OpenVidu");
var jsnlog_1 = require("jsnlog");
if (window) {
    window['OpenVidu'] = OpenVidu_1.OpenVidu;
}
jsnlog_1.JL.setOptions({ enabled: false });

},{"./OpenVidu/OpenVidu":45,"jsnlog":7}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
var Stream_1 = require("./Stream");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var ExceptionEvent_1 = require("../OpenViduInternal/Events/ExceptionEvent");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var Connection = (function () {
    function Connection(session, connectionOptions) {
        this.session = session;
        this.disposed = false;
        var msg = "'Connection' created ";
        if (!!connectionOptions.role) {
            this.localOptions = connectionOptions;
            this.connectionId = this.localOptions.id;
            this.creationTime = this.localOptions.createdAt;
            this.data = this.localOptions.metadata;
            this.rpcSessionId = this.localOptions.sessionId;
            this.role = this.localOptions.role;
            this.record = this.localOptions.record;
            msg += '(local)';
        }
        else {
            this.remoteOptions = connectionOptions;
            this.connectionId = this.remoteOptions.id;
            this.creationTime = this.remoteOptions.createdAt;
            if (this.remoteOptions.metadata) {
                this.data = this.remoteOptions.metadata;
            }
            if (this.remoteOptions.streams) {
                this.initRemoteStreams(this.remoteOptions.streams);
            }
            msg += "(remote) with 'connectionId' [" + this.remoteOptions.id + ']';
        }
        logger.info(msg);
    }
    Connection.prototype.sendIceCandidate = function (candidate) {
        var _this = this;
        logger.debug((!!this.stream.outboundStreamOpts ? 'Local' : 'Remote') + 'candidate for' +
            this.connectionId, candidate);
        this.session.openvidu.sendRequest('onIceCandidate', {
            endpointName: this.connectionId,
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex
        }, function (error, response) {
            if (error) {
                logger.error('Error sending ICE candidate: ' + JSON.stringify(error));
                _this.session.emitEvent('exception', [new ExceptionEvent_1.ExceptionEvent(_this.session, ExceptionEvent_1.ExceptionEventName.ICE_CANDIDATE_ERROR, _this.session, "There was an unexpected error on the server-side processing an ICE candidate generated and sent by the client-side", error)]);
            }
        });
    };
    Connection.prototype.initRemoteStreams = function (options) {
        var _this = this;
        options.forEach(function (opts) {
            var streamOptions = {
                id: opts.id,
                createdAt: opts.createdAt,
                connection: _this,
                hasAudio: opts.hasAudio,
                hasVideo: opts.hasVideo,
                audioActive: opts.audioActive,
                videoActive: opts.videoActive,
                typeOfVideo: opts.typeOfVideo,
                frameRate: opts.frameRate,
                videoDimensions: !!opts.videoDimensions ? JSON.parse(opts.videoDimensions) : undefined,
                filter: !!opts.filter ? opts.filter : undefined
            };
            var stream = new Stream_1.Stream(_this.session, streamOptions);
            _this.addStream(stream);
        });
        logger.info("Remote 'Connection' with 'connectionId' [" + this.connectionId + '] is now configured for receiving Streams with options: ', this.stream.inboundStreamOpts);
    };
    Connection.prototype.addStream = function (stream) {
        stream.connection = this;
        this.stream = stream;
    };
    Connection.prototype.removeStream = function (streamId) {
        delete this.stream;
    };
    Connection.prototype.dispose = function () {
        if (!!this.stream) {
            delete this.stream;
        }
        this.disposed = true;
    };
    return Connection;
}());
exports.Connection = Connection;

},{"../OpenViduInternal/Events/ExceptionEvent":58,"../OpenViduInternal/Logger/OpenViduLogger":79,"./Stream":48}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDispatcher = void 0;
var EventEmitter = require("wolfy87-eventemitter");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var EventDispatcher = (function () {
    function EventDispatcher() {
        this.userHandlerArrowHandler = new WeakMap();
        this.ee = new EventEmitter();
    }
    EventDispatcher.prototype.onAux = function (type, message, handler) {
        var arrowHandler = function (event) {
            if (event) {
                logger.info(message, event);
            }
            else {
                logger.info(message);
            }
            handler(event);
        };
        this.userHandlerArrowHandler.set(handler, arrowHandler);
        this.ee.on(type, arrowHandler);
        return this;
    };
    EventDispatcher.prototype.onceAux = function (type, message, handler) {
        var _this = this;
        var arrowHandler = function (event) {
            if (event) {
                logger.info(message, event);
            }
            else {
                logger.info(message);
            }
            handler(event);
            _this.userHandlerArrowHandler.delete(handler);
        };
        this.userHandlerArrowHandler.set(handler, arrowHandler);
        this.ee.once(type, arrowHandler);
        return this;
    };
    EventDispatcher.prototype.offAux = function (type, handler) {
        if (!handler) {
            this.ee.removeAllListeners(type);
        }
        else {
            var arrowHandler = this.userHandlerArrowHandler.get(handler);
            if (!!arrowHandler) {
                this.ee.off(type, arrowHandler);
            }
            this.userHandlerArrowHandler.delete(handler);
        }
        return this;
    };
    return EventDispatcher;
}());
exports.EventDispatcher = EventDispatcher;

},{"../OpenViduInternal/Logger/OpenViduLogger":79,"wolfy87-eventemitter":38}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filter = void 0;
var StreamPropertyChangedEvent_1 = require("../OpenViduInternal/Events/StreamPropertyChangedEvent");
var OpenViduError_1 = require("../OpenViduInternal/Enums/OpenViduError");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var Filter = (function () {
    function Filter(type, options) {
        this.handlers = new Map();
        this.type = type;
        this.options = options;
    }
    Filter.prototype.execMethod = function (method, params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            logger.info('Executing filter method to stream ' + _this.stream.streamId);
            var stringParams;
            if (typeof params !== 'string') {
                try {
                    stringParams = JSON.stringify(params);
                }
                catch (error) {
                    var errorMsg = "'params' property must be a JSON formatted object";
                    logger.error(errorMsg);
                    return reject(errorMsg);
                }
            }
            else {
                stringParams = params;
            }
            _this.stream.session.openvidu.sendRequest('execFilterMethod', { streamId: _this.stream.streamId, method: method, params: stringParams }, function (error, response) {
                if (error) {
                    logger.error('Error executing filter method for Stream ' + _this.stream.streamId, error);
                    if (error.code === 401) {
                        return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to execute a filter method"));
                    }
                    else {
                        return reject(error);
                    }
                }
                else {
                    logger.info('Filter method successfully executed on Stream ' + _this.stream.streamId);
                    var oldValue = Object.assign({}, _this.stream.filter);
                    _this.stream.filter.lastExecMethod = { method: method, params: JSON.parse(stringParams) };
                    _this.stream.session.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.stream.session, _this.stream, 'filter', _this.stream.filter, oldValue, 'execFilterMethod')]);
                    _this.stream.streamManager.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.stream.streamManager, _this.stream, 'filter', _this.stream.filter, oldValue, 'execFilterMethod')]);
                    return resolve();
                }
            });
        });
    };
    Filter.prototype.addEventListener = function (eventType, handler) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            logger.info('Adding filter event listener to event ' + eventType + ' to stream ' + _this.stream.streamId);
            _this.stream.session.openvidu.sendRequest('addFilterEventListener', { streamId: _this.stream.streamId, eventType: eventType }, function (error, response) {
                if (error) {
                    logger.error('Error adding filter event listener to event ' + eventType + 'for Stream ' + _this.stream.streamId, error);
                    if (error.code === 401) {
                        return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to add a filter event listener"));
                    }
                    else {
                        return reject(error);
                    }
                }
                else {
                    _this.handlers.set(eventType, handler);
                    logger.info('Filter event listener to event ' + eventType + ' successfully applied on Stream ' + _this.stream.streamId);
                    return resolve();
                }
            });
        });
    };
    Filter.prototype.removeEventListener = function (eventType) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            logger.info('Removing filter event listener to event ' + eventType + ' to stream ' + _this.stream.streamId);
            _this.stream.session.openvidu.sendRequest('removeFilterEventListener', { streamId: _this.stream.streamId, eventType: eventType }, function (error, response) {
                if (error) {
                    logger.error('Error removing filter event listener to event ' + eventType + 'for Stream ' + _this.stream.streamId, error);
                    if (error.code === 401) {
                        return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to add a filter event listener"));
                    }
                    else {
                        return reject(error);
                    }
                }
                else {
                    _this.handlers.delete(eventType);
                    logger.info('Filter event listener to event ' + eventType + ' successfully removed on Stream ' + _this.stream.streamId);
                    return resolve();
                }
            });
        });
    };
    return Filter;
}());
exports.Filter = Filter;

},{"../OpenViduInternal/Enums/OpenViduError":52,"../OpenViduInternal/Events/StreamPropertyChangedEvent":67,"../OpenViduInternal/Logger/OpenViduLogger":79}],44:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalRecorder = void 0;
var LocalRecorderState_1 = require("../OpenViduInternal/Enums/LocalRecorderState");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var Platform_1 = require("../OpenViduInternal/Utils/Platform");
var Mime = require("mime/lite");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
var LocalRecorder = (function () {
    function LocalRecorder(stream) {
        this.stream = stream;
        this.chunks = [];
        platform = Platform_1.PlatformUtils.getInstance();
        this.connectionId = (!!this.stream.connection) ? this.stream.connection.connectionId : 'default-connection';
        this.id = this.stream.streamId + '_' + this.connectionId + '_localrecord';
        this.state = LocalRecorderState_1.LocalRecorderState.READY;
    }
    LocalRecorder.prototype.record = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (typeof options === 'string' || options instanceof String) {
                    return reject("When calling LocalRecorder.record(options) parameter 'options' cannot be a string. Must be an object like { mimeType: \"".concat(options, "\" }"));
                }
                if (typeof MediaRecorder === 'undefined') {
                    logger.error('MediaRecorder not supported on your device. See compatibility in https://caniuse.com/#search=MediaRecorder');
                    throw (Error('MediaRecorder not supported on your device. See compatibility in https://caniuse.com/#search=MediaRecorder'));
                }
                if (_this.state !== LocalRecorderState_1.LocalRecorderState.READY) {
                    throw (Error('\'LocalRecord.record()\' needs \'LocalRecord.state\' to be \'READY\' (current value: \'' + _this.state + '\'). Call \'LocalRecorder.clean()\' or init a new LocalRecorder before'));
                }
                logger.log("Starting local recording of stream '" + _this.stream.streamId + "' of connection '" + _this.connectionId + "'");
                if (!options) {
                    options = { mimeType: 'video/webm' };
                }
                else if (!options.mimeType) {
                    options.mimeType = 'video/webm';
                }
                _this.mediaRecorder = new MediaRecorder(_this.stream.getMediaStream(), options);
                _this.mediaRecorder.start();
            }
            catch (err) {
                return reject(err);
            }
            _this.mediaRecorder.ondataavailable = function (e) {
                if (e.data.size > 0) {
                    _this.chunks.push(e.data);
                }
            };
            _this.mediaRecorder.onerror = function (e) {
                logger.error('MediaRecorder error: ', e);
            };
            _this.mediaRecorder.onstart = function () {
                logger.log('MediaRecorder started (state=' + _this.mediaRecorder.state + ')');
            };
            _this.mediaRecorder.onstop = function () {
                _this.onStopDefault();
            };
            _this.mediaRecorder.onpause = function () {
                logger.log('MediaRecorder paused (state=' + _this.mediaRecorder.state + ')');
            };
            _this.mediaRecorder.onresume = function () {
                logger.log('MediaRecorder resumed (state=' + _this.mediaRecorder.state + ')');
            };
            _this.state = LocalRecorderState_1.LocalRecorderState.RECORDING;
            return resolve();
        });
    };
    LocalRecorder.prototype.stop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this.state === LocalRecorderState_1.LocalRecorderState.READY || _this.state === LocalRecorderState_1.LocalRecorderState.FINISHED) {
                    throw (Error('\'LocalRecord.stop()\' needs \'LocalRecord.state\' to be \'RECORDING\' or \'PAUSED\' (current value: \'' + _this.state + '\'). Call \'LocalRecorder.start()\' before'));
                }
                _this.mediaRecorder.onstop = function () {
                    _this.onStopDefault();
                    return resolve();
                };
                _this.mediaRecorder.stop();
            }
            catch (e) {
                return reject(e);
            }
        });
    };
    LocalRecorder.prototype.pause = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this.state !== LocalRecorderState_1.LocalRecorderState.RECORDING) {
                    return reject(Error('\'LocalRecord.pause()\' needs \'LocalRecord.state\' to be \'RECORDING\' (current value: \'' + _this.state + '\'). Call \'LocalRecorder.start()\' or \'LocalRecorder.resume()\' before'));
                }
                _this.mediaRecorder.pause();
                _this.state = LocalRecorderState_1.LocalRecorderState.PAUSED;
                return resolve();
            }
            catch (error) {
                return reject(error);
            }
        });
    };
    LocalRecorder.prototype.resume = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                if (_this.state !== LocalRecorderState_1.LocalRecorderState.PAUSED) {
                    throw (Error('\'LocalRecord.resume()\' needs \'LocalRecord.state\' to be \'PAUSED\' (current value: \'' + _this.state + '\'). Call \'LocalRecorder.pause()\' before'));
                }
                _this.mediaRecorder.resume();
                _this.state = LocalRecorderState_1.LocalRecorderState.RECORDING;
                return resolve();
            }
            catch (error) {
                return reject(error);
            }
        });
    };
    LocalRecorder.prototype.preview = function (parentElement) {
        if (this.state !== LocalRecorderState_1.LocalRecorderState.FINISHED) {
            throw (Error('\'LocalRecord.preview()\' needs \'LocalRecord.state\' to be \'FINISHED\' (current value: \'' + this.state + '\'). Call \'LocalRecorder.stop()\' before'));
        }
        this.videoPreview = document.createElement('video');
        this.videoPreview.id = this.id;
        this.videoPreview.autoplay = true;
        if (platform.isSafariBrowser()) {
            this.videoPreview.setAttribute('playsinline', 'true');
        }
        if (typeof parentElement === 'string') {
            var parentElementDom = document.getElementById(parentElement);
            if (parentElementDom) {
                this.videoPreview = parentElementDom.appendChild(this.videoPreview);
            }
        }
        else {
            this.videoPreview = parentElement.appendChild(this.videoPreview);
        }
        this.videoPreview.src = this.videoPreviewSrc;
        return this.videoPreview;
    };
    LocalRecorder.prototype.clean = function () {
        var _this = this;
        var f = function () {
            delete _this.blob;
            _this.chunks = [];
            _this.state = LocalRecorderState_1.LocalRecorderState.READY;
        };
        if (this.state === LocalRecorderState_1.LocalRecorderState.RECORDING || this.state === LocalRecorderState_1.LocalRecorderState.PAUSED) {
            this.stop().then(function () { return f(); }).catch(function () { return f(); });
        }
        else {
            f();
        }
    };
    LocalRecorder.prototype.download = function () {
        if (this.state !== LocalRecorderState_1.LocalRecorderState.FINISHED) {
            throw (Error('\'LocalRecord.download()\' needs \'LocalRecord.state\' to be \'FINISHED\' (current value: \'' + this.state + '\'). Call \'LocalRecorder.stop()\' before'));
        }
        else {
            var a = document.createElement('a');
            a.style.display = 'none';
            document.body.appendChild(a);
            var url = window.URL.createObjectURL(this.blob);
            a.href = url;
            a.download = this.id + '.' + Mime.getExtension(this.blob.type);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    };
    LocalRecorder.prototype.getBlob = function () {
        if (this.state !== LocalRecorderState_1.LocalRecorderState.FINISHED) {
            throw (Error('Call \'LocalRecord.stop()\' before getting Blob file'));
        }
        else {
            return this.blob;
        }
    };
    LocalRecorder.prototype.uploadAsBinary = function (endpoint, headers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.state !== LocalRecorderState_1.LocalRecorderState.FINISHED) {
                return reject(Error('\'LocalRecord.uploadAsBinary()\' needs \'LocalRecord.state\' to be \'FINISHED\' (current value: \'' + _this.state + '\'). Call \'LocalRecorder.stop()\' before'));
            }
            else {
                var http_1 = new XMLHttpRequest();
                http_1.open('POST', endpoint, true);
                if (typeof headers === 'object') {
                    for (var _i = 0, _a = Object.keys(headers); _i < _a.length; _i++) {
                        var key = _a[_i];
                        http_1.setRequestHeader(key, headers[key]);
                    }
                }
                http_1.onreadystatechange = function () {
                    if (http_1.readyState === 4) {
                        if (http_1.status.toString().charAt(0) === '2') {
                            return resolve(http_1.responseText);
                        }
                        else {
                            return reject(http_1.status);
                        }
                    }
                };
                http_1.send(_this.blob);
            }
        });
    };
    LocalRecorder.prototype.uploadAsMultipartfile = function (endpoint, headers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.state !== LocalRecorderState_1.LocalRecorderState.FINISHED) {
                return reject(Error('\'LocalRecord.uploadAsMultipartfile()\' needs \'LocalRecord.state\' to be \'FINISHED\' (current value: \'' + _this.state + '\'). Call \'LocalRecorder.stop()\' before'));
            }
            else {
                var http_2 = new XMLHttpRequest();
                http_2.open('POST', endpoint, true);
                if (typeof headers === 'object') {
                    for (var _i = 0, _a = Object.keys(headers); _i < _a.length; _i++) {
                        var key = _a[_i];
                        http_2.setRequestHeader(key, headers[key]);
                    }
                }
                var sendable = new FormData();
                sendable.append('file', _this.blob, _this.id + '.' + Mime.getExtension(_this.blob.type));
                http_2.onreadystatechange = function () {
                    if (http_2.readyState === 4) {
                        if (http_2.status.toString().charAt(0) === '2') {
                            return resolve(http_2.responseText);
                        }
                        else {
                            return reject(http_2.status);
                        }
                    }
                };
                http_2.send(sendable);
            }
        });
    };
    LocalRecorder.prototype.onStopDefault = function () {
        logger.log('MediaRecorder stopped  (state=' + this.mediaRecorder.state + ')');
        this.blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType });
        this.chunks = [];
        this.videoPreviewSrc = window.URL.createObjectURL(this.blob);
        this.state = LocalRecorderState_1.LocalRecorderState.FINISHED;
    };
    return LocalRecorder;
}());
exports.LocalRecorder = LocalRecorder;

},{"../OpenViduInternal/Enums/LocalRecorderState":51,"../OpenViduInternal/Logger/OpenViduLogger":79,"../OpenViduInternal/Utils/Platform":83,"mime/lite":9}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenVidu = void 0;
var LocalRecorder_1 = require("./LocalRecorder");
var Publisher_1 = require("./Publisher");
var Session_1 = require("./Session");
var SessionDisconnectedEvent_1 = require("../OpenViduInternal/Events/SessionDisconnectedEvent");
var StreamPropertyChangedEvent_1 = require("../OpenViduInternal/Events/StreamPropertyChangedEvent");
var OpenViduError_1 = require("../OpenViduInternal/Enums/OpenViduError");
var VideoInsertMode_1 = require("../OpenViduInternal/Enums/VideoInsertMode");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var Platform_1 = require("../OpenViduInternal/Utils/Platform");
var screenSharingAuto = require("../OpenViduInternal/ScreenSharing/Screen-Capturing-Auto");
var screenSharing = require("../OpenViduInternal/ScreenSharing/Screen-Capturing");
var OpenViduLoggerConfiguration_1 = require("../OpenViduInternal/Logger/OpenViduLoggerConfiguration");
var EventEmitter = require("wolfy87-eventemitter");
var RpcBuilder = require("../OpenViduInternal/KurentoUtils/kurento-jsonrpc");
var packageJson = require('../../package.json');
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
var OpenVidu = (function () {
    function OpenVidu() {
        var _this = this;
        this.masterNodeHasCrashed = false;
        this.publishers = [];
        this.secret = '';
        this.recorder = false;
        this.life = -1;
        this.advancedConfiguration = {};
        this.webrtcStatsInterval = -1;
        this.sendBrowserLogs = OpenViduLoggerConfiguration_1.OpenViduLoggerConfiguration.disabled;
        this.isPro = false;
        this.ee = new EventEmitter();
        platform = Platform_1.PlatformUtils.getInstance();
        this.libraryVersion = packageJson.version;
        logger.info("OpenVidu initialized");
        logger.info('Platform detected: ' + platform.getDescription());
        logger.info('openvidu-browser version: ' + this.libraryVersion);
        if (platform.isMobileDevice() || platform.isReactNative()) {
            this.onOrientationChanged(function () {
                _this.publishers.forEach(function (publisher) {
                    if (publisher.stream.isLocalStreamPublished && !!publisher.stream && !!publisher.stream.hasVideo) {
                        _this.sendNewVideoDimensionsIfRequired(publisher, 'deviceRotated', 75, 10);
                    }
                });
            });
        }
    }
    OpenVidu.prototype.initSession = function () {
        this.session = new Session_1.Session(this);
        return this.session;
    };
    OpenVidu.prototype.initPublisher = function (targetElement, param2, param3) {
        var properties;
        if (!!param2 && (typeof param2 !== 'function')) {
            properties = param2;
            properties = {
                audioSource: (typeof properties.audioSource !== 'undefined') ? properties.audioSource : undefined,
                frameRate: (typeof MediaStreamTrack !== 'undefined' && properties.videoSource instanceof MediaStreamTrack) ? undefined : ((typeof properties.frameRate !== 'undefined') ? properties.frameRate : undefined),
                insertMode: (typeof properties.insertMode !== 'undefined') ? ((typeof properties.insertMode === 'string') ? VideoInsertMode_1.VideoInsertMode[properties.insertMode] : properties.insertMode) : VideoInsertMode_1.VideoInsertMode.APPEND,
                mirror: (typeof properties.mirror !== 'undefined') ? properties.mirror : true,
                publishAudio: (typeof properties.publishAudio !== 'undefined') ? properties.publishAudio : true,
                publishVideo: (typeof properties.publishVideo !== 'undefined') ? properties.publishVideo : true,
                resolution: (typeof MediaStreamTrack !== 'undefined' && properties.videoSource instanceof MediaStreamTrack) ? undefined : ((typeof properties.resolution !== 'undefined') ? properties.resolution : '640x480'),
                videoSource: (typeof properties.videoSource !== 'undefined') ? properties.videoSource : undefined,
                videoSimulcast: properties.videoSimulcast,
                filter: properties.filter
            };
        }
        else {
            properties = {
                insertMode: VideoInsertMode_1.VideoInsertMode.APPEND,
                mirror: true,
                publishAudio: true,
                publishVideo: true,
                resolution: '640x480'
            };
        }
        var publisher = new Publisher_1.Publisher(targetElement, properties, this);
        var completionHandler;
        if (!!param2 && (typeof param2 === 'function')) {
            completionHandler = param2;
        }
        else if (!!param3) {
            completionHandler = param3;
        }
        publisher.initialize()
            .then(function () {
            if (completionHandler !== undefined) {
                completionHandler(undefined);
            }
            publisher.emitEvent('accessAllowed', []);
        }).catch(function (error) {
            if (completionHandler !== undefined) {
                completionHandler(error);
            }
            publisher.emitEvent('accessDenied', [error]);
        });
        this.publishers.push(publisher);
        return publisher;
    };
    OpenVidu.prototype.initPublisherAsync = function (targetElement, properties) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var publisher;
            var callback = function (error) {
                if (!!error) {
                    return reject(error);
                }
                else {
                    return resolve(publisher);
                }
            };
            if (!!properties) {
                publisher = _this.initPublisher(targetElement, properties, callback);
            }
            else {
                publisher = _this.initPublisher(targetElement, callback);
            }
        });
    };
    OpenVidu.prototype.initLocalRecorder = function (stream) {
        return new LocalRecorder_1.LocalRecorder(stream);
    };
    OpenVidu.prototype.checkSystemRequirements = function () {
        if (platform.isIPhoneOrIPad()) {
            if (platform.isIOSWithSafari() || platform.isIonicIos() ||
                platform.isChromeMobileBrowser() || platform.isEdgeMobileBrowser() || platform.isOperaMobileBrowser() || platform.isFirefoxMobileBrowser()) {
                return 1;
            }
            return 0;
        }
        if (platform.isChromeBrowser() || platform.isChromeMobileBrowser() ||
            platform.isFirefoxBrowser() || platform.isFirefoxMobileBrowser() || platform.isOperaBrowser() ||
            platform.isOperaMobileBrowser() || platform.isEdgeBrowser() || platform.isEdgeMobileBrowser() ||
            platform.isSafariBrowser() || platform.isAndroidBrowser() || platform.isElectron() || platform.isSamsungBrowser()) {
            return 1;
        }
        return 0;
    };
    OpenVidu.prototype.checkScreenSharingCapabilities = function () {
        return platform.canScreenShare();
    };
    OpenVidu.prototype.getDevices = function () {
        return new Promise(function (resolve, reject) {
            navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
                var _a;
                var devices = [];
                if (platform.isIonicAndroid() && typeof cordova != "undefined" && ((_a = cordova === null || cordova === void 0 ? void 0 : cordova.plugins) === null || _a === void 0 ? void 0 : _a.EnumerateDevicesPlugin)) {
                    cordova.plugins.EnumerateDevicesPlugin.getEnumerateDevices().then(function (pluginDevices) {
                        var pluginAudioDevices = [];
                        var videoDevices = [];
                        var audioDevices = [];
                        pluginAudioDevices = pluginDevices.filter(function (device) { return device.kind === 'audioinput'; });
                        videoDevices = deviceInfos.filter(function (device) { return device.kind === 'videoinput'; });
                        audioDevices = deviceInfos.filter(function (device) { return device.kind === 'audioinput'; });
                        videoDevices.forEach(function (deviceInfo, index) {
                            if (!deviceInfo.label) {
                                var label = "";
                                if (index === 0) {
                                    label = "Front Camera";
                                }
                                else if (index === 1) {
                                    label = "Back Camera";
                                }
                                else {
                                    label = "Unknown Camera";
                                }
                                devices.push({
                                    kind: deviceInfo.kind,
                                    deviceId: deviceInfo.deviceId,
                                    label: label
                                });
                            }
                            else {
                                devices.push({
                                    kind: deviceInfo.kind,
                                    deviceId: deviceInfo.deviceId,
                                    label: deviceInfo.label
                                });
                            }
                        });
                        audioDevices.forEach(function (deviceInfo, index) {
                            if (!deviceInfo.label) {
                                var label = "";
                                switch (index) {
                                    case 0:
                                        label = 'Default';
                                        break;
                                    case 1:
                                        var defaultMatch = pluginAudioDevices.filter(function (d) { return d.label.includes('Built'); })[0];
                                        label = defaultMatch ? defaultMatch.label : 'Built-in Microphone';
                                        break;
                                    case 2:
                                        var wiredMatch = pluginAudioDevices.filter(function (d) { return d.label.includes('Wired'); })[0];
                                        if (wiredMatch) {
                                            label = wiredMatch.label;
                                        }
                                        else {
                                            label = 'Headset earpiece';
                                        }
                                        break;
                                    case 3:
                                        var wirelessMatch = pluginAudioDevices.filter(function (d) { return d.label.includes('Bluetooth'); })[0];
                                        label = wirelessMatch ? wirelessMatch.label : 'Wireless';
                                        break;
                                    default:
                                        label = "Unknown Microphone";
                                        break;
                                }
                                devices.push({
                                    kind: deviceInfo.kind,
                                    deviceId: deviceInfo.deviceId,
                                    label: label
                                });
                            }
                            else {
                                devices.push({
                                    kind: deviceInfo.kind,
                                    deviceId: deviceInfo.deviceId,
                                    label: deviceInfo.label
                                });
                            }
                        });
                        return resolve(devices);
                    });
                }
                else {
                    deviceInfos.forEach(function (deviceInfo) {
                        if (deviceInfo.kind === 'audioinput' || deviceInfo.kind === 'videoinput') {
                            devices.push({
                                kind: deviceInfo.kind,
                                deviceId: deviceInfo.deviceId,
                                label: deviceInfo.label
                            });
                        }
                    });
                    return resolve(devices);
                }
            }).catch(function (error) {
                logger.error('Error getting devices', error);
                return reject(error);
            });
        });
    };
    OpenVidu.prototype.getUserMedia = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var askForAudioStreamOnly = function (previousMediaStream, constraints) {
                var definedAudioConstraint = ((constraints.audio === undefined) ? true : constraints.audio);
                var constraintsAux = { audio: definedAudioConstraint, video: false };
                navigator.mediaDevices.getUserMedia(constraintsAux)
                    .then(function (audioOnlyStream) {
                    previousMediaStream.addTrack(audioOnlyStream.getAudioTracks()[0]);
                    return resolve(previousMediaStream);
                })
                    .catch(function (error) {
                    previousMediaStream.getAudioTracks().forEach(function (track) {
                        track.stop();
                    });
                    previousMediaStream.getVideoTracks().forEach(function (track) {
                        track.stop();
                    });
                    return reject(_this.generateAudioDeviceError(error, constraintsAux));
                });
            };
            _this.generateMediaConstraints(options).then(function (myConstraints) {
                var _a, _b;
                if (!!myConstraints.videoTrack && !!myConstraints.audioTrack ||
                    !!myConstraints.audioTrack && ((_a = myConstraints.constraints) === null || _a === void 0 ? void 0 : _a.video) === false ||
                    !!myConstraints.videoTrack && ((_b = myConstraints.constraints) === null || _b === void 0 ? void 0 : _b.audio) === false) {
                    return resolve(_this.addAlreadyProvidedTracks(myConstraints, new MediaStream()));
                }
                else {
                    if (!!myConstraints.videoTrack) {
                        delete myConstraints.constraints.video;
                    }
                    if (!!myConstraints.audioTrack) {
                        delete myConstraints.constraints.audio;
                    }
                    var mustAskForAudioTrackLater_1 = false;
                    if (typeof options.videoSource === 'string') {
                        if (options.videoSource === 'screen' ||
                            options.videoSource === 'window' ||
                            (platform.isElectron() && options.videoSource.startsWith('screen:'))) {
                            mustAskForAudioTrackLater_1 = !myConstraints.audioTrack && (options.audioSource !== null && options.audioSource !== false);
                            if (navigator.mediaDevices['getDisplayMedia'] && !platform.isElectron()) {
                                navigator.mediaDevices['getDisplayMedia']({ video: true })
                                    .then(function (mediaStream) {
                                    _this.addAlreadyProvidedTracks(myConstraints, mediaStream);
                                    if (mustAskForAudioTrackLater_1) {
                                        askForAudioStreamOnly(mediaStream, myConstraints.constraints);
                                        return;
                                    }
                                    else {
                                        return resolve(mediaStream);
                                    }
                                })
                                    .catch(function (error) {
                                    var errorName = OpenViduError_1.OpenViduErrorName.SCREEN_CAPTURE_DENIED;
                                    var errorMessage = error.toString();
                                    return reject(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                                });
                                return;
                            }
                            else {
                            }
                        }
                        else {
                        }
                    }
                    var constraintsAux = mustAskForAudioTrackLater_1 ? { video: myConstraints.constraints.video } : myConstraints.constraints;
                    navigator.mediaDevices.getUserMedia(constraintsAux)
                        .then(function (mediaStream) {
                        _this.addAlreadyProvidedTracks(myConstraints, mediaStream);
                        if (mustAskForAudioTrackLater_1) {
                            askForAudioStreamOnly(mediaStream, myConstraints.constraints);
                            return;
                        }
                        else {
                            return resolve(mediaStream);
                        }
                    })
                        .catch(function (error) {
                        var errorName;
                        var errorMessage = error.toString();
                        if (!(options.videoSource === 'screen')) {
                            errorName = OpenViduError_1.OpenViduErrorName.DEVICE_ACCESS_DENIED;
                        }
                        else {
                            errorName = OpenViduError_1.OpenViduErrorName.SCREEN_CAPTURE_DENIED;
                        }
                        return reject(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                    });
                }
            }).catch(function (error) { return reject(error); });
        });
    };
    OpenVidu.prototype.enableProdMode = function () {
        logger.enableProdMode();
    };
    OpenVidu.prototype.setAdvancedConfiguration = function (configuration) {
        this.advancedConfiguration = configuration;
    };
    OpenVidu.prototype.onOrientationChanged = function (handler) {
        window.addEventListener('orientationchange', handler);
    };
    OpenVidu.prototype.sendNewVideoDimensionsIfRequired = function (publisher, reason, WAIT_INTERVAL, MAX_ATTEMPTS) {
        var _this = this;
        var attempts = 0;
        var oldWidth = publisher.stream.videoDimensions.width;
        var oldHeight = publisher.stream.videoDimensions.height;
        var repeatUntilChangeOrMaxAttempts = setInterval(function () {
            attempts++;
            if (attempts > MAX_ATTEMPTS) {
                clearTimeout(repeatUntilChangeOrMaxAttempts);
            }
            publisher.getVideoDimensions(publisher.stream.getMediaStream()).then(function (newDimensions) {
                if (newDimensions.width !== oldWidth || newDimensions.height !== oldHeight) {
                    clearTimeout(repeatUntilChangeOrMaxAttempts);
                    _this.sendVideoDimensionsChangedEvent(publisher, reason, oldWidth, oldHeight, newDimensions.width, newDimensions.height);
                }
            });
        }, WAIT_INTERVAL);
    };
    OpenVidu.prototype.sendVideoDimensionsChangedEvent = function (publisher, reason, oldWidth, oldHeight, newWidth, newHeight) {
        var _this = this;
        publisher.stream.videoDimensions = {
            width: newWidth || 0,
            height: newHeight || 0
        };
        this.sendRequest('streamPropertyChanged', {
            streamId: publisher.stream.streamId,
            property: 'videoDimensions',
            newValue: JSON.stringify(publisher.stream.videoDimensions),
            reason: reason
        }, function (error, response) {
            if (error) {
                logger.error("Error sending 'streamPropertyChanged' event", error);
            }
            else {
                _this.session.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.session, publisher.stream, 'videoDimensions', publisher.stream.videoDimensions, { width: oldWidth, height: oldHeight }, reason)]);
                publisher.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(publisher, publisher.stream, 'videoDimensions', publisher.stream.videoDimensions, { width: oldWidth, height: oldHeight }, reason)]);
                _this.session.sendVideoData(publisher);
            }
        });
    };
    ;
    OpenVidu.prototype.generateMediaConstraints = function (publisherProperties) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var myConstraints = {
                audioTrack: undefined,
                videoTrack: undefined,
                constraints: {
                    audio: undefined,
                    video: undefined
                }
            };
            var audioSource = publisherProperties.audioSource;
            var videoSource = publisherProperties.videoSource;
            if (audioSource === null || audioSource === false) {
                myConstraints.constraints.audio = false;
            }
            if (videoSource === null || videoSource === false) {
                myConstraints.constraints.video = false;
            }
            if (myConstraints.constraints.audio === false && myConstraints.constraints.video === false) {
                return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.NO_INPUT_SOURCE_SET, "Properties 'audioSource' and 'videoSource' cannot be set to false or null at the same time"));
            }
            if (typeof MediaStreamTrack !== 'undefined' && audioSource instanceof MediaStreamTrack) {
                myConstraints.audioTrack = audioSource;
            }
            if (typeof MediaStreamTrack !== 'undefined' && videoSource instanceof MediaStreamTrack) {
                myConstraints.videoTrack = videoSource;
            }
            if (audioSource === undefined) {
                myConstraints.constraints.audio = true;
            }
            if (videoSource === undefined) {
                myConstraints.constraints.video = {
                    width: {
                        ideal: 640
                    },
                    height: {
                        ideal: 480
                    }
                };
            }
            if (videoSource !== null && videoSource !== false) {
                if (!!publisherProperties.resolution) {
                    var widthAndHeight = publisherProperties.resolution.toLowerCase().split('x');
                    var idealWidth = Number(widthAndHeight[0]);
                    var idealHeight = Number(widthAndHeight[1]);
                    myConstraints.constraints.video = {
                        width: {
                            ideal: idealWidth
                        },
                        height: {
                            ideal: idealHeight
                        }
                    };
                }
                if (!!publisherProperties.frameRate) {
                    myConstraints.constraints.video.frameRate = { ideal: publisherProperties.frameRate };
                }
            }
            _this.configureDeviceIdOrScreensharing(myConstraints, publisherProperties, resolve, reject);
            return resolve(myConstraints);
        });
    };
    OpenVidu.prototype.startWs = function (onConnectSucces) {
        var config = {
            heartbeat: 5000,
            ws: {
                uri: this.wsUri + '?sessionId=' + this.session.sessionId,
                onconnected: onConnectSucces,
                ondisconnect: this.disconnectCallback.bind(this),
                onreconnecting: this.reconnectingCallback.bind(this),
                onreconnected: this.reconnectedCallback.bind(this),
                ismasternodecrashed: this.isMasterNodeCrashed.bind(this)
            },
            rpc: {
                requestTimeout: 10000,
                heartbeatRequestTimeout: 5000,
                participantJoined: this.session.onParticipantJoined.bind(this.session),
                participantPublished: this.session.onParticipantPublished.bind(this.session),
                participantUnpublished: this.session.onParticipantUnpublished.bind(this.session),
                participantLeft: this.session.onParticipantLeft.bind(this.session),
                participantEvicted: this.session.onParticipantEvicted.bind(this.session),
                recordingStarted: this.session.onRecordingStarted.bind(this.session),
                recordingStopped: this.session.onRecordingStopped.bind(this.session),
                sendMessage: this.session.onNewMessage.bind(this.session),
                streamPropertyChanged: this.session.onStreamPropertyChanged.bind(this.session),
                connectionPropertyChanged: this.session.onConnectionPropertyChanged.bind(this.session),
                networkQualityLevelChanged: this.session.onNetworkQualityLevelChangedChanged.bind(this.session),
                filterEventDispatched: this.session.onFilterEventDispatched.bind(this.session),
                iceCandidate: this.session.recvIceCandidate.bind(this.session),
                mediaError: this.session.onMediaError.bind(this.session),
                masterNodeCrashedNotification: this.onMasterNodeCrashedNotification.bind(this),
                forciblyReconnectSubscriber: this.session.onForciblyReconnectSubscriber.bind(this.session)
            }
        };
        this.jsonRpcClient = new RpcBuilder.clients.JsonRpcClient(config);
    };
    OpenVidu.prototype.onMasterNodeCrashedNotification = function (response) {
        console.error('Master Node has crashed');
        this.masterNodeHasCrashed = true;
        this.session.onLostConnection("nodeCrashed");
        this.jsonRpcClient.close(4103, "Master Node has crashed");
    };
    OpenVidu.prototype.getWsReadyState = function () {
        return this.jsonRpcClient.getReadyState();
    };
    OpenVidu.prototype.closeWs = function () {
        this.jsonRpcClient.close(4102, "Connection closed by client");
    };
    OpenVidu.prototype.sendRequest = function (method, params, callback) {
        if (params && params instanceof Function) {
            callback = params;
            params = {};
        }
        logger.debug('Sending request: {method:"' + method + '", params: ' + JSON.stringify(params) + '}');
        this.jsonRpcClient.send(method, params, callback);
    };
    OpenVidu.prototype.getWsUri = function () {
        return this.wsUri;
    };
    OpenVidu.prototype.getSecret = function () {
        return this.secret;
    };
    OpenVidu.prototype.getRecorder = function () {
        return this.recorder;
    };
    OpenVidu.prototype.generateAudioDeviceError = function (error, constraints) {
        if (error.name === 'Error') {
            error.name = error.constructor.name;
        }
        var errorName, errorMessage;
        switch (error.name.toLowerCase()) {
            case 'notfounderror':
                errorName = OpenViduError_1.OpenViduErrorName.INPUT_AUDIO_DEVICE_NOT_FOUND;
                errorMessage = error.toString();
                return new OpenViduError_1.OpenViduError(errorName, errorMessage);
            case 'notallowederror':
                errorName = OpenViduError_1.OpenViduErrorName.DEVICE_ACCESS_DENIED;
                errorMessage = error.toString();
                return new OpenViduError_1.OpenViduError(errorName, errorMessage);
            case 'overconstrainederror':
                if (error.constraint.toLowerCase() === 'deviceid') {
                    errorName = OpenViduError_1.OpenViduErrorName.INPUT_AUDIO_DEVICE_NOT_FOUND;
                    errorMessage = "Audio input device with deviceId '" + constraints.audio.deviceId.exact + "' not found";
                }
                else {
                    errorName = OpenViduError_1.OpenViduErrorName.PUBLISHER_PROPERTIES_ERROR;
                    errorMessage = "Audio input device doesn't support the value passed for constraint '" + error.constraint + "'";
                }
                return new OpenViduError_1.OpenViduError(errorName, errorMessage);
            case 'notreadableerror':
                errorName = OpenViduError_1.OpenViduErrorName.DEVICE_ALREADY_IN_USE;
                errorMessage = error.toString();
                return (new OpenViduError_1.OpenViduError(errorName, errorMessage));
            default:
                return new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.INPUT_AUDIO_DEVICE_GENERIC_ERROR, error.toString());
        }
    };
    OpenVidu.prototype.addAlreadyProvidedTracks = function (myConstraints, mediaStream) {
        if (!!myConstraints.videoTrack) {
            mediaStream.addTrack(myConstraints.videoTrack);
        }
        if (!!myConstraints.audioTrack) {
            mediaStream.addTrack(myConstraints.audioTrack);
        }
        return mediaStream;
    };
    OpenVidu.prototype.configureDeviceIdOrScreensharing = function (myConstraints, publisherProperties, resolve, reject) {
        var _this = this;
        var audioSource = publisherProperties.audioSource;
        var videoSource = publisherProperties.videoSource;
        if (typeof audioSource === 'string') {
            myConstraints.constraints.audio = { deviceId: { exact: audioSource } };
        }
        if (typeof videoSource === 'string') {
            if (!this.isScreenShare(videoSource)) {
                this.setVideoSource(myConstraints, videoSource);
            }
            else {
                if (!this.checkScreenSharingCapabilities()) {
                    var error = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.SCREEN_SHARING_NOT_SUPPORTED, 'You can only screen share in desktop Chrome, Firefox, Opera, Safari (>=13.0), Edge (>= 80) or Electron. Detected client: ' + platform.getName() + ' ' + platform.getVersion());
                    logger.error(error);
                    return reject(error);
                }
                else {
                    if (platform.isElectron()) {
                        var prefix = "screen:";
                        var videoSourceString = videoSource;
                        var electronScreenId = videoSourceString.substr(videoSourceString.indexOf(prefix) + prefix.length);
                        myConstraints.constraints.video = {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: electronScreenId
                            }
                        };
                        return resolve(myConstraints);
                    }
                    else {
                        if (!!this.advancedConfiguration.screenShareChromeExtension && !(platform.isFirefoxBrowser() || platform.isFirefoxMobileBrowser()) && !navigator.mediaDevices['getDisplayMedia']) {
                            screenSharing.getScreenConstraints(function (error, screenConstraints) {
                                if (!!error || !!screenConstraints.mandatory && screenConstraints.mandatory.chromeMediaSource === 'screen') {
                                    if (error === 'permission-denied' || error === 'PermissionDeniedError') {
                                        var error_1 = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.SCREEN_CAPTURE_DENIED, 'You must allow access to one window of your desktop');
                                        logger.error(error_1);
                                        return reject(error_1);
                                    }
                                    else {
                                        var extensionId = _this.advancedConfiguration.screenShareChromeExtension.split('/').pop().trim();
                                        screenSharing.getChromeExtensionStatus(extensionId, function (status) {
                                            if (status === 'installed-disabled') {
                                                var error_2 = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.SCREEN_EXTENSION_DISABLED, 'You must enable the screen extension');
                                                logger.error(error_2);
                                                return reject(error_2);
                                            }
                                            if (status === 'not-installed') {
                                                var error_3 = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.SCREEN_EXTENSION_NOT_INSTALLED, _this.advancedConfiguration.screenShareChromeExtension);
                                                logger.error(error_3);
                                                return reject(error_3);
                                            }
                                        });
                                        return;
                                    }
                                }
                                else {
                                    myConstraints.constraints.video = screenConstraints;
                                    return resolve(myConstraints);
                                }
                            });
                            return;
                        }
                        else {
                            if (navigator.mediaDevices['getDisplayMedia']) {
                                return resolve(myConstraints);
                            }
                            else {
                                var firefoxString = (platform.isFirefoxBrowser() || platform.isFirefoxMobileBrowser()) ? publisherProperties.videoSource : undefined;
                                screenSharingAuto.getScreenId(firefoxString, function (error, sourceId, screenConstraints) {
                                    if (!!error) {
                                        if (error === 'not-installed') {
                                            var extensionUrl = !!_this.advancedConfiguration.screenShareChromeExtension ? _this.advancedConfiguration.screenShareChromeExtension :
                                                'https://chrome.google.com/webstore/detail/openvidu-screensharing/lfcgfepafnobdloecchnfaclibenjold';
                                            var err = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.SCREEN_EXTENSION_NOT_INSTALLED, extensionUrl);
                                            logger.error(err);
                                            return reject(err);
                                        }
                                        else if (error === 'installed-disabled') {
                                            var err = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.SCREEN_EXTENSION_DISABLED, 'You must enable the screen extension');
                                            logger.error(err);
                                            return reject(err);
                                        }
                                        else if (error === 'permission-denied') {
                                            var err = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.SCREEN_CAPTURE_DENIED, 'You must allow access to one window of your desktop');
                                            logger.error(err);
                                            return reject(err);
                                        }
                                        else {
                                            var err = new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.GENERIC_ERROR, 'Unknown error when accessing screen share');
                                            logger.error(err);
                                            logger.error(error);
                                            return reject(err);
                                        }
                                    }
                                    else {
                                        myConstraints.constraints.video = screenConstraints.video;
                                        return resolve(myConstraints);
                                    }
                                });
                                return;
                            }
                        }
                    }
                }
            }
        }
    };
    OpenVidu.prototype.setVideoSource = function (myConstraints, videoSource) {
        if (!myConstraints.constraints.video) {
            myConstraints.constraints.video = {};
        }
        myConstraints.constraints.video['deviceId'] = { exact: videoSource };
    };
    OpenVidu.prototype.disconnectCallback = function () {
        logger.warn('Websocket connection lost');
        if (this.isRoomAvailable()) {
            this.session.onLostConnection('networkDisconnect');
        }
        else {
            alert('Connection error. Please reload page.');
        }
    };
    OpenVidu.prototype.reconnectingCallback = function () {
        logger.warn('Websocket connection lost (reconnecting)');
        if (!this.isRoomAvailable()) {
            alert('Connection error. Please reload page.');
        }
        else {
            this.session.emitEvent('reconnecting', []);
        }
    };
    OpenVidu.prototype.reconnectWebsocketThroughRpcConnectMethod = function (rpcSessionId) {
        var _this = this;
        this.sendRequest('connect', { sessionId: rpcSessionId, reconnect: true }, function (error, response) {
            if (!!error) {
                if (_this.isMasterNodeCrashed()) {
                    logger.warn('Master Node has crashed!');
                }
                else {
                    logger.error(error);
                    var notifyLostConnection_1 = function (reason, errorMsg) {
                        logger.warn(errorMsg);
                        _this.session.onLostConnection(reason);
                        _this.jsonRpcClient.close(4101, "Reconnection fault: " + errorMsg);
                    };
                    var rpcSessionStatus = function () {
                        if (_this.life === -1) {
                            notifyLostConnection_1('networkDisconnect', 'WS successfully reconnected but the user was already evicted due to timeout');
                        }
                        else {
                            _this.sendRequest('sessionStatus', { sessionId: _this.session.sessionId }, function (error, response) {
                                if (error != null) {
                                    console.error('Error checking session status', error);
                                }
                                else {
                                    if (_this.life === response.life) {
                                        notifyLostConnection_1('networkDisconnect', 'WS successfully reconnected but the user was already evicted due to timeout');
                                    }
                                    else {
                                        notifyLostConnection_1('nodeCrashed', 'WS successfully reconnected to OpenVidu Server but your Master Node crashed');
                                    }
                                }
                            });
                        }
                    };
                    if (error.code === 40007 && error.message === 'reconnection error') {
                        console.error('Invalid RPC sessionId. Client network disconnection or Master Node crash');
                        rpcSessionStatus();
                    }
                    else {
                        rpcSessionStatus();
                    }
                }
            }
            else {
                _this.jsonRpcClient.resetPing();
                _this.session.onRecoveredConnection();
            }
        });
    };
    OpenVidu.prototype.reconnectedCallback = function () {
        logger.warn('Websocket reconnected');
        if (this.isRoomAvailable()) {
            if (!!this.session.connection) {
                this.reconnectWebsocketThroughRpcConnectMethod(this.session.connection.rpcSessionId);
            }
            else {
                logger.warn('There was no previous connection when running reconnection callback');
                var sessionDisconnectEvent = new SessionDisconnectedEvent_1.SessionDisconnectedEvent(this.session, 'networkDisconnect');
                this.session.ee.emitEvent('sessionDisconnected', [sessionDisconnectEvent]);
                sessionDisconnectEvent.callDefaultBehavior();
            }
        }
        else {
            alert('Connection error. Please reload page.');
        }
    };
    OpenVidu.prototype.isMasterNodeCrashed = function () {
        return this.masterNodeHasCrashed;
    };
    OpenVidu.prototype.isRoomAvailable = function () {
        if (this.session !== undefined && this.session instanceof Session_1.Session) {
            return true;
        }
        else {
            logger.warn('Session instance not found');
            return false;
        }
    };
    OpenVidu.prototype.isScreenShare = function (videoSource) {
        return videoSource === 'screen' ||
            videoSource === 'window' ||
            (platform.isElectron() && videoSource.startsWith('screen:'));
    };
    return OpenVidu;
}());
exports.OpenVidu = OpenVidu;

},{"../../package.json":39,"../OpenViduInternal/Enums/OpenViduError":52,"../OpenViduInternal/Enums/VideoInsertMode":54,"../OpenViduInternal/Events/SessionDisconnectedEvent":63,"../OpenViduInternal/Events/StreamPropertyChangedEvent":67,"../OpenViduInternal/KurentoUtils/kurento-jsonrpc":74,"../OpenViduInternal/Logger/OpenViduLogger":79,"../OpenViduInternal/Logger/OpenViduLoggerConfiguration":80,"../OpenViduInternal/ScreenSharing/Screen-Capturing":82,"../OpenViduInternal/ScreenSharing/Screen-Capturing-Auto":81,"../OpenViduInternal/Utils/Platform":83,"./LocalRecorder":44,"./Publisher":46,"./Session":47,"wolfy87-eventemitter":38}],46:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Publisher = void 0;
var Session_1 = require("./Session");
var Stream_1 = require("./Stream");
var StreamManager_1 = require("./StreamManager");
var StreamEvent_1 = require("../OpenViduInternal/Events/StreamEvent");
var StreamPropertyChangedEvent_1 = require("../OpenViduInternal/Events/StreamPropertyChangedEvent");
var OpenViduError_1 = require("../OpenViduInternal/Enums/OpenViduError");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var Platform_1 = require("../OpenViduInternal/Utils/Platform");
var TypeOfVideo_1 = require("../OpenViduInternal/Enums/TypeOfVideo");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
var Publisher = (function (_super) {
    __extends(Publisher, _super);
    function Publisher(targEl, properties, openvidu) {
        var _this = _super.call(this, new Stream_1.Stream((!!openvidu.session) ? openvidu.session : new Session_1.Session(openvidu), { publisherProperties: properties, mediaConstraints: {} }), targEl) || this;
        _this.accessAllowed = false;
        _this.isSubscribedToRemote = false;
        _this.accessDenied = false;
        platform = Platform_1.PlatformUtils.getInstance();
        _this.properties = properties;
        _this.openvidu = openvidu;
        _this.stream.ee.on('local-stream-destroyed', function (reason) {
            _this.stream.isLocalStreamPublished = false;
            var streamEvent = new StreamEvent_1.StreamEvent(true, _this, 'streamDestroyed', _this.stream, reason);
            _this.emitEvent('streamDestroyed', [streamEvent]);
            streamEvent.callDefaultBehavior();
        });
        return _this;
    }
    Publisher.prototype.publishAudio = function (value) {
        var _this = this;
        if (this.stream.audioActive !== value) {
            var affectedMediaStream = this.stream.displayMyRemote() ? this.stream.localMediaStreamWhenSubscribedToRemote : this.stream.getMediaStream();
            affectedMediaStream.getAudioTracks().forEach(function (track) {
                track.enabled = value;
            });
            if (!!this.session && !!this.stream.streamId) {
                this.session.openvidu.sendRequest('streamPropertyChanged', {
                    streamId: this.stream.streamId,
                    property: 'audioActive',
                    newValue: value,
                    reason: 'publishAudio'
                }, function (error, response) {
                    if (error) {
                        logger.error("Error sending 'streamPropertyChanged' event", error);
                    }
                    else {
                        _this.session.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.session, _this.stream, 'audioActive', value, !value, 'publishAudio')]);
                        _this.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this, _this.stream, 'audioActive', value, !value, 'publishAudio')]);
                        _this.session.sendVideoData(_this.stream.streamManager);
                    }
                });
            }
            this.stream.audioActive = value;
            logger.info("'Publisher' has " + (value ? 'published' : 'unpublished') + ' its audio stream');
        }
    };
    Publisher.prototype.publishVideo = function (value) {
        var _this = this;
        if (this.stream.videoActive !== value) {
            var affectedMediaStream = this.stream.displayMyRemote() ? this.stream.localMediaStreamWhenSubscribedToRemote : this.stream.getMediaStream();
            affectedMediaStream.getVideoTracks().forEach(function (track) {
                track.enabled = value;
            });
            if (!!this.session && !!this.stream.streamId) {
                this.session.openvidu.sendRequest('streamPropertyChanged', {
                    streamId: this.stream.streamId,
                    property: 'videoActive',
                    newValue: value,
                    reason: 'publishVideo'
                }, function (error, response) {
                    if (error) {
                        logger.error("Error sending 'streamPropertyChanged' event", error);
                    }
                    else {
                        _this.session.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.session, _this.stream, 'videoActive', value, !value, 'publishVideo')]);
                        _this.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this, _this.stream, 'videoActive', value, !value, 'publishVideo')]);
                        _this.session.sendVideoData(_this.stream.streamManager);
                    }
                });
            }
            this.stream.videoActive = value;
            logger.info("'Publisher' has " + (value ? 'published' : 'unpublished') + ' its video stream');
        }
    };
    Publisher.prototype.subscribeToRemote = function (value) {
        value = (value !== undefined) ? value : true;
        this.isSubscribedToRemote = value;
        this.stream.subscribeToMyRemote(value);
    };
    Publisher.prototype.on = function (type, handler) {
        var _this = this;
        _super.prototype.on.call(this, type, handler);
        if (type === 'streamCreated') {
            if (!!this.stream && this.stream.isLocalStreamPublished) {
                this.emitEvent('streamCreated', [new StreamEvent_1.StreamEvent(false, this, 'streamCreated', this.stream, '')]);
            }
            else {
                this.stream.ee.on('stream-created-by-publisher', function () {
                    _this.emitEvent('streamCreated', [new StreamEvent_1.StreamEvent(false, _this, 'streamCreated', _this.stream, '')]);
                });
            }
        }
        if (type === 'accessAllowed') {
            if (this.accessAllowed) {
                this.emitEvent('accessAllowed', []);
            }
        }
        if (type === 'accessDenied') {
            if (this.accessDenied) {
                this.emitEvent('accessDenied', []);
            }
        }
        return this;
    };
    Publisher.prototype.once = function (type, handler) {
        var _this = this;
        _super.prototype.once.call(this, type, handler);
        if (type === 'streamCreated') {
            if (!!this.stream && this.stream.isLocalStreamPublished) {
                this.emitEvent('streamCreated', [new StreamEvent_1.StreamEvent(false, this, 'streamCreated', this.stream, '')]);
            }
            else {
                this.stream.ee.once('stream-created-by-publisher', function () {
                    _this.emitEvent('streamCreated', [new StreamEvent_1.StreamEvent(false, _this, 'streamCreated', _this.stream, '')]);
                });
            }
        }
        if (type === 'accessAllowed') {
            if (this.accessAllowed) {
                this.emitEvent('accessAllowed', []);
            }
        }
        if (type === 'accessDenied') {
            if (this.accessDenied) {
                this.emitEvent('accessDenied', []);
            }
        }
        return this;
    };
    Publisher.prototype.off = function (type, handler) {
        _super.prototype.off.call(this, type, handler);
        return this;
    };
    Publisher.prototype.replaceTrack = function (track) {
        return __awaiter(this, void 0, void 0, function () {
            var replaceTrackInMediaStream, replaceTrackInRtcRtpSender, trackOriginalEnabledValue, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        replaceTrackInMediaStream = function () {
                            return new Promise(function (resolve, reject) {
                                var mediaStream = _this.stream.displayMyRemote() ? _this.stream.localMediaStreamWhenSubscribedToRemote : _this.stream.getMediaStream();
                                var removedTrack;
                                if (track.kind === 'video') {
                                    removedTrack = mediaStream.getVideoTracks()[0];
                                }
                                else {
                                    removedTrack = mediaStream.getAudioTracks()[0];
                                }
                                mediaStream.removeTrack(removedTrack);
                                removedTrack.stop();
                                mediaStream.addTrack(track);
                                if (track.kind === 'video' && _this.stream.isLocalStreamPublished) {
                                    _this.openvidu.sendNewVideoDimensionsIfRequired(_this, 'trackReplaced', 50, 30);
                                    _this.session.sendVideoData(_this.stream.streamManager, 5, true, 5);
                                }
                                return resolve();
                            });
                        };
                        replaceTrackInRtcRtpSender = function () {
                            return new Promise(function (resolve, reject) {
                                var senders = _this.stream.getRTCPeerConnection().getSenders();
                                var sender;
                                if (track.kind === 'video') {
                                    sender = senders.find(function (s) { return !!s.track && s.track.kind === 'video'; });
                                    if (!sender) {
                                        return reject(new Error('There\'s no replaceable track for that kind of MediaStreamTrack in this Publisher object'));
                                    }
                                }
                                else if (track.kind === 'audio') {
                                    sender = senders.find(function (s) { return !!s.track && s.track.kind === 'audio'; });
                                    if (!sender) {
                                        return reject(new Error('There\'s no replaceable track for that kind of MediaStreamTrack in this Publisher object'));
                                    }
                                }
                                else {
                                    return reject(new Error('Unknown track kind ' + track.kind));
                                }
                                sender.replaceTrack(track)
                                    .then(function () { return resolve(); })
                                    .catch(function (error) { return reject(error); });
                            });
                        };
                        trackOriginalEnabledValue = track.enabled;
                        if (track.kind === 'video') {
                            track.enabled = this.stream.videoActive;
                        }
                        else if (track.kind === 'audio') {
                            track.enabled = this.stream.audioActive;
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        if (!this.stream.isLocalStreamPublished) return [3, 4];
                        return [4, replaceTrackInRtcRtpSender()];
                    case 2:
                        _a.sent();
                        return [4, replaceTrackInMediaStream()];
                    case 3: return [2, _a.sent()];
                    case 4: return [4, replaceTrackInMediaStream()];
                    case 5: return [2, _a.sent()];
                    case 6: return [3, 8];
                    case 7:
                        error_1 = _a.sent();
                        track.enabled = trackOriginalEnabledValue;
                        throw error_1;
                    case 8: return [2];
                }
            });
        });
    };
    Publisher.prototype.initialize = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var constraints = {};
            var constraintsAux = {};
            var timeForDialogEvent = 2000;
            var startTime;
            var errorCallback = function (openViduError) {
                _this.accessDenied = true;
                _this.accessAllowed = false;
                logger.error("Publisher initialization failed. ".concat(openViduError.name, ": ").concat(openViduError.message));
                return reject(openViduError);
            };
            var successCallback = function (mediaStream) {
                var _a, _b;
                _this.accessAllowed = true;
                _this.accessDenied = false;
                if (typeof MediaStreamTrack !== 'undefined' && _this.properties.audioSource instanceof MediaStreamTrack) {
                    mediaStream.removeTrack(mediaStream.getAudioTracks()[0]);
                    mediaStream.addTrack(_this.properties.audioSource);
                }
                if (typeof MediaStreamTrack !== 'undefined' && _this.properties.videoSource instanceof MediaStreamTrack) {
                    mediaStream.removeTrack(mediaStream.getVideoTracks()[0]);
                    mediaStream.addTrack(_this.properties.videoSource);
                }
                if (!!mediaStream.getAudioTracks()[0]) {
                    var enabled = (_this.stream.audioActive !== undefined && _this.stream.audioActive !== null) ? _this.stream.audioActive : !!_this.stream.outboundStreamOpts.publisherProperties.publishAudio;
                    mediaStream.getAudioTracks()[0].enabled = enabled;
                }
                if (!!mediaStream.getVideoTracks()[0]) {
                    var enabled = (_this.stream.videoActive !== undefined && _this.stream.videoActive !== null) ? _this.stream.videoActive : !!_this.stream.outboundStreamOpts.publisherProperties.publishVideo;
                    mediaStream.getVideoTracks()[0].enabled = enabled;
                }
                for (var _i = 0, _c = mediaStream.getAudioTracks(); _i < _c.length; _i++) {
                    var track = _c[_i];
                    if (!((_a = track.contentHint) === null || _a === void 0 ? void 0 : _a.length)) {
                        track.contentHint = "";
                        logger.info("Audio track Content Hint set: '".concat(track.contentHint, "'"));
                    }
                }
                for (var _d = 0, _e = mediaStream.getVideoTracks(); _d < _e.length; _d++) {
                    var track = _e[_d];
                    if (!((_b = track.contentHint) === null || _b === void 0 ? void 0 : _b.length)) {
                        switch (_this.stream.typeOfVideo) {
                            case TypeOfVideo_1.TypeOfVideo.SCREEN:
                                track.contentHint = "detail";
                                break;
                            case TypeOfVideo_1.TypeOfVideo.CUSTOM:
                                logger.warn("CUSTOM type video track was provided without Content Hint!");
                                track.contentHint = "motion";
                                break;
                            case TypeOfVideo_1.TypeOfVideo.CAMERA:
                            case TypeOfVideo_1.TypeOfVideo.IPCAM:
                            default:
                                track.contentHint = "motion";
                                break;
                        }
                        logger.info("Video track Content Hint set: '".concat(track.contentHint, "'"));
                    }
                }
                _this.initializeVideoReference(mediaStream);
                if (!_this.stream.displayMyRemote()) {
                    _this.stream.updateMediaStreamInVideos();
                }
                delete _this.firstVideoElement;
                if (_this.stream.isSendVideo()) {
                    _this.getVideoDimensions(mediaStream).then(function (dimensions) {
                        _this.stream.videoDimensions = {
                            width: dimensions.width,
                            height: dimensions.height
                        };
                        if (_this.stream.isSendScreen()) {
                            _this.screenShareResizeInterval = setInterval(function () {
                                var settings = mediaStream.getVideoTracks()[0].getSettings();
                                var newWidth = settings.width;
                                var newHeight = settings.height;
                                if (_this.stream.isLocalStreamPublished &&
                                    (newWidth !== _this.stream.videoDimensions.width || newHeight !== _this.stream.videoDimensions.height)) {
                                    _this.openvidu.sendVideoDimensionsChangedEvent(_this, 'screenResized', _this.stream.videoDimensions.width, _this.stream.videoDimensions.height, newWidth || 0, newHeight || 0);
                                }
                            }, 650);
                        }
                        _this.stream.isLocalStreamReadyToPublish = true;
                        _this.stream.ee.emitEvent('stream-ready-to-publish', []);
                    });
                }
                else {
                    _this.stream.isLocalStreamReadyToPublish = true;
                    _this.stream.ee.emitEvent('stream-ready-to-publish', []);
                }
                return resolve();
            };
            var getMediaSuccess = function (mediaStream, definedAudioConstraint) {
                _this.clearPermissionDialogTimer(startTime, timeForDialogEvent);
                if (_this.stream.isSendScreen() && _this.stream.isSendAudio()) {
                    constraintsAux.audio = definedAudioConstraint;
                    constraintsAux.video = false;
                    startTime = Date.now();
                    _this.setPermissionDialogTimer(timeForDialogEvent);
                    navigator.mediaDevices.getUserMedia(constraintsAux)
                        .then(function (audioOnlyStream) {
                        _this.clearPermissionDialogTimer(startTime, timeForDialogEvent);
                        mediaStream.addTrack(audioOnlyStream.getAudioTracks()[0]);
                        successCallback(mediaStream);
                    })
                        .catch(function (error) {
                        _this.clearPermissionDialogTimer(startTime, timeForDialogEvent);
                        mediaStream.getAudioTracks().forEach(function (track) {
                            track.stop();
                        });
                        mediaStream.getVideoTracks().forEach(function (track) {
                            track.stop();
                        });
                        errorCallback(_this.openvidu.generateAudioDeviceError(error, constraints));
                        return;
                    });
                }
                else {
                    successCallback(mediaStream);
                }
            };
            var getMediaError = function (error) {
                logger.error("getMediaError: ".concat(error.toString()));
                _this.clearPermissionDialogTimer(startTime, timeForDialogEvent);
                if (error.name === 'Error') {
                    error.name = error.constructor.name;
                }
                var errorName, errorMessage;
                switch (error.name.toLowerCase()) {
                    case 'notfounderror':
                        navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: constraints.video
                        })
                            .then(function (mediaStream) {
                            mediaStream.getVideoTracks().forEach(function (track) {
                                track.stop();
                            });
                            errorName = OpenViduError_1.OpenViduErrorName.INPUT_AUDIO_DEVICE_NOT_FOUND;
                            errorMessage = error.toString();
                            errorCallback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                        }).catch(function (e) {
                            errorName = OpenViduError_1.OpenViduErrorName.INPUT_VIDEO_DEVICE_NOT_FOUND;
                            errorMessage = error.toString();
                            errorCallback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                        });
                        break;
                    case 'notallowederror':
                        errorName = _this.stream.isSendScreen() ? OpenViduError_1.OpenViduErrorName.SCREEN_CAPTURE_DENIED : OpenViduError_1.OpenViduErrorName.DEVICE_ACCESS_DENIED;
                        errorMessage = error.toString();
                        errorCallback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                        break;
                    case 'overconstrainederror':
                        navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: constraints.video
                        })
                            .then(function (mediaStream) {
                            mediaStream.getVideoTracks().forEach(function (track) {
                                track.stop();
                            });
                            if (error.constraint.toLowerCase() === 'deviceid') {
                                errorName = OpenViduError_1.OpenViduErrorName.INPUT_AUDIO_DEVICE_NOT_FOUND;
                                errorMessage = "Audio input device with deviceId '" + constraints.audio.deviceId.exact + "' not found";
                            }
                            else {
                                errorName = OpenViduError_1.OpenViduErrorName.PUBLISHER_PROPERTIES_ERROR;
                                errorMessage = "Audio input device doesn't support the value passed for constraint '" + error.constraint + "'";
                            }
                            errorCallback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                        }).catch(function (e) {
                            if (error.constraint.toLowerCase() === 'deviceid') {
                                errorName = OpenViduError_1.OpenViduErrorName.INPUT_VIDEO_DEVICE_NOT_FOUND;
                                errorMessage = "Video input device with deviceId '" + constraints.video.deviceId.exact + "' not found";
                            }
                            else {
                                errorName = OpenViduError_1.OpenViduErrorName.PUBLISHER_PROPERTIES_ERROR;
                                errorMessage = "Video input device doesn't support the value passed for constraint '" + error.constraint + "'";
                            }
                            errorCallback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                        });
                        break;
                    case 'aborterror':
                    case 'notreadableerror':
                        errorName = OpenViduError_1.OpenViduErrorName.DEVICE_ALREADY_IN_USE;
                        errorMessage = error.toString();
                        errorCallback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                        break;
                    default:
                        errorName = OpenViduError_1.OpenViduErrorName.GENERIC_ERROR;
                        errorMessage = error.toString();
                        errorCallback(new OpenViduError_1.OpenViduError(errorName, errorMessage));
                        break;
                }
            };
            _this.openvidu.generateMediaConstraints(_this.properties)
                .then(function (myConstraints) {
                var _a, _b;
                if (!!myConstraints.videoTrack && !!myConstraints.audioTrack ||
                    !!myConstraints.audioTrack && ((_a = myConstraints.constraints) === null || _a === void 0 ? void 0 : _a.video) === false ||
                    !!myConstraints.videoTrack && ((_b = myConstraints.constraints) === null || _b === void 0 ? void 0 : _b.audio) === false) {
                    successCallback(_this.openvidu.addAlreadyProvidedTracks(myConstraints, new MediaStream()));
                    return;
                }
                constraints = myConstraints.constraints;
                var outboundStreamOptions = {
                    mediaConstraints: constraints,
                    publisherProperties: _this.properties
                };
                _this.stream.setOutboundStreamOptions(outboundStreamOptions);
                var definedAudioConstraint = ((constraints.audio === undefined) ? true : constraints.audio);
                constraintsAux.audio = _this.stream.isSendScreen() ? false : definedAudioConstraint;
                constraintsAux.video = constraints.video;
                startTime = Date.now();
                _this.setPermissionDialogTimer(timeForDialogEvent);
                if (_this.stream.isSendScreen() && navigator.mediaDevices['getDisplayMedia'] && !platform.isElectron()) {
                    navigator.mediaDevices['getDisplayMedia']({ video: true })
                        .then(function (mediaStream) {
                        _this.openvidu.addAlreadyProvidedTracks(myConstraints, mediaStream);
                        getMediaSuccess(mediaStream, definedAudioConstraint);
                    })
                        .catch(function (error) {
                        getMediaError(error);
                    });
                }
                else {
                    navigator.mediaDevices.getUserMedia(constraintsAux)
                        .then(function (mediaStream) {
                        _this.openvidu.addAlreadyProvidedTracks(myConstraints, mediaStream);
                        getMediaSuccess(mediaStream, definedAudioConstraint);
                    })
                        .catch(function (error) {
                        getMediaError(error);
                    });
                }
            })
                .catch(function (error) {
                errorCallback(error);
            });
        });
    };
    Publisher.prototype.getVideoDimensions = function (mediaStream) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var requiresDomInsertion = platform.isIonicIos() || platform.isIOSWithSafari();
            var loadedmetadataListener;
            var resolveDimensions = function () {
                var width;
                var height;
                if (typeof _this.stream.getMediaStream().getVideoTracks()[0].getSettings === 'function') {
                    var settings = _this.stream.getMediaStream().getVideoTracks()[0].getSettings();
                    width = settings.width || _this.videoReference.videoWidth;
                    height = settings.height || _this.videoReference.videoHeight;
                }
                else {
                    logger.warn('MediaStreamTrack does not have getSettings method on ' + platform.getDescription());
                    width = _this.videoReference.videoWidth;
                    height = _this.videoReference.videoHeight;
                }
                if (loadedmetadataListener != null) {
                    _this.videoReference.removeEventListener('loadedmetadata', loadedmetadataListener);
                }
                if (requiresDomInsertion) {
                    document.body.removeChild(_this.videoReference);
                }
                return resolve({ width: width, height: height });
            };
            if (_this.videoReference.readyState >= 1) {
                resolveDimensions();
            }
            else {
                loadedmetadataListener = function () {
                    if (!_this.videoReference.videoWidth) {
                        var interval_1 = setInterval(function () {
                            if (!!_this.videoReference.videoWidth) {
                                clearInterval(interval_1);
                                resolveDimensions();
                            }
                        }, 40);
                    }
                    else {
                        resolveDimensions();
                    }
                };
                _this.videoReference.addEventListener('loadedmetadata', loadedmetadataListener);
                if (requiresDomInsertion) {
                    document.body.appendChild(_this.videoReference);
                }
            }
        });
    };
    Publisher.prototype.reestablishStreamPlayingEvent = function () {
        if (this.ee.getListeners('streamPlaying').length > 0) {
            this.addPlayEventToFirstVideo();
        }
    };
    Publisher.prototype.initializeVideoReference = function (mediaStream) {
        this.videoReference = document.createElement('video');
        this.videoReference.setAttribute('muted', 'true');
        this.videoReference.style.display = 'none';
        if (platform.isSafariBrowser() || (platform.isIPhoneOrIPad() && (platform.isChromeMobileBrowser() || platform.isEdgeMobileBrowser() || platform.isOperaMobileBrowser() || platform.isFirefoxMobileBrowser()))) {
            this.videoReference.setAttribute('playsinline', 'true');
        }
        this.stream.setMediaStream(mediaStream);
        if (!!this.firstVideoElement) {
            this.createVideoElement(this.firstVideoElement.targetElement, this.properties.insertMode);
        }
        this.videoReference.srcObject = mediaStream;
    };
    Publisher.prototype.setPermissionDialogTimer = function (waitTime) {
        var _this = this;
        this.permissionDialogTimeout = setTimeout(function () {
            _this.emitEvent('accessDialogOpened', []);
        }, waitTime);
    };
    Publisher.prototype.clearPermissionDialogTimer = function (startTime, waitTime) {
        clearTimeout(this.permissionDialogTimeout);
        if ((Date.now() - startTime) > waitTime) {
            this.emitEvent('accessDialogClosed', []);
        }
    };
    return Publisher;
}(StreamManager_1.StreamManager));
exports.Publisher = Publisher;

},{"../OpenViduInternal/Enums/OpenViduError":52,"../OpenViduInternal/Enums/TypeOfVideo":53,"../OpenViduInternal/Events/StreamEvent":65,"../OpenViduInternal/Events/StreamPropertyChangedEvent":67,"../OpenViduInternal/Logger/OpenViduLogger":79,"../OpenViduInternal/Utils/Platform":83,"./Session":47,"./Stream":48,"./StreamManager":49}],47:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
var Connection_1 = require("./Connection");
var Filter_1 = require("./Filter");
var Subscriber_1 = require("./Subscriber");
var EventDispatcher_1 = require("./EventDispatcher");
var ConnectionEvent_1 = require("../OpenViduInternal/Events/ConnectionEvent");
var FilterEvent_1 = require("../OpenViduInternal/Events/FilterEvent");
var RecordingEvent_1 = require("../OpenViduInternal/Events/RecordingEvent");
var SessionDisconnectedEvent_1 = require("../OpenViduInternal/Events/SessionDisconnectedEvent");
var SignalEvent_1 = require("../OpenViduInternal/Events/SignalEvent");
var StreamEvent_1 = require("../OpenViduInternal/Events/StreamEvent");
var StreamPropertyChangedEvent_1 = require("../OpenViduInternal/Events/StreamPropertyChangedEvent");
var ConnectionPropertyChangedEvent_1 = require("../OpenViduInternal/Events/ConnectionPropertyChangedEvent");
var NetworkQualityLevelChangedEvent_1 = require("../OpenViduInternal/Events/NetworkQualityLevelChangedEvent");
var OpenViduError_1 = require("../OpenViduInternal/Enums/OpenViduError");
var VideoInsertMode_1 = require("../OpenViduInternal/Enums/VideoInsertMode");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var Platform_1 = require("../OpenViduInternal/Utils/Platform");
var semverMajor = require("semver/functions/major");
var semverMinor = require("semver/functions/minor");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
var Session = (function (_super) {
    __extends(Session, _super);
    function Session(openvidu) {
        var _this = _super.call(this) || this;
        _this.streamManagers = [];
        _this.remoteStreamsCreated = new Map();
        _this.remoteConnections = new Map();
        platform = Platform_1.PlatformUtils.getInstance();
        _this.openvidu = openvidu;
        return _this;
    }
    Session.prototype.connect = function (token, metadata) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.processToken(token);
            if (_this.openvidu.checkSystemRequirements()) {
                _this.options = {
                    sessionId: _this.sessionId,
                    participantId: token,
                    metadata: !!metadata ? _this.stringClientMetadata(metadata) : ''
                };
                _this.connectAux(token)
                    .then(function () { return resolve(); })
                    .catch(function (error) { return reject(error); });
            }
            else {
                return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.BROWSER_NOT_SUPPORTED, 'Browser ' + platform.getName() + ' (version ' + platform.getVersion() + ') for ' + platform.getFamily() + ' is not supported in OpenVidu'));
            }
        });
    };
    Session.prototype.disconnect = function () {
        this.leave(false, 'disconnect');
    };
    Session.prototype.subscribe = function (stream, targetElement, param3, param4) {
        var properties = {};
        if (!!param3 && typeof param3 !== 'function') {
            properties = {
                insertMode: (typeof param3.insertMode !== 'undefined') ? ((typeof param3.insertMode === 'string') ? VideoInsertMode_1.VideoInsertMode[param3.insertMode] : properties.insertMode) : VideoInsertMode_1.VideoInsertMode.APPEND,
                subscribeToAudio: (typeof param3.subscribeToAudio !== 'undefined') ? param3.subscribeToAudio : true,
                subscribeToVideo: (typeof param3.subscribeToVideo !== 'undefined') ? param3.subscribeToVideo : true
            };
        }
        else {
            properties = {
                insertMode: VideoInsertMode_1.VideoInsertMode.APPEND,
                subscribeToAudio: true,
                subscribeToVideo: true
            };
        }
        var completionHandler = undefined;
        if (!!param3 && (typeof param3 === 'function')) {
            completionHandler = param3;
        }
        else if (!!param4) {
            completionHandler = param4;
        }
        if (!this.sessionConnected()) {
            if (completionHandler !== undefined) {
                completionHandler(this.notConnectedError());
            }
            throw this.notConnectedError();
        }
        logger.info('Subscribing to ' + stream.connection.connectionId);
        stream.subscribe()
            .then(function () {
            logger.info('Subscribed correctly to ' + stream.connection.connectionId);
            if (completionHandler !== undefined) {
                completionHandler(undefined);
            }
        })
            .catch(function (error) {
            if (completionHandler !== undefined) {
                completionHandler(error);
            }
        });
        var subscriber = new Subscriber_1.Subscriber(stream, targetElement, properties);
        if (!!subscriber.targetElement) {
            stream.streamManager.createVideoElement(subscriber.targetElement, properties.insertMode);
        }
        return subscriber;
    };
    Session.prototype.subscribeAsync = function (stream, targetElement, properties) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.sessionConnected()) {
                return reject(_this.notConnectedError());
            }
            var subscriber;
            var callback = function (error) {
                if (!!error) {
                    return reject(error);
                }
                else {
                    return resolve(subscriber);
                }
            };
            if (!!properties) {
                subscriber = _this.subscribe(stream, targetElement, properties, callback);
            }
            else {
                subscriber = _this.subscribe(stream, targetElement, callback);
            }
        });
    };
    Session.prototype.unsubscribe = function (subscriber) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.sessionConnected()) {
                return reject(_this.notConnectedError());
            }
            else {
                var connectionId_1 = subscriber.stream.connection.connectionId;
                logger.info('Unsubscribing from ' + connectionId_1);
                _this.openvidu.sendRequest('unsubscribeFromVideo', { sender: subscriber.stream.connection.connectionId }, function (error, response) {
                    if (error) {
                        logger.error('Error unsubscribing from ' + connectionId_1);
                        return reject(error);
                    }
                    else {
                        logger.info('Unsubscribed correctly from ' + connectionId_1);
                        subscriber.stream.streamManager.removeAllVideos();
                        subscriber.stream.disposeWebRtcPeer();
                        subscriber.stream.disposeMediaStream();
                        return resolve();
                    }
                });
            }
        });
    };
    Session.prototype.publish = function (publisher) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.sessionConnected()) {
                return reject(_this.notConnectedError());
            }
            publisher.session = _this;
            publisher.stream.session = _this;
            if (!publisher.stream.publishedOnce) {
                _this.connection.addStream(publisher.stream);
                publisher.stream.publish()
                    .then(function () {
                    _this.sendVideoData(publisher, 8, true, 5);
                    return resolve();
                })
                    .catch(function (error) { return reject(error); });
            }
            else {
                publisher.initialize()
                    .then(function () {
                    _this.connection.addStream(publisher.stream);
                    publisher.reestablishStreamPlayingEvent();
                    publisher.stream.publish()
                        .then(function () {
                        _this.sendVideoData(publisher, 8, true, 5);
                        return resolve();
                    })
                        .catch(function (error) { return reject(error); });
                }).catch(function (error) { return reject(error); });
            }
        });
    };
    Session.prototype.unpublish = function (publisher) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.sessionConnected()) {
                throw _this.notConnectedError();
            }
            var stream = publisher.stream;
            if (!stream.connection) {
                return reject(new Error('The associated Connection object of this Publisher is null'));
            }
            else if (stream.connection !== _this.connection) {
                return reject(new Error('The associated Connection object of this Publisher is not your local Connection.' +
                    "Only moderators can force unpublish on remote Streams via 'forceUnpublish' method"));
            }
            else {
                logger.info('Unpublishing local media (' + stream.connection.connectionId + ')');
                _this.openvidu.sendRequest('unpublishVideo', function (error, response) {
                    if (error) {
                        return reject(error);
                    }
                    else {
                        logger.info('Media unpublished correctly');
                        stream.disposeWebRtcPeer();
                        if (stream.connection.stream == stream) {
                            delete stream.connection.stream;
                        }
                        var streamEvent = new StreamEvent_1.StreamEvent(true, publisher, 'streamDestroyed', publisher.stream, 'unpublish');
                        publisher.emitEvent('streamDestroyed', [streamEvent]);
                        streamEvent.callDefaultBehavior();
                        return resolve();
                    }
                });
            }
        });
    };
    Session.prototype.forceDisconnect = function (connection) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.sessionConnected()) {
                return reject(_this.notConnectedError());
            }
            logger.info('Forcing disconnect for connection ' + connection.connectionId);
            _this.openvidu.sendRequest('forceDisconnect', { connectionId: connection.connectionId }, function (error, response) {
                if (error) {
                    logger.error('Error forcing disconnect for Connection ' + connection.connectionId, error);
                    if (error.code === 401) {
                        return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to force a disconnection"));
                    }
                    else {
                        return reject(error);
                    }
                }
                else {
                    logger.info('Forcing disconnect correctly for Connection ' + connection.connectionId);
                    return resolve();
                }
            });
        });
    };
    Session.prototype.forceUnpublish = function (stream) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.sessionConnected()) {
                return reject(_this.notConnectedError());
            }
            logger.info('Forcing unpublish for stream ' + stream.streamId);
            _this.openvidu.sendRequest('forceUnpublish', { streamId: stream.streamId }, function (error, response) {
                if (error) {
                    logger.error('Error forcing unpublish for Stream ' + stream.streamId, error);
                    if (error.code === 401) {
                        return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to force an unpublishing"));
                    }
                    else {
                        return reject(error);
                    }
                }
                else {
                    logger.info('Forcing unpublish correctly for Stream ' + stream.streamId);
                    return resolve();
                }
            });
        });
    };
    Session.prototype.signal = function (signal) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.sessionConnected()) {
                return reject(_this.notConnectedError());
            }
            var signalMessage = {};
            if (signal.to && signal.to.length > 0) {
                var connectionIds_1 = [];
                signal.to.forEach(function (connection) {
                    if (!!connection.connectionId) {
                        connectionIds_1.push(connection.connectionId);
                    }
                });
                signalMessage['to'] = connectionIds_1;
            }
            else {
                signalMessage['to'] = [];
            }
            signalMessage['data'] = signal.data ? signal.data : '';
            var typeAux = signal.type ? signal.type : 'signal';
            if (!!typeAux) {
                if (typeAux.substring(0, 7) !== 'signal:') {
                    typeAux = 'signal:' + typeAux;
                }
            }
            signalMessage['type'] = typeAux;
            _this.openvidu.sendRequest('sendMessage', {
                message: JSON.stringify(signalMessage)
            }, function (error, response) {
                if (!!error) {
                    return reject(error);
                }
                else {
                    return resolve();
                }
            });
        });
    };
    Session.prototype.on = function (type, handler) {
        var _a, _b, _c, _d;
        _super.prototype.onAux.call(this, type, "Event '" + type + "' triggered by 'Session'", handler);
        if (type === 'publisherStartSpeaking') {
            this.remoteConnections.forEach(function (remoteConnection) {
                var _a;
                if (!!((_a = remoteConnection.stream) === null || _a === void 0 ? void 0 : _a.hasAudio)) {
                    remoteConnection.stream.enableHarkSpeakingEvent();
                }
            });
            if (!!((_b = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.stream) === null || _b === void 0 ? void 0 : _b.hasAudio)) {
                this.connection.stream.enableHarkSpeakingEvent();
            }
        }
        if (type === 'publisherStopSpeaking') {
            this.remoteConnections.forEach(function (remoteConnection) {
                var _a;
                if (!!((_a = remoteConnection.stream) === null || _a === void 0 ? void 0 : _a.hasAudio)) {
                    remoteConnection.stream.enableHarkStoppedSpeakingEvent();
                }
            });
            if (!!((_d = (_c = this.connection) === null || _c === void 0 ? void 0 : _c.stream) === null || _d === void 0 ? void 0 : _d.hasAudio)) {
                this.connection.stream.enableHarkStoppedSpeakingEvent();
            }
        }
        return this;
    };
    Session.prototype.once = function (type, handler) {
        var _a, _b, _c, _d;
        _super.prototype.onceAux.call(this, type, "Event '" + type + "' triggered once by 'Session'", handler);
        if (type === 'publisherStartSpeaking') {
            this.remoteConnections.forEach(function (remoteConnection) {
                var _a;
                if (!!((_a = remoteConnection.stream) === null || _a === void 0 ? void 0 : _a.hasAudio)) {
                    remoteConnection.stream.enableOnceHarkSpeakingEvent();
                }
            });
            if (!!((_b = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.stream) === null || _b === void 0 ? void 0 : _b.hasAudio)) {
                this.connection.stream.enableOnceHarkSpeakingEvent();
            }
        }
        if (type === 'publisherStopSpeaking') {
            this.remoteConnections.forEach(function (remoteConnection) {
                var _a;
                if (!!((_a = remoteConnection.stream) === null || _a === void 0 ? void 0 : _a.hasAudio)) {
                    remoteConnection.stream.enableOnceHarkStoppedSpeakingEvent();
                }
            });
            if (!!((_d = (_c = this.connection) === null || _c === void 0 ? void 0 : _c.stream) === null || _d === void 0 ? void 0 : _d.hasAudio)) {
                this.connection.stream.enableOnceHarkStoppedSpeakingEvent();
            }
        }
        return this;
    };
    Session.prototype.off = function (type, handler) {
        var _this = this;
        var _a, _b, _c, _d;
        _super.prototype.offAux.call(this, type, handler);
        if (type === 'publisherStartSpeaking') {
            if (!this.anySpeechEventListenerEnabled('publisherStartSpeaking', false)) {
                this.remoteConnections.forEach(function (remoteConnection) {
                    var _a;
                    if (!!((_a = remoteConnection.stream) === null || _a === void 0 ? void 0 : _a.streamManager)) {
                        if (!_this.anySpeechEventListenerEnabled('publisherStartSpeaking', false, remoteConnection.stream.streamManager)) {
                            remoteConnection.stream.disableHarkSpeakingEvent(false);
                        }
                    }
                });
                if (!!((_b = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.stream) === null || _b === void 0 ? void 0 : _b.streamManager)) {
                    if (!this.anySpeechEventListenerEnabled('publisherStartSpeaking', false, this.connection.stream.streamManager)) {
                        this.connection.stream.disableHarkSpeakingEvent(false);
                    }
                }
            }
        }
        if (type === 'publisherStopSpeaking') {
            if (!this.anySpeechEventListenerEnabled('publisherStopSpeaking', false)) {
                this.remoteConnections.forEach(function (remoteConnection) {
                    var _a;
                    if (!!((_a = remoteConnection.stream) === null || _a === void 0 ? void 0 : _a.streamManager)) {
                        if (!_this.anySpeechEventListenerEnabled('publisherStopSpeaking', false, remoteConnection.stream.streamManager)) {
                            remoteConnection.stream.disableHarkStoppedSpeakingEvent(false);
                        }
                    }
                });
                if (!!((_d = (_c = this.connection) === null || _c === void 0 ? void 0 : _c.stream) === null || _d === void 0 ? void 0 : _d.streamManager)) {
                    if (!this.anySpeechEventListenerEnabled('publisherStopSpeaking', false, this.connection.stream.streamManager)) {
                        this.connection.stream.disableHarkStoppedSpeakingEvent(false);
                    }
                }
            }
        }
        return this;
    };
    Session.prototype.onParticipantJoined = function (event) {
        var _this = this;
        this.getConnection(event.id, '')
            .then(function (connection) {
            logger.warn('Connection ' + connection.connectionId + ' already exists in connections list');
        })
            .catch(function (openViduError) {
            var connection = new Connection_1.Connection(_this, event);
            _this.remoteConnections.set(event.id, connection);
            _this.ee.emitEvent('connectionCreated', [new ConnectionEvent_1.ConnectionEvent(false, _this, 'connectionCreated', connection, '')]);
        });
    };
    Session.prototype.onParticipantLeft = function (event) {
        var _this = this;
        this.getRemoteConnection(event.connectionId, 'onParticipantLeft').then(function (connection) {
            if (!!connection.stream) {
                var stream = connection.stream;
                var streamEvent = new StreamEvent_1.StreamEvent(true, _this, 'streamDestroyed', stream, event.reason);
                _this.ee.emitEvent('streamDestroyed', [streamEvent]);
                streamEvent.callDefaultBehavior();
                _this.remoteStreamsCreated.delete(stream.streamId);
            }
            _this.remoteConnections.delete(connection.connectionId);
            _this.ee.emitEvent('connectionDestroyed', [new ConnectionEvent_1.ConnectionEvent(false, _this, 'connectionDestroyed', connection, event.reason)]);
        })
            .catch(function (openViduError) {
            logger.error(openViduError);
        });
    };
    Session.prototype.onParticipantPublished = function (event) {
        var _this = this;
        var afterConnectionFound = function (connection) {
            _this.remoteConnections.set(connection.connectionId, connection);
            if (!_this.remoteStreamsCreated.get(connection.stream.streamId)) {
                _this.ee.emitEvent('streamCreated', [new StreamEvent_1.StreamEvent(false, _this, 'streamCreated', connection.stream, '')]);
            }
            _this.remoteStreamsCreated.set(connection.stream.streamId, true);
        };
        var connection;
        this.getRemoteConnection(event.id, 'onParticipantPublished')
            .then(function (con) {
            connection = con;
            event.metadata = con.data;
            connection.remoteOptions = event;
            connection.initRemoteStreams(event.streams);
            afterConnectionFound(connection);
        })
            .catch(function (openViduError) {
            connection = new Connection_1.Connection(_this, event);
            afterConnectionFound(connection);
        });
    };
    Session.prototype.onParticipantUnpublished = function (event) {
        var _this = this;
        if (event.connectionId === this.connection.connectionId) {
            this.stopPublisherStream(event.reason);
        }
        else {
            this.getRemoteConnection(event.connectionId, 'onParticipantUnpublished')
                .then(function (connection) {
                var streamEvent = new StreamEvent_1.StreamEvent(true, _this, 'streamDestroyed', connection.stream, event.reason);
                _this.ee.emitEvent('streamDestroyed', [streamEvent]);
                streamEvent.callDefaultBehavior();
                var streamId = connection.stream.streamId;
                _this.remoteStreamsCreated.delete(streamId);
                connection.removeStream(streamId);
            })
                .catch(function (openViduError) {
                logger.error(openViduError);
            });
        }
    };
    Session.prototype.onParticipantEvicted = function (event) {
        if (event.connectionId === this.connection.connectionId) {
            if (!!this.sessionId && !this.connection.disposed) {
                this.leave(true, event.reason);
            }
        }
    };
    Session.prototype.onNewMessage = function (event) {
        var _this = this;
        logger.info('New signal: ' + JSON.stringify(event));
        var strippedType = !!event.type ? event.type.replace(/^(signal:)/, '') : undefined;
        if (!!event.from) {
            this.getConnection(event.from, "Connection '" + event.from + "' unknown when 'onNewMessage'. Existing remote connections: "
                + JSON.stringify(this.remoteConnections.keys()) + '. Existing local connection: ' + this.connection.connectionId)
                .then(function (connection) {
                _this.ee.emitEvent('signal', [new SignalEvent_1.SignalEvent(_this, strippedType, event.data, connection)]);
                if (!!event.type && event.type !== 'signal') {
                    _this.ee.emitEvent(event.type, [new SignalEvent_1.SignalEvent(_this, strippedType, event.data, connection)]);
                }
            })
                .catch(function (openViduError) {
                logger.error(openViduError);
            });
        }
        else {
            this.ee.emitEvent('signal', [new SignalEvent_1.SignalEvent(this, strippedType, event.data, undefined)]);
            if (!!event.type && event.type !== 'signal') {
                this.ee.emitEvent(event.type, [new SignalEvent_1.SignalEvent(this, strippedType, event.data, undefined)]);
            }
        }
    };
    Session.prototype.onStreamPropertyChanged = function (event) {
        var _this = this;
        var callback = function (connection) {
            if (!!connection.stream && connection.stream.streamId === event.streamId) {
                var stream = connection.stream;
                var oldValue = void 0;
                switch (event.property) {
                    case 'audioActive':
                        oldValue = stream.audioActive;
                        event.newValue = event.newValue === 'true';
                        stream.audioActive = event.newValue;
                        break;
                    case 'videoActive':
                        oldValue = stream.videoActive;
                        event.newValue = event.newValue === 'true';
                        stream.videoActive = event.newValue;
                        break;
                    case 'videoDimensions':
                        oldValue = stream.videoDimensions;
                        event.newValue = JSON.parse(JSON.parse(event.newValue));
                        stream.videoDimensions = event.newValue;
                        break;
                    case 'filter':
                        oldValue = stream.filter;
                        event.newValue = (Object.keys(event.newValue).length > 0) ? event.newValue : undefined;
                        if (event.newValue !== undefined) {
                            stream.filter = new Filter_1.Filter(event.newValue.type, event.newValue.options);
                            stream.filter.stream = stream;
                            if (event.newValue.lastExecMethod) {
                                stream.filter.lastExecMethod = event.newValue.lastExecMethod;
                            }
                        }
                        else {
                            delete stream.filter;
                        }
                        event.newValue = stream.filter;
                        break;
                }
                _this.ee.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this, stream, event.property, event.newValue, oldValue, event.reason)]);
                if (!!stream.streamManager) {
                    stream.streamManager.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(stream.streamManager, stream, event.property, event.newValue, oldValue, event.reason)]);
                }
            }
            else {
                logger.error("No stream with streamId '" + event.streamId + "' found for connection '" + event.connectionId + "' on 'streamPropertyChanged' event");
            }
        };
        if (event.connectionId === this.connection.connectionId) {
            callback(this.connection);
        }
        else {
            this.getRemoteConnection(event.connectionId, 'onStreamPropertyChanged')
                .then(function (connection) {
                callback(connection);
            })
                .catch(function (openViduError) {
                logger.error(openViduError);
            });
        }
    };
    Session.prototype.onConnectionPropertyChanged = function (event) {
        var oldValue;
        switch (event.property) {
            case 'role':
                oldValue = this.connection.role.slice();
                this.connection.role = event.newValue;
                this.connection.localOptions.role = event.newValue;
                break;
            case 'record':
                oldValue = this.connection.record;
                event.newValue = event.newValue === 'true';
                this.connection.record = event.newValue;
                this.connection.localOptions.record = event.newValue;
                break;
        }
        this.ee.emitEvent('connectionPropertyChanged', [new ConnectionPropertyChangedEvent_1.ConnectionPropertyChangedEvent(this, this.connection, event.property, event.newValue, oldValue)]);
    };
    Session.prototype.onNetworkQualityLevelChangedChanged = function (event) {
        var _this = this;
        if (event.connectionId === this.connection.connectionId) {
            this.ee.emitEvent('networkQualityLevelChanged', [new NetworkQualityLevelChangedEvent_1.NetworkQualityLevelChangedEvent(this, event.newValue, event.oldValue, this.connection)]);
        }
        else {
            this.getConnection(event.connectionId, 'Connection not found for connectionId ' + event.connectionId)
                .then(function (connection) {
                _this.ee.emitEvent('networkQualityLevelChanged', [new NetworkQualityLevelChangedEvent_1.NetworkQualityLevelChangedEvent(_this, event.newValue, event.oldValue, connection)]);
            })
                .catch(function (openViduError) {
                logger.error(openViduError);
            });
        }
    };
    Session.prototype.recvIceCandidate = function (event) {
        var candidateInit = {
            candidate: event.candidate,
            sdpMLineIndex: event.sdpMLineIndex,
            sdpMid: event.sdpMid,
        };
        var iceCandidate = new RTCIceCandidate(candidateInit);
        this.getConnection(event.senderConnectionId, 'Connection not found for connectionId ' + event.senderConnectionId + ' owning endpoint ' + event.endpointName + '. Ice candidate will be ignored: ' + iceCandidate)
            .then(function (connection) {
            var stream = connection.stream;
            stream.getWebRtcPeer().addIceCandidate(iceCandidate).catch(function (error) {
                logger.error('Error adding candidate for ' + stream.streamId
                    + ' stream of endpoint ' + event.endpointName + ': ' + error);
            });
        })
            .catch(function (openViduError) {
            logger.error(openViduError);
        });
    };
    Session.prototype.onSessionClosed = function (msg) {
        logger.info('Session closed: ' + JSON.stringify(msg));
        var s = msg.sessionId;
        if (s !== undefined) {
            this.ee.emitEvent('session-closed', [{
                    session: s
                }]);
        }
        else {
            logger.warn('Session undefined on session closed', msg);
        }
    };
    Session.prototype.onLostConnection = function (reason) {
        logger.warn('Lost connection in Session ' + this.sessionId);
        if (!!this.sessionId && !!this.connection && !this.connection.disposed) {
            this.leave(true, reason);
        }
    };
    Session.prototype.onRecoveredConnection = function () {
        logger.info('Recovered connection in Session ' + this.sessionId);
        this.reconnectBrokenStreams();
        this.ee.emitEvent('reconnected', []);
    };
    Session.prototype.onMediaError = function (event) {
        logger.error('Media error: ' + JSON.stringify(event));
        var err = event.error;
        if (err) {
            this.ee.emitEvent('error-media', [{
                    error: err
                }]);
        }
        else {
            logger.warn('Received undefined media error:', event);
        }
    };
    Session.prototype.onRecordingStarted = function (event) {
        this.ee.emitEvent('recordingStarted', [new RecordingEvent_1.RecordingEvent(this, 'recordingStarted', event.id, event.name)]);
    };
    Session.prototype.onRecordingStopped = function (event) {
        this.ee.emitEvent('recordingStopped', [new RecordingEvent_1.RecordingEvent(this, 'recordingStopped', event.id, event.name, event.reason)]);
    };
    Session.prototype.onFilterEventDispatched = function (event) {
        var _this = this;
        var connectionId = event.connectionId;
        this.getConnection(connectionId, 'No connection found for connectionId ' + connectionId)
            .then(function (connection) {
            var _a;
            logger.info('Filter event dispatched');
            var stream = connection.stream;
            (_a = stream.filter.handlers.get(event.eventType)) === null || _a === void 0 ? void 0 : _a.call(_this, new FilterEvent_1.FilterEvent(stream.filter, event.eventType, event.data));
        });
    };
    Session.prototype.onForciblyReconnectSubscriber = function (event) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getRemoteConnection(event.connectionId, 'onForciblyReconnectSubscriber')
                .then(function (connection) {
                if (!!connection.stream && connection.stream.streamId === event.streamId) {
                    var stream_1 = connection.stream;
                    if (stream_1.setupReconnectionEventEmitter(resolve, reject)) {
                        if (stream_1.reconnectionEventEmitter['onForciblyReconnectSubscriberLastEvent'] != null) {
                            stream_1.reconnectionEventEmitter['onForciblyReconnectSubscriberLastEvent'] = event;
                            return reject('Ongoing forced subscriber reconnection');
                        }
                        else {
                            stream_1.reconnectionEventEmitter['onForciblyReconnectSubscriberLastEvent'] = event;
                            var callback_1 = function () {
                                var eventAux = stream_1.reconnectionEventEmitter['onForciblyReconnectSubscriberLastEvent'];
                                delete stream_1.reconnectionEventEmitter['onForciblyReconnectSubscriberLastEvent'];
                                _this.onForciblyReconnectSubscriber(eventAux);
                            };
                            stream_1.reconnectionEventEmitter.once('success', function () {
                                callback_1();
                            });
                            stream_1.reconnectionEventEmitter.once('error', function () {
                                callback_1();
                            });
                        }
                        return;
                    }
                    stream_1.completeWebRtcPeerReceive(true, true, event.sdpOffer)
                        .then(function () { return stream_1.finalResolveForSubscription(true, resolve); })
                        .catch(function (error) { return stream_1.finalRejectForSubscription(true, "Error while forcibly reconnecting remote stream ".concat(event.streamId, ": ").concat(error.toString()), reject); });
                }
                else {
                    var errMsg = "No stream with streamId '" + event.streamId + "' found for connection '" + event.connectionId + "' on 'streamPropertyChanged' event";
                    logger.error(errMsg);
                    return reject(errMsg);
                }
            })
                .catch(function (openViduError) {
                logger.error(openViduError);
                return reject(openViduError);
            });
        });
    };
    Session.prototype.reconnectBrokenStreams = function () {
        logger.info('Re-establishing media connections...');
        var someReconnection = false;
        if (!!this.connection.stream && this.connection.stream.streamIceConnectionStateBroken()) {
            logger.warn('Re-establishing Publisher ' + this.connection.stream.streamId);
            this.connection.stream.initWebRtcPeerSend(true);
            someReconnection = true;
        }
        this.remoteConnections.forEach(function (remoteConnection) {
            if (!!remoteConnection.stream && remoteConnection.stream.streamIceConnectionStateBroken()) {
                logger.warn('Re-establishing Subscriber ' + remoteConnection.stream.streamId);
                remoteConnection.stream.initWebRtcPeerReceive(true);
                someReconnection = true;
            }
        });
        if (!someReconnection) {
            logger.info('There were no media streams in need of a reconnection');
        }
    };
    Session.prototype.emitEvent = function (type, eventArray) {
        this.ee.emitEvent(type, eventArray);
    };
    Session.prototype.leave = function (forced, reason) {
        var _this = this;
        forced = !!forced;
        logger.info('Leaving Session (forced=' + forced + ')');
        this.stopVideoDataIntervals();
        if (!!this.connection) {
            if (!this.connection.disposed && !forced) {
                this.openvidu.sendRequest('leaveRoom', function (error, response) {
                    if (error) {
                        logger.error("leaveRoom error: ".concat(JSON.stringify(error)));
                    }
                    _this.openvidu.closeWs();
                });
            }
            else {
                this.openvidu.closeWs();
            }
            this.stopPublisherStream(reason);
            if (!this.connection.disposed) {
                var sessionDisconnectEvent = new SessionDisconnectedEvent_1.SessionDisconnectedEvent(this, reason);
                this.ee.emitEvent('sessionDisconnected', [sessionDisconnectEvent]);
                sessionDisconnectEvent.callDefaultBehavior();
            }
        }
        else {
            logger.warn('You were not connected to the session ' + this.sessionId);
        }
        logger.flush();
    };
    Session.prototype.initializeParams = function (token) {
        var joinParams = {
            token: (!!token) ? token : '',
            session: this.sessionId,
            platform: !!platform.getDescription() ? platform.getDescription() : 'unknown',
            sdkVersion: this.openvidu.libraryVersion,
            metadata: !!this.options.metadata ? this.options.metadata : '',
            secret: this.openvidu.getSecret(),
            recorder: this.openvidu.getRecorder()
        };
        return joinParams;
    };
    Session.prototype.sendVideoData = function (streamManager, intervalSeconds, doInterval, maxLoops) {
        var _this = this;
        var _a, _b;
        if (intervalSeconds === void 0) { intervalSeconds = 1; }
        if (doInterval === void 0) { doInterval = false; }
        if (maxLoops === void 0) { maxLoops = 1; }
        if (platform.isChromeBrowser() || platform.isChromeMobileBrowser() || platform.isOperaBrowser() ||
            platform.isOperaMobileBrowser() || platform.isEdgeBrowser() || platform.isEdgeMobileBrowser() || platform.isElectron() ||
            (platform.isSafariBrowser() && !platform.isIonicIos()) || platform.isAndroidBrowser() ||
            platform.isSamsungBrowser() || platform.isIonicAndroid() || platform.isIOSWithSafari()) {
            var obtainAndSendVideo_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                var pc, statsMap, arr_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pc = streamManager.stream.getRTCPeerConnection();
                            if (!(pc.connectionState === 'connected')) return [3, 2];
                            return [4, pc.getStats()];
                        case 1:
                            statsMap = _a.sent();
                            arr_1 = [];
                            statsMap.forEach(function (stats) {
                                if (("frameWidth" in stats) && ("frameHeight" in stats) && (arr_1.length === 0)) {
                                    arr_1.push(stats);
                                }
                            });
                            if (arr_1.length > 0) {
                                this.openvidu.sendRequest('videoData', {
                                    height: arr_1[0].frameHeight,
                                    width: arr_1[0].frameWidth,
                                    videoActive: streamManager.stream.videoActive != null ? streamManager.stream.videoActive : false,
                                    audioActive: streamManager.stream.audioActive != null ? streamManager.stream.audioActive : false
                                }, function (error, response) {
                                    if (error) {
                                        logger.error("Error sending 'videoData' event", error);
                                    }
                                });
                            }
                            _a.label = 2;
                        case 2: return [2];
                    }
                });
            }); };
            if (doInterval) {
                var loops_1 = 1;
                this.videoDataInterval = setInterval(function () {
                    if (loops_1 < maxLoops) {
                        loops_1++;
                        obtainAndSendVideo_1();
                    }
                    else {
                        clearInterval(_this.videoDataInterval);
                    }
                }, intervalSeconds * 1000);
            }
            else {
                this.videoDataTimeout = setTimeout(obtainAndSendVideo_1, intervalSeconds * 1000);
            }
        }
        else if (platform.isFirefoxBrowser() || platform.isFirefoxMobileBrowser() || platform.isIonicIos() || platform.isReactNative()) {
            this.openvidu.sendRequest('videoData', {
                height: ((_a = streamManager.stream.videoDimensions) === null || _a === void 0 ? void 0 : _a.height) || 0,
                width: ((_b = streamManager.stream.videoDimensions) === null || _b === void 0 ? void 0 : _b.width) || 0,
                videoActive: streamManager.stream.videoActive != null ? streamManager.stream.videoActive : false,
                audioActive: streamManager.stream.audioActive != null ? streamManager.stream.audioActive : false
            }, function (error, response) {
                if (error) {
                    logger.error("Error sending 'videoData' event", error);
                }
            });
        }
        else {
            logger.error('Browser ' + platform.getName() + ' (version ' + platform.getVersion() + ') for ' + platform.getFamily() + ' is not supported in OpenVidu for Network Quality');
        }
    };
    Session.prototype.sessionConnected = function () {
        return this.connection != null;
    };
    Session.prototype.notConnectedError = function () {
        return new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_NOT_CONNECTED, "There is no connection to the session. Method 'Session.connect' must be successfully completed first");
    };
    Session.prototype.anySpeechEventListenerEnabled = function (event, onlyOnce, streamManager) {
        var handlersInSession = this.ee.getListeners(event);
        if (onlyOnce) {
            handlersInSession = handlersInSession.filter(function (h) { return h.once; });
        }
        var listenersInSession = handlersInSession.length;
        if (listenersInSession > 0)
            return true;
        var listenersInStreamManager = 0;
        if (!!streamManager) {
            var handlersInStreamManager = streamManager.ee.getListeners(event);
            if (onlyOnce) {
                handlersInStreamManager = handlersInStreamManager.filter(function (h) { return h.once; });
            }
            listenersInStreamManager = handlersInStreamManager.length;
        }
        return listenersInStreamManager > 0;
    };
    Session.prototype.connectAux = function (token) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.openvidu.startWs(function (error) {
                if (!!error) {
                    return reject(error);
                }
                else {
                    var joinParams = _this.initializeParams(token);
                    _this.openvidu.sendRequest('joinRoom', joinParams, function (error, response) {
                        if (!!error) {
                            return reject(error);
                        }
                        else {
                            _this.processJoinRoomResponse(response);
                            OpenViduLogger_1.OpenViduLogger.configureJSNLog(_this.openvidu, token);
                            _this.connection = new Connection_1.Connection(_this, response);
                            var events_1 = {
                                connections: new Array(),
                                streams: new Array()
                            };
                            var existingParticipants = response.value;
                            existingParticipants.forEach(function (remoteConnectionOptions) {
                                var connection = new Connection_1.Connection(_this, remoteConnectionOptions);
                                _this.remoteConnections.set(connection.connectionId, connection);
                                events_1.connections.push(connection);
                                if (!!connection.stream) {
                                    _this.remoteStreamsCreated.set(connection.stream.streamId, true);
                                    events_1.streams.push(connection.stream);
                                }
                            });
                            _this.ee.emitEvent('connectionCreated', [new ConnectionEvent_1.ConnectionEvent(false, _this, 'connectionCreated', _this.connection, '')]);
                            events_1.connections.forEach(function (connection) {
                                _this.ee.emitEvent('connectionCreated', [new ConnectionEvent_1.ConnectionEvent(false, _this, 'connectionCreated', connection, '')]);
                            });
                            events_1.streams.forEach(function (stream) {
                                _this.ee.emitEvent('streamCreated', [new StreamEvent_1.StreamEvent(false, _this, 'streamCreated', stream, '')]);
                            });
                            return resolve();
                        }
                    });
                }
            });
        });
    };
    Session.prototype.stopPublisherStream = function (reason) {
        if (!!this.connection.stream) {
            this.connection.stream.disposeWebRtcPeer();
            if (this.connection.stream.isLocalStreamPublished) {
                this.connection.stream.ee.emitEvent('local-stream-destroyed', [reason]);
            }
        }
    };
    Session.prototype.stopVideoDataIntervals = function () {
        clearInterval(this.videoDataInterval);
        clearTimeout(this.videoDataTimeout);
    };
    Session.prototype.stringClientMetadata = function (metadata) {
        if (typeof metadata !== 'string') {
            return JSON.stringify(metadata);
        }
        else {
            return metadata;
        }
    };
    Session.prototype.getConnection = function (connectionId, errorMessage) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var connection = _this.remoteConnections.get(connectionId);
            if (!!connection) {
                return resolve(connection);
            }
            else {
                if (_this.connection.connectionId === connectionId) {
                    return resolve(_this.connection);
                }
                else {
                    return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.GENERIC_ERROR, errorMessage));
                }
            }
        });
    };
    Session.prototype.getRemoteConnection = function (connectionId, operation) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var connection = _this.remoteConnections.get(connectionId);
            if (!!connection) {
                return resolve(connection);
            }
            else {
                var errorMessage = 'Remote connection ' + connectionId + " unknown when '" + operation + "'. " +
                    'Existing remote connections: ' + JSON.stringify(_this.remoteConnections.keys());
                return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.GENERIC_ERROR, errorMessage));
            }
        });
    };
    Session.prototype.processToken = function (token) {
        var match = token.match(/^(wss?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
        if (!!match) {
            var url = {
                protocol: match[1],
                host: match[2],
                hostname: match[3],
                port: match[4],
                pathname: match[5],
                search: match[6],
                hash: match[7]
            };
            var params = token.split('?');
            var queryParams = decodeURI(params[1])
                .split('&')
                .map(function (param) { return param.split('='); })
                .reduce(function (values, _a) {
                var key = _a[0], value = _a[1];
                values[key] = value;
                return values;
            }, {});
            this.sessionId = queryParams['sessionId'];
            var secret = queryParams['secret'];
            var recorder = queryParams['recorder'];
            var webrtcStatsInterval = queryParams['webrtcStatsInterval'];
            var sendBrowserLogs = queryParams['sendBrowserLogs'];
            if (!!secret) {
                this.openvidu.secret = secret;
            }
            if (!!recorder) {
                this.openvidu.recorder = true;
            }
            if (!!webrtcStatsInterval) {
                this.openvidu.webrtcStatsInterval = +webrtcStatsInterval;
            }
            if (!!sendBrowserLogs) {
                this.openvidu.sendBrowserLogs = sendBrowserLogs;
            }
            this.openvidu.isPro = !!webrtcStatsInterval && !!sendBrowserLogs;
            this.openvidu.wsUri = 'wss://' + url.host + '/openvidu';
            this.openvidu.httpUri = 'https://' + url.host;
        }
        else {
            logger.error('Token "' + token + '" is not valid');
        }
    };
    Session.prototype.processJoinRoomResponse = function (opts) {
        this.sessionId = opts.session;
        if (opts.customIceServers != null && opts.customIceServers.length > 0) {
            this.openvidu.iceServers = [];
            for (var _i = 0, _a = opts.customIceServers; _i < _a.length; _i++) {
                var iceServer = _a[_i];
                var rtcIceServer = {
                    urls: [iceServer.url]
                };
                logger.log("STUN/TURN server IP: " + iceServer.url);
                if (iceServer.username != null && iceServer.credential != null) {
                    rtcIceServer.username = iceServer.username;
                    rtcIceServer.credential = iceServer.credential;
                    logger.log('TURN credentials [' + iceServer.username + ':' + iceServer.credential + ']');
                }
                this.openvidu.iceServers.push(rtcIceServer);
            }
        }
        else if (opts.coturnIp != null && opts.coturnPort != null && opts.turnUsername != null && opts.turnCredential != null) {
            var turnUrl1 = 'turn:' + opts.coturnIp + ':' + opts.coturnPort;
            this.openvidu.iceServers = [
                { urls: [turnUrl1], username: opts.turnUsername, credential: opts.turnCredential }
            ];
            logger.log("STUN/TURN server IP: " + opts.coturnIp);
            logger.log('TURN temp credentials [' + opts.turnUsername + ':' + opts.turnCredential + ']');
        }
        this.openvidu.role = opts.role;
        this.openvidu.finalUserId = opts.finalUserId;
        this.openvidu.mediaServer = opts.mediaServer;
        this.openvidu.videoSimulcast = opts.videoSimulcast;
        this.capabilities = {
            subscribe: true,
            publish: this.openvidu.role !== 'SUBSCRIBER',
            forceUnpublish: this.openvidu.role === 'MODERATOR',
            forceDisconnect: this.openvidu.role === 'MODERATOR'
        };
        logger.info("openvidu-server version: " + opts.version);
        if (opts.life != null) {
            this.openvidu.life = opts.life;
        }
        var minorDifference = semverMinor(opts.version) - semverMinor(this.openvidu.libraryVersion);
        if ((semverMajor(opts.version) !== semverMajor(this.openvidu.libraryVersion)) || !(minorDifference == 0 || minorDifference == 1)) {
            logger.error("openvidu-browser (".concat(this.openvidu.libraryVersion, ") and openvidu-server (").concat(opts.version, ") versions are incompatible. ")
                + 'Errors are likely to occur. openvidu-browser SDK is only compatible with the same version or the immediately following minor version of an OpenVidu deployment');
        }
        else if (minorDifference == 1) {
            logger.warn("openvidu-browser version ".concat(this.openvidu.libraryVersion, " does not match openvidu-server version ").concat(opts.version, ". ")
                + "These versions are still compatible with each other, but openvidu-browser version must be updated as soon as possible to ".concat(semverMajor(opts.version), ".").concat(semverMinor(opts.version), ".x. ")
                + "This client using openvidu-browser ".concat(this.openvidu.libraryVersion, " will become incompatible with the next release of openvidu-server"));
        }
    };
    return Session;
}(EventDispatcher_1.EventDispatcher));
exports.Session = Session;

},{"../OpenViduInternal/Enums/OpenViduError":52,"../OpenViduInternal/Enums/VideoInsertMode":54,"../OpenViduInternal/Events/ConnectionEvent":55,"../OpenViduInternal/Events/ConnectionPropertyChangedEvent":56,"../OpenViduInternal/Events/FilterEvent":59,"../OpenViduInternal/Events/NetworkQualityLevelChangedEvent":60,"../OpenViduInternal/Events/RecordingEvent":62,"../OpenViduInternal/Events/SessionDisconnectedEvent":63,"../OpenViduInternal/Events/SignalEvent":64,"../OpenViduInternal/Events/StreamEvent":65,"../OpenViduInternal/Events/StreamPropertyChangedEvent":67,"../OpenViduInternal/Logger/OpenViduLogger":79,"../OpenViduInternal/Utils/Platform":83,"./Connection":41,"./EventDispatcher":42,"./Filter":43,"./Subscriber":50,"semver/functions/major":15,"semver/functions/minor":16}],48:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = void 0;
var Filter_1 = require("./Filter");
var Subscriber_1 = require("./Subscriber");
var WebRtcPeer_1 = require("../OpenViduInternal/WebRtcPeer/WebRtcPeer");
var WebRtcStats_1 = require("../OpenViduInternal/WebRtcStats/WebRtcStats");
var ExceptionEvent_1 = require("../OpenViduInternal/Events/ExceptionEvent");
var PublisherSpeakingEvent_1 = require("../OpenViduInternal/Events/PublisherSpeakingEvent");
var StreamManagerEvent_1 = require("../OpenViduInternal/Events/StreamManagerEvent");
var StreamPropertyChangedEvent_1 = require("../OpenViduInternal/Events/StreamPropertyChangedEvent");
var OpenViduError_1 = require("../OpenViduInternal/Enums/OpenViduError");
var TypeOfVideo_1 = require("../OpenViduInternal/Enums/TypeOfVideo");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var Platform_1 = require("../OpenViduInternal/Utils/Platform");
var hark = require("hark");
var EventEmitter = require("wolfy87-eventemitter");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
var Stream = (function () {
    function Stream(session, options) {
        var _this = this;
        this.isSubscribeToRemote = false;
        this.isLocalStreamReadyToPublish = false;
        this.isLocalStreamPublished = false;
        this.publishedOnce = false;
        this.harkSpeakingEnabled = false;
        this.harkSpeakingEnabledOnce = false;
        this.harkStoppedSpeakingEnabled = false;
        this.harkStoppedSpeakingEnabledOnce = false;
        this.harkVolumeChangeEnabled = false;
        this.harkVolumeChangeEnabledOnce = false;
        this.ee = new EventEmitter();
        platform = Platform_1.PlatformUtils.getInstance();
        this.session = session;
        if (options.hasOwnProperty('id')) {
            this.inboundStreamOpts = options;
            this.streamId = this.inboundStreamOpts.id;
            this.creationTime = this.inboundStreamOpts.createdAt;
            this.hasAudio = this.inboundStreamOpts.hasAudio;
            this.hasVideo = this.inboundStreamOpts.hasVideo;
            if (this.hasAudio) {
                this.audioActive = this.inboundStreamOpts.audioActive;
            }
            if (this.hasVideo) {
                this.videoActive = this.inboundStreamOpts.videoActive;
                this.typeOfVideo = (!this.inboundStreamOpts.typeOfVideo) ? undefined : this.inboundStreamOpts.typeOfVideo;
                this.frameRate = (this.inboundStreamOpts.frameRate === -1) ? undefined : this.inboundStreamOpts.frameRate;
                this.videoDimensions = this.inboundStreamOpts.videoDimensions;
            }
            if (!!this.inboundStreamOpts.filter && (Object.keys(this.inboundStreamOpts.filter).length > 0)) {
                if (!!this.inboundStreamOpts.filter.lastExecMethod && Object.keys(this.inboundStreamOpts.filter.lastExecMethod).length === 0) {
                    delete this.inboundStreamOpts.filter.lastExecMethod;
                }
                this.filter = this.inboundStreamOpts.filter;
            }
        }
        else {
            this.outboundStreamOpts = options;
            this.hasAudio = this.isSendAudio();
            this.hasVideo = this.isSendVideo();
            if (this.hasAudio) {
                this.audioActive = !!this.outboundStreamOpts.publisherProperties.publishAudio;
            }
            if (this.hasVideo) {
                this.videoActive = !!this.outboundStreamOpts.publisherProperties.publishVideo;
                this.frameRate = this.outboundStreamOpts.publisherProperties.frameRate;
                if (typeof MediaStreamTrack !== 'undefined' && this.outboundStreamOpts.publisherProperties.videoSource instanceof MediaStreamTrack) {
                    this.typeOfVideo = TypeOfVideo_1.TypeOfVideo.CUSTOM;
                }
                else {
                    this.typeOfVideo = this.isSendScreen() ? TypeOfVideo_1.TypeOfVideo.SCREEN : TypeOfVideo_1.TypeOfVideo.CAMERA;
                }
            }
            if (!!this.outboundStreamOpts.publisherProperties.filter) {
                this.filter = this.outboundStreamOpts.publisherProperties.filter;
            }
        }
        this.ee.on('mediastream-updated', function () {
            var _a;
            _this.streamManager.updateMediaStream(_this.mediaStream);
            logger.debug('Video srcObject [' + ((_a = _this.mediaStream) === null || _a === void 0 ? void 0 : _a.id) + '] updated in stream [' + _this.streamId + ']');
        });
    }
    Stream.prototype.reconnect = function () {
        return this.reconnectStream('API');
    };
    Stream.prototype.applyFilter = function (type, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.session.sessionConnected()) {
                return reject(_this.session.notConnectedError());
            }
            logger.info('Applying filter to stream ' + _this.streamId);
            options = options != null ? options : {};
            var optionsString = options;
            if (typeof optionsString !== 'string') {
                optionsString = JSON.stringify(optionsString);
            }
            _this.session.openvidu.sendRequest('applyFilter', { streamId: _this.streamId, type: type, options: optionsString }, function (error, response) {
                if (error) {
                    logger.error('Error applying filter for Stream ' + _this.streamId, error);
                    if (error.code === 401) {
                        return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to apply a filter"));
                    }
                    else {
                        return reject(error);
                    }
                }
                else {
                    logger.info('Filter successfully applied on Stream ' + _this.streamId);
                    var oldValue = _this.filter;
                    _this.filter = new Filter_1.Filter(type, options);
                    _this.filter.stream = _this;
                    _this.session.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.session, _this, 'filter', _this.filter, oldValue, 'applyFilter')]);
                    _this.streamManager.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.streamManager, _this, 'filter', _this.filter, oldValue, 'applyFilter')]);
                    return resolve(_this.filter);
                }
            });
        });
    };
    Stream.prototype.removeFilter = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.session.sessionConnected()) {
                return reject(_this.session.notConnectedError());
            }
            logger.info('Removing filter of stream ' + _this.streamId);
            _this.session.openvidu.sendRequest('removeFilter', { streamId: _this.streamId }, function (error, response) {
                if (error) {
                    logger.error('Error removing filter for Stream ' + _this.streamId, error);
                    if (error.code === 401) {
                        return reject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to remove a filter"));
                    }
                    else {
                        return reject(error);
                    }
                }
                else {
                    logger.info('Filter successfully removed from Stream ' + _this.streamId);
                    var oldValue = _this.filter;
                    delete _this.filter;
                    _this.session.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.session, _this, 'filter', _this.filter, oldValue, 'applyFilter')]);
                    _this.streamManager.emitEvent('streamPropertyChanged', [new StreamPropertyChangedEvent_1.StreamPropertyChangedEvent(_this.streamManager, _this, 'filter', _this.filter, oldValue, 'applyFilter')]);
                    return resolve();
                }
            });
        });
    };
    Stream.prototype.getRTCPeerConnection = function () {
        return this.webRtcPeer.pc;
    };
    Stream.prototype.getMediaStream = function () {
        return this.mediaStream;
    };
    Stream.prototype.setMediaStream = function (mediaStream) {
        this.mediaStream = mediaStream;
    };
    Stream.prototype.updateMediaStreamInVideos = function () {
        this.ee.emitEvent('mediastream-updated', []);
    };
    Stream.prototype.getWebRtcPeer = function () {
        return this.webRtcPeer;
    };
    Stream.prototype.subscribeToMyRemote = function (value) {
        this.isSubscribeToRemote = value;
    };
    Stream.prototype.setOutboundStreamOptions = function (outboundStreamOpts) {
        this.outboundStreamOpts = outboundStreamOpts;
    };
    Stream.prototype.subscribe = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.initWebRtcPeerReceive(false)
                .then(function () { return resolve(); })
                .catch(function (error) { return reject(error); });
        });
    };
    Stream.prototype.publish = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.isLocalStreamReadyToPublish) {
                _this.initWebRtcPeerSend(false)
                    .then(function () { return resolve(); })
                    .catch(function (error) { return reject(error); });
            }
            else {
                _this.ee.once('stream-ready-to-publish', function () {
                    _this.publish()
                        .then(function () { return resolve(); })
                        .catch(function (error) { return reject(error); });
                });
            }
        });
    };
    Stream.prototype.disposeWebRtcPeer = function () {
        var webrtcId;
        if (!!this.webRtcPeer) {
            this.webRtcPeer.dispose();
            webrtcId = this.webRtcPeer.getId();
        }
        this.stopWebRtcStats();
        logger.info((!!this.outboundStreamOpts ? 'Outbound ' : 'Inbound ') + "RTCPeerConnection with id [" + webrtcId + "] from 'Stream' with id [" + this.streamId + '] is now closed');
    };
    Stream.prototype.disposeMediaStream = function () {
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(function (track) {
                track.stop();
            });
            this.mediaStream.getVideoTracks().forEach(function (track) {
                track.stop();
            });
            delete this.mediaStream;
        }
        if (this.localMediaStreamWhenSubscribedToRemote) {
            this.localMediaStreamWhenSubscribedToRemote.getAudioTracks().forEach(function (track) {
                track.stop();
            });
            this.localMediaStreamWhenSubscribedToRemote.getVideoTracks().forEach(function (track) {
                track.stop();
            });
            delete this.localMediaStreamWhenSubscribedToRemote;
        }
        if (!!this.speechEvent) {
            if (!!this.speechEvent.stop) {
                this.speechEvent.stop();
            }
            delete this.speechEvent;
        }
        logger.info((!!this.outboundStreamOpts ? 'Local ' : 'Remote ') + "MediaStream from 'Stream' with id [" + this.streamId + '] is now disposed');
    };
    Stream.prototype.displayMyRemote = function () {
        return this.isSubscribeToRemote;
    };
    Stream.prototype.isSendAudio = function () {
        return (!!this.outboundStreamOpts &&
            this.outboundStreamOpts.publisherProperties.audioSource !== null &&
            this.outboundStreamOpts.publisherProperties.audioSource !== false);
    };
    Stream.prototype.isSendVideo = function () {
        return (!!this.outboundStreamOpts &&
            this.outboundStreamOpts.publisherProperties.videoSource !== null &&
            this.outboundStreamOpts.publisherProperties.videoSource !== false);
    };
    Stream.prototype.isSendScreen = function () {
        var screen = this.outboundStreamOpts.publisherProperties.videoSource === 'screen';
        if (platform.isElectron()) {
            screen = typeof this.outboundStreamOpts.publisherProperties.videoSource === 'string' &&
                this.outboundStreamOpts.publisherProperties.videoSource.startsWith('screen:');
        }
        return !!this.outboundStreamOpts && screen;
    };
    Stream.prototype.enableHarkSpeakingEvent = function () {
        var _this = this;
        this.setHarkListenerIfNotExists();
        if (!this.harkSpeakingEnabled && !!this.speechEvent) {
            this.harkSpeakingEnabled = true;
            this.speechEvent.on('speaking', function () {
                _this.session.emitEvent('publisherStartSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.session, 'publisherStartSpeaking', _this.connection, _this.streamId)]);
                _this.streamManager.emitEvent('publisherStartSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.streamManager, 'publisherStartSpeaking', _this.connection, _this.streamId)]);
                _this.harkSpeakingEnabledOnce = false;
            });
        }
    };
    Stream.prototype.enableOnceHarkSpeakingEvent = function () {
        var _this = this;
        this.setHarkListenerIfNotExists();
        if (!this.harkSpeakingEnabledOnce && !!this.speechEvent) {
            this.harkSpeakingEnabledOnce = true;
            this.speechEvent.once('speaking', function () {
                if (_this.harkSpeakingEnabledOnce) {
                    _this.session.emitEvent('publisherStartSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.session, 'publisherStartSpeaking', _this.connection, _this.streamId)]);
                    _this.streamManager.emitEvent('publisherStartSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.streamManager, 'publisherStartSpeaking', _this.connection, _this.streamId)]);
                }
                _this.disableHarkSpeakingEvent(true);
            });
        }
    };
    Stream.prototype.disableHarkSpeakingEvent = function (disabledByOnce) {
        if (!!this.speechEvent) {
            this.harkSpeakingEnabledOnce = false;
            if (disabledByOnce) {
                if (this.harkSpeakingEnabled) {
                    return;
                }
            }
            else {
                this.harkSpeakingEnabled = false;
            }
            if (this.harkVolumeChangeEnabled ||
                this.harkVolumeChangeEnabledOnce ||
                this.harkStoppedSpeakingEnabled ||
                this.harkStoppedSpeakingEnabledOnce) {
                this.speechEvent.off('speaking');
            }
            else {
                this.speechEvent.stop();
                delete this.speechEvent;
            }
        }
    };
    Stream.prototype.enableHarkStoppedSpeakingEvent = function () {
        var _this = this;
        this.setHarkListenerIfNotExists();
        if (!this.harkStoppedSpeakingEnabled && !!this.speechEvent) {
            this.harkStoppedSpeakingEnabled = true;
            this.speechEvent.on('stopped_speaking', function () {
                _this.session.emitEvent('publisherStopSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.session, 'publisherStopSpeaking', _this.connection, _this.streamId)]);
                _this.streamManager.emitEvent('publisherStopSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.streamManager, 'publisherStopSpeaking', _this.connection, _this.streamId)]);
                _this.harkStoppedSpeakingEnabledOnce = false;
            });
        }
    };
    Stream.prototype.enableOnceHarkStoppedSpeakingEvent = function () {
        var _this = this;
        this.setHarkListenerIfNotExists();
        if (!this.harkStoppedSpeakingEnabledOnce && !!this.speechEvent) {
            this.harkStoppedSpeakingEnabledOnce = true;
            this.speechEvent.once('stopped_speaking', function () {
                if (_this.harkStoppedSpeakingEnabledOnce) {
                    _this.session.emitEvent('publisherStopSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.session, 'publisherStopSpeaking', _this.connection, _this.streamId)]);
                    _this.streamManager.emitEvent('publisherStopSpeaking', [new PublisherSpeakingEvent_1.PublisherSpeakingEvent(_this.streamManager, 'publisherStopSpeaking', _this.connection, _this.streamId)]);
                }
                _this.disableHarkStoppedSpeakingEvent(true);
            });
        }
    };
    Stream.prototype.disableHarkStoppedSpeakingEvent = function (disabledByOnce) {
        if (!!this.speechEvent) {
            this.harkStoppedSpeakingEnabledOnce = false;
            if (disabledByOnce) {
                if (this.harkStoppedSpeakingEnabled) {
                    return;
                }
            }
            else {
                this.harkStoppedSpeakingEnabled = false;
            }
            if (this.harkVolumeChangeEnabled ||
                this.harkVolumeChangeEnabledOnce ||
                this.harkSpeakingEnabled ||
                this.harkSpeakingEnabledOnce) {
                this.speechEvent.off('stopped_speaking');
            }
            else {
                this.speechEvent.stop();
                delete this.speechEvent;
            }
        }
    };
    Stream.prototype.enableHarkVolumeChangeEvent = function (force) {
        var _this = this;
        if (this.setHarkListenerIfNotExists()) {
            if (!this.harkVolumeChangeEnabled || force) {
                this.harkVolumeChangeEnabled = true;
                this.speechEvent.on('volume_change', function (harkEvent) {
                    var oldValue = _this.speechEvent.oldVolumeValue;
                    var value = { newValue: harkEvent, oldValue: oldValue };
                    _this.speechEvent.oldVolumeValue = harkEvent;
                    _this.streamManager.emitEvent('streamAudioVolumeChange', [new StreamManagerEvent_1.StreamManagerEvent(_this.streamManager, 'streamAudioVolumeChange', value)]);
                });
            }
        }
        else {
            this.harkVolumeChangeEnabled = true;
        }
    };
    Stream.prototype.enableOnceHarkVolumeChangeEvent = function (force) {
        var _this = this;
        if (this.setHarkListenerIfNotExists()) {
            if (!this.harkVolumeChangeEnabledOnce || force) {
                this.harkVolumeChangeEnabledOnce = true;
                this.speechEvent.once('volume_change', function (harkEvent) {
                    var oldValue = _this.speechEvent.oldVolumeValue;
                    var value = { newValue: harkEvent, oldValue: oldValue };
                    _this.speechEvent.oldVolumeValue = harkEvent;
                    _this.disableHarkVolumeChangeEvent(true);
                    _this.streamManager.emitEvent('streamAudioVolumeChange', [new StreamManagerEvent_1.StreamManagerEvent(_this.streamManager, 'streamAudioVolumeChange', value)]);
                });
            }
        }
        else {
            this.harkVolumeChangeEnabledOnce = true;
        }
    };
    Stream.prototype.disableHarkVolumeChangeEvent = function (disabledByOnce) {
        if (!!this.speechEvent) {
            this.harkVolumeChangeEnabledOnce = false;
            if (disabledByOnce) {
                if (this.harkVolumeChangeEnabled) {
                    return;
                }
            }
            else {
                this.harkVolumeChangeEnabled = false;
            }
            if (this.harkSpeakingEnabled ||
                this.harkSpeakingEnabledOnce ||
                this.harkStoppedSpeakingEnabled ||
                this.harkStoppedSpeakingEnabledOnce) {
                this.speechEvent.off('volume_change');
            }
            else {
                this.speechEvent.stop();
                delete this.speechEvent;
            }
        }
    };
    Stream.prototype.isLocal = function () {
        return (!this.inboundStreamOpts && !!this.outboundStreamOpts);
    };
    Stream.prototype.getSelectedIceCandidate = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.webRtcStats.getSelectedIceCandidateInfo()
                .then(function (report) { return resolve(report); })
                .catch(function (error) { return reject(error); });
        });
    };
    Stream.prototype.getRemoteIceCandidateList = function () {
        return this.webRtcPeer.remoteCandidatesQueue;
    };
    Stream.prototype.getLocalIceCandidateList = function () {
        return this.webRtcPeer.localCandidatesQueue;
    };
    Stream.prototype.streamIceConnectionStateBroken = function () {
        if (!this.getWebRtcPeer() || !this.getRTCPeerConnection()) {
            return false;
        }
        if (this.isLocal() && !!this.session.openvidu.advancedConfiguration.forceMediaReconnectionAfterNetworkDrop) {
            logger.warn("OpenVidu Browser advanced configuration option \"forceMediaReconnectionAfterNetworkDrop\" is enabled. Stream ".concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") will force a reconnection"));
            return true;
        }
        var iceConnectionState = this.getRTCPeerConnection().iceConnectionState;
        return iceConnectionState !== 'connected' && iceConnectionState !== 'completed';
    };
    Stream.prototype.setHarkListenerIfNotExists = function () {
        if (!!this.mediaStream) {
            if (!this.speechEvent) {
                var harkOptions = !!this.harkOptions ? this.harkOptions : (this.session.openvidu.advancedConfiguration.publisherSpeakingEventsOptions || {});
                harkOptions.interval = (typeof harkOptions.interval === 'number') ? harkOptions.interval : 100;
                harkOptions.threshold = (typeof harkOptions.threshold === 'number') ? harkOptions.threshold : -50;
                this.speechEvent = hark(this.mediaStream, harkOptions);
            }
            return true;
        }
        return false;
    };
    Stream.prototype.setupReconnectionEventEmitter = function (resolve, reject) {
        if (this.reconnectionEventEmitter == undefined) {
            this.reconnectionEventEmitter = new EventEmitter();
            return false;
        }
        else {
            console.warn("Trying to reconnect stream ".concat(this.streamId, " (").concat(this.isLocal() ? 'Publisher' : 'Subscriber', ") but an ongoing reconnection process is active. Waiting for response..."));
            this.reconnectionEventEmitter.once('success', function () { return resolve(); });
            this.reconnectionEventEmitter.once('error', function (error) { return reject(error); });
            return true;
        }
    };
    Stream.prototype.initWebRtcPeerSend = function (reconnect) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            if (reconnect) {
                if (_this.setupReconnectionEventEmitter(resolve, reject)) {
                    return;
                }
            }
            else {
                _this.initHarkEvents();
            }
            var finalResolve = function () {
                var _a;
                if (reconnect) {
                    (_a = _this.reconnectionEventEmitter) === null || _a === void 0 ? void 0 : _a.emitEvent('success');
                    delete _this.reconnectionEventEmitter;
                }
                return resolve();
            };
            var finalReject = function (error) {
                var _a;
                if (reconnect) {
                    (_a = _this.reconnectionEventEmitter) === null || _a === void 0 ? void 0 : _a.emitEvent('error', [error]);
                    delete _this.reconnectionEventEmitter;
                }
                return reject(error);
            };
            var successOfferCallback = function (sdpOfferParam) {
                logger.debug('Sending SDP offer to publish as '
                    + _this.streamId, sdpOfferParam);
                var method = reconnect ? 'reconnectStream' : 'publishVideo';
                var params;
                if (reconnect) {
                    params = {
                        stream: _this.streamId,
                        sdpString: sdpOfferParam
                    };
                }
                else {
                    var typeOfVideo = void 0;
                    if (_this.isSendVideo()) {
                        typeOfVideo = (typeof MediaStreamTrack !== 'undefined' && _this.outboundStreamOpts.publisherProperties.videoSource instanceof MediaStreamTrack) ? TypeOfVideo_1.TypeOfVideo.CUSTOM : (_this.isSendScreen() ? TypeOfVideo_1.TypeOfVideo.SCREEN : TypeOfVideo_1.TypeOfVideo.CAMERA);
                    }
                    params = {
                        doLoopback: _this.displayMyRemote() || false,
                        hasAudio: _this.isSendAudio(),
                        hasVideo: _this.isSendVideo(),
                        audioActive: _this.audioActive,
                        videoActive: _this.videoActive,
                        typeOfVideo: typeOfVideo,
                        frameRate: !!_this.frameRate ? _this.frameRate : -1,
                        videoDimensions: JSON.stringify(_this.videoDimensions),
                        filter: _this.outboundStreamOpts.publisherProperties.filter,
                        sdpOffer: sdpOfferParam
                    };
                }
                _this.session.openvidu.sendRequest(method, params, function (error, response) {
                    if (error) {
                        if (error.code === 401) {
                            finalReject(new OpenViduError_1.OpenViduError(OpenViduError_1.OpenViduErrorName.OPENVIDU_PERMISSION_DENIED, "You don't have permissions to publish"));
                        }
                        else {
                            finalReject('Error on publishVideo: ' + JSON.stringify(error));
                        }
                    }
                    else {
                        _this.webRtcPeer.processRemoteAnswer(response.sdpAnswer)
                            .then(function () {
                            _this.streamId = response.id;
                            _this.creationTime = response.createdAt;
                            _this.isLocalStreamPublished = true;
                            _this.publishedOnce = true;
                            if (_this.displayMyRemote()) {
                                _this.localMediaStreamWhenSubscribedToRemote = _this.mediaStream;
                                _this.remotePeerSuccessfullyEstablished(reconnect);
                            }
                            if (reconnect) {
                                _this.ee.emitEvent('stream-reconnected-by-publisher', []);
                            }
                            else {
                                _this.ee.emitEvent('stream-created-by-publisher', []);
                            }
                            _this.initWebRtcStats();
                            logger.info("'Publisher' (" + _this.streamId + ") successfully " + (reconnect ? "reconnected" : "published") + " to session");
                            finalResolve();
                        })
                            .catch(function (error) {
                            finalReject(error);
                        });
                    }
                });
            };
            var config = {
                mediaConstraints: {
                    audio: _this.hasAudio,
                    video: _this.hasVideo,
                },
                simulcast: (_a = _this.outboundStreamOpts.publisherProperties.videoSimulcast) !== null && _a !== void 0 ? _a : _this.session.openvidu.videoSimulcast,
                onIceCandidate: _this.connection.sendIceCandidate.bind(_this.connection),
                onIceConnectionStateException: function (exceptionName, message, data) { _this.session.emitEvent('exception', [new ExceptionEvent_1.ExceptionEvent(_this.session, exceptionName, _this, message, data)]); },
                iceServers: _this.getIceServersConf(),
                mediaStream: _this.mediaStream,
                mediaServer: _this.session.openvidu.mediaServer,
                typeOfVideo: _this.typeOfVideo ? TypeOfVideo_1.TypeOfVideo[_this.typeOfVideo] : undefined,
            };
            if (_this.session.openvidu.mediaServer !== 'mediasoup') {
                config.simulcast = false;
            }
            if (reconnect) {
                _this.disposeWebRtcPeer();
            }
            if (_this.displayMyRemote()) {
                _this.webRtcPeer = new WebRtcPeer_1.WebRtcPeerSendrecv(config);
            }
            else {
                _this.webRtcPeer = new WebRtcPeer_1.WebRtcPeerSendonly(config);
            }
            _this.webRtcPeer.addIceConnectionStateChangeListener('publisher of ' + _this.connection.connectionId);
            _this.webRtcPeer.createOffer().then(function (sdpOffer) {
                _this.webRtcPeer.processLocalOffer(sdpOffer)
                    .then(function () {
                    successOfferCallback(sdpOffer.sdp);
                }).catch(function (error) {
                    finalReject(new Error('(publish) SDP process local offer error: ' + JSON.stringify(error)));
                });
            }).catch(function (error) {
                finalReject(new Error('(publish) SDP create offer error: ' + JSON.stringify(error)));
            });
        });
    };
    Stream.prototype.finalResolveForSubscription = function (reconnect, resolve) {
        var _a;
        logger.info("'Subscriber' (" + this.streamId + ") successfully " + (reconnect ? "reconnected" : "subscribed"));
        this.remotePeerSuccessfullyEstablished(reconnect);
        this.initWebRtcStats();
        if (reconnect) {
            (_a = this.reconnectionEventEmitter) === null || _a === void 0 ? void 0 : _a.emitEvent('success');
            delete this.reconnectionEventEmitter;
        }
        return resolve();
    };
    Stream.prototype.finalRejectForSubscription = function (reconnect, error, reject) {
        var _a;
        logger.error("Error for 'Subscriber' (" + this.streamId + ") while trying to " + (reconnect ? "reconnect" : "subscribe") + ": " + error.toString());
        if (reconnect) {
            (_a = this.reconnectionEventEmitter) === null || _a === void 0 ? void 0 : _a.emitEvent('error', [error]);
            delete this.reconnectionEventEmitter;
        }
        return reject(error);
    };
    Stream.prototype.initWebRtcPeerReceive = function (reconnect) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (reconnect) {
                if (_this.setupReconnectionEventEmitter(resolve, reject)) {
                    return;
                }
            }
            if (_this.session.openvidu.mediaServer === 'mediasoup') {
                _this.initWebRtcPeerReceiveFromServer(reconnect)
                    .then(function () { return _this.finalResolveForSubscription(reconnect, resolve); })
                    .catch(function (error) { return _this.finalRejectForSubscription(reconnect, error, reject); });
            }
            else {
                _this.initWebRtcPeerReceiveFromClient(reconnect)
                    .then(function () { return _this.finalResolveForSubscription(reconnect, resolve); })
                    .catch(function (error) { return _this.finalRejectForSubscription(reconnect, error, reject); });
            }
        });
    };
    Stream.prototype.initWebRtcPeerReceiveFromClient = function (reconnect) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.completeWebRtcPeerReceive(reconnect, false)
                .then(function (response) {
                _this.webRtcPeer.processRemoteAnswer(response.sdpAnswer)
                    .then(function () { return resolve(); })
                    .catch(function (error) { return reject(error); });
            })
                .catch(function (error) { return reject(error); });
        });
    };
    Stream.prototype.initWebRtcPeerReceiveFromServer = function (reconnect) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.session.openvidu.sendRequest('prepareReceiveVideoFrom', { sender: _this.streamId, reconnect: reconnect }, function (error, response) {
                if (error) {
                    return reject(new Error('Error on prepareReceiveVideoFrom: ' + JSON.stringify(error)));
                }
                else {
                    _this.completeWebRtcPeerReceive(reconnect, false, response.sdpOffer)
                        .then(function () { return resolve(); })
                        .catch(function (error) { return reject(error); });
                }
            });
        });
    };
    Stream.prototype.completeWebRtcPeerReceive = function (reconnect, forciblyReconnect, sdpOfferByServer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            logger.debug("'Session.subscribe(Stream)' called");
            var sendSdpToServer = function (sdpString) {
                logger.debug("Sending local SDP ".concat((!!sdpOfferByServer ? 'answer' : 'offer'), " to subscribe to ").concat(_this.streamId), sdpString);
                var method = reconnect ? 'reconnectStream' : 'receiveVideoFrom';
                var params = {};
                params[reconnect ? 'stream' : 'sender'] = _this.streamId;
                if (!!sdpOfferByServer) {
                    params[reconnect ? 'sdpString' : 'sdpAnswer'] = sdpString;
                }
                else {
                    params['sdpOffer'] = sdpString;
                }
                if (reconnect) {
                    params['forciblyReconnect'] = forciblyReconnect;
                }
                _this.session.openvidu.sendRequest(method, params, function (error, response) {
                    if (error) {
                        return reject(new Error('Error on ' + method + ' : ' + JSON.stringify(error)));
                    }
                    else {
                        return resolve(response);
                    }
                });
            };
            var config = {
                mediaConstraints: {
                    audio: _this.hasAudio,
                    video: _this.hasVideo,
                },
                simulcast: false,
                onIceCandidate: _this.connection.sendIceCandidate.bind(_this.connection),
                onIceConnectionStateException: function (exceptionName, message, data) { _this.session.emitEvent('exception', [new ExceptionEvent_1.ExceptionEvent(_this.session, exceptionName, _this, message, data)]); },
                iceServers: _this.getIceServersConf(),
                mediaServer: _this.session.openvidu.mediaServer,
                typeOfVideo: _this.typeOfVideo ? TypeOfVideo_1.TypeOfVideo[_this.typeOfVideo] : undefined,
            };
            if (reconnect) {
                _this.disposeWebRtcPeer();
            }
            _this.webRtcPeer = new WebRtcPeer_1.WebRtcPeerRecvonly(config);
            _this.webRtcPeer.addIceConnectionStateChangeListener(_this.streamId);
            if (!!sdpOfferByServer) {
                _this.webRtcPeer.processRemoteOffer(sdpOfferByServer).then(function () {
                    _this.webRtcPeer.createAnswer().then(function (sdpAnswer) {
                        _this.webRtcPeer.processLocalAnswer(sdpAnswer).then(function () {
                            sendSdpToServer(sdpAnswer.sdp);
                        }).catch(function (error) {
                            return reject(new Error('(subscribe) SDP process local answer error: ' + JSON.stringify(error)));
                        });
                    }).catch(function (error) {
                        return reject(new Error('(subscribe) SDP create answer error: ' + JSON.stringify(error)));
                    });
                }).catch(function (error) {
                    return reject(new Error('(subscribe) SDP process remote offer error: ' + JSON.stringify(error)));
                });
            }
            else {
                _this.webRtcPeer.createOffer().then(function (sdpOffer) {
                    _this.webRtcPeer.processLocalOffer(sdpOffer).then(function () {
                        sendSdpToServer(sdpOffer.sdp);
                    }).catch(function (error) {
                        return reject(new Error('(subscribe) SDP process local offer error: ' + JSON.stringify(error)));
                    });
                }).catch(function (error) {
                    return reject(new Error('(subscribe) SDP create offer error: ' + JSON.stringify(error)));
                });
            }
        });
    };
    Stream.prototype.remotePeerSuccessfullyEstablished = function (reconnect) {
        if (reconnect && this.mediaStream != null) {
            this.disposeMediaStream();
        }
        this.mediaStream = new MediaStream();
        var receiver;
        for (var _i = 0, _a = this.webRtcPeer.pc.getReceivers(); _i < _a.length; _i++) {
            receiver = _a[_i];
            if (!!receiver.track) {
                this.mediaStream.addTrack(receiver.track);
            }
        }
        logger.debug('Peer remote stream', this.mediaStream);
        if (!!this.mediaStream) {
            if (this.streamManager instanceof Subscriber_1.Subscriber) {
                if (!!this.mediaStream.getAudioTracks()[0]) {
                    var enabled = reconnect ? this.audioActive : !!(this.streamManager.properties.subscribeToAudio);
                    this.mediaStream.getAudioTracks()[0].enabled = enabled;
                }
                if (!!this.mediaStream.getVideoTracks()[0]) {
                    var enabled = reconnect ? this.videoActive : !!(this.streamManager.properties.subscribeToVideo);
                    this.mediaStream.getVideoTracks()[0].enabled = enabled;
                }
            }
            this.updateMediaStreamInVideos();
            this.initHarkEvents();
        }
    };
    Stream.prototype.initHarkEvents = function () {
        if (!!this.mediaStream.getAudioTracks()[0]) {
            if (this.session.anySpeechEventListenerEnabled('publisherStartSpeaking', true, this.streamManager)) {
                this.enableOnceHarkSpeakingEvent();
            }
            if (this.session.anySpeechEventListenerEnabled('publisherStartSpeaking', false, this.streamManager)) {
                this.enableHarkSpeakingEvent();
            }
            if (this.session.anySpeechEventListenerEnabled('publisherStopSpeaking', true, this.streamManager)) {
                this.enableOnceHarkStoppedSpeakingEvent();
            }
            if (this.session.anySpeechEventListenerEnabled('publisherStopSpeaking', false, this.streamManager)) {
                this.enableHarkStoppedSpeakingEvent();
            }
            if (this.harkVolumeChangeEnabledOnce) {
                this.enableOnceHarkVolumeChangeEvent(true);
            }
            if (this.harkVolumeChangeEnabled) {
                this.enableHarkVolumeChangeEvent(true);
            }
        }
    };
    Stream.prototype.onIceConnectionStateExceptionHandler = function (exceptionName, message, data) {
        switch (exceptionName) {
            case ExceptionEvent_1.ExceptionEventName.ICE_CONNECTION_FAILED:
                this.onIceConnectionFailed();
                break;
            case ExceptionEvent_1.ExceptionEventName.ICE_CONNECTION_DISCONNECTED:
                this.onIceConnectionDisconnected();
                break;
        }
        this.session.emitEvent('exception', [new ExceptionEvent_1.ExceptionEvent(this.session, exceptionName, this, message, data)]);
    };
    Stream.prototype.onIceConnectionFailed = function () {
        logger.log("[ICE_CONNECTION_FAILED] Handling ICE_CONNECTION_FAILED event. Reconnecting stream ".concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ")"));
        this.reconnectStreamAndLogResultingIceConnectionState(ExceptionEvent_1.ExceptionEventName.ICE_CONNECTION_FAILED);
    };
    Stream.prototype.onIceConnectionDisconnected = function () {
        var _this = this;
        logger.log("[ICE_CONNECTION_DISCONNECTED] Handling ICE_CONNECTION_DISCONNECTED event. Waiting for ICE to be restored and reconnect stream ".concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") if not possible"));
        var timeout = this.session.openvidu.advancedConfiguration.iceConnectionDisconnectedExceptionTimeout || 4000;
        this.awaitWebRtcPeerConnectionState(timeout).then(function (state) {
            switch (state) {
                case 'failed':
                    logger.warn("[ICE_CONNECTION_DISCONNECTED] ICE connection of stream ".concat(_this.streamId, " (").concat((_this.isLocal() ? 'Publisher' : 'Subscriber'), ") is now failed after ICE_CONNECTION_DISCONNECTED"));
                    break;
                case 'connected':
                case 'completed':
                    logger.log("[ICE_CONNECTION_DISCONNECTED] ICE connection of stream ".concat(_this.streamId, " (").concat((_this.isLocal() ? 'Publisher' : 'Subscriber'), ") automatically restored after ICE_CONNECTION_DISCONNECTED. Current ICE connection state: ").concat(state));
                    break;
                case 'closed':
                case 'checking':
                case 'new':
                case 'disconnected':
                    logger.warn("[ICE_CONNECTION_DISCONNECTED] ICE connection of stream ".concat(_this.streamId, " (").concat((_this.isLocal() ? 'Publisher' : 'Subscriber'), ") couldn't be restored after ICE_CONNECTION_DISCONNECTED event. Current ICE connection state after ").concat(timeout, " ms: ").concat(state));
                    _this.reconnectStreamAndLogResultingIceConnectionState(ExceptionEvent_1.ExceptionEventName.ICE_CONNECTION_DISCONNECTED);
                    break;
            }
        });
    };
    Stream.prototype.reconnectStreamAndLogResultingIceConnectionState = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var finalIceStateAfterReconnection, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, this.reconnectStreamAndReturnIceConnectionState(event)];
                    case 1:
                        finalIceStateAfterReconnection = _a.sent();
                        switch (finalIceStateAfterReconnection) {
                            case 'connected':
                            case 'completed':
                                logger.log("[".concat(event, "] Stream ").concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") successfully reconnected after ").concat(event, ". Current ICE connection state: ").concat(finalIceStateAfterReconnection));
                                break;
                            default:
                                logger.error("[".concat(event, "] Stream ").concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") failed to reconnect after ").concat(event, ". Current ICE connection state: ").concat(finalIceStateAfterReconnection));
                                break;
                        }
                        return [3, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger.error("[".concat(event, "] Error reconnecting stream ").concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") after ").concat(event, ": ").concat(error_1));
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    Stream.prototype.reconnectStreamAndReturnIceConnectionState = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var timeout, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.log("[".concat(event, "] Reconnecting stream ").concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") after event ").concat(event));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.reconnectStream(event)];
                    case 2:
                        _a.sent();
                        timeout = this.session.openvidu.advancedConfiguration.iceConnectionDisconnectedExceptionTimeout || 4000;
                        return [2, this.awaitWebRtcPeerConnectionState(timeout)];
                    case 3:
                        error_2 = _a.sent();
                        logger.warn("[".concat(event, "] Error reconnecting stream ").concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), "). Reason: ").concat(error_2));
                        return [2, this.awaitWebRtcPeerConnectionState(1)];
                    case 4: return [2];
                }
            });
        });
    };
    Stream.prototype.reconnectStream = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var isWsConnected, errorMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.isWebsocketConnected(event, 3000)];
                    case 1:
                        isWsConnected = _a.sent();
                        if (isWsConnected) {
                            logger.log("[".concat(event, "] Trying to reconnect stream ").concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") and the websocket is opened"));
                            if (this.isLocal()) {
                                return [2, this.initWebRtcPeerSend(true)];
                            }
                            else {
                                return [2, this.initWebRtcPeerReceive(true)];
                            }
                        }
                        else {
                            errorMsg = "[".concat(event, "] Trying to reconnect stream ").concat(this.streamId, " (").concat((this.isLocal() ? 'Publisher' : 'Subscriber'), ") but the websocket wasn't opened");
                            logger.error(errorMsg);
                            throw Error(errorMsg);
                        }
                        return [2];
                }
            });
        });
    };
    Stream.prototype.isWebsocketConnected = function (event, msResponseTimeout) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var wsReadyState = _this.session.openvidu.getWsReadyState();
            if (wsReadyState === 1) {
                var responseTimeout_1 = setTimeout(function () {
                    console.warn("[".concat(event, "] Websocket timeout of ").concat(msResponseTimeout, "ms"));
                    return resolve(false);
                }, msResponseTimeout);
                _this.session.openvidu.sendRequest('echo', {}, function (error, response) {
                    clearTimeout(responseTimeout_1);
                    if (!!error) {
                        console.warn("[".concat(event, "] Websocket 'echo' returned error: ").concat(error));
                        return resolve(false);
                    }
                    else {
                        return resolve(true);
                    }
                });
            }
            else {
                console.warn("[".concat(event, "] Websocket readyState is ").concat(wsReadyState));
                return resolve(false);
            }
        });
    };
    Stream.prototype.awaitWebRtcPeerConnectionState = function (timeout) {
        return __awaiter(this, void 0, void 0, function () {
            var state, interval, intervals, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        state = this.getRTCPeerConnection().iceConnectionState;
                        interval = 150;
                        intervals = Math.ceil(timeout / interval);
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < intervals)) return [3, 4];
                        state = this.getRTCPeerConnection().iceConnectionState;
                        if (state === 'connected' || state === 'completed') {
                            return [3, 4];
                        }
                        return [4, new Promise(function (resolve) { return setTimeout(resolve, interval); })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3, 1];
                    case 4: return [2, state];
                }
            });
        });
    };
    Stream.prototype.initWebRtcStats = function () {
        this.webRtcStats = new WebRtcStats_1.WebRtcStats(this);
        this.webRtcStats.initWebRtcStats();
    };
    Stream.prototype.stopWebRtcStats = function () {
        if (!!this.webRtcStats && this.webRtcStats.isEnabled()) {
            this.webRtcStats.stopWebRtcStats();
        }
    };
    Stream.prototype.getIceServersConf = function () {
        var returnValue;
        if (!!this.session.openvidu.advancedConfiguration.iceServers) {
            returnValue = this.session.openvidu.advancedConfiguration.iceServers === 'freeice' ?
                undefined :
                this.session.openvidu.advancedConfiguration.iceServers;
        }
        else if (this.session.openvidu.iceServers) {
            returnValue = this.session.openvidu.iceServers;
        }
        else {
            returnValue = undefined;
        }
        return returnValue;
    };
    Stream.prototype.gatherStatsForPeer = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.isLocal()) {
                _this.getRTCPeerConnection().getSenders().forEach(function (sender) { return sender.getStats()
                    .then(function (response) {
                    response.forEach(function (report) {
                        if (_this.isReportWanted(report)) {
                            var finalReport = {};
                            finalReport['type'] = report.type;
                            finalReport['timestamp'] = report.timestamp;
                            finalReport['id'] = report.id;
                            if (report.type === 'outbound-rtp') {
                                finalReport['ssrc'] = report.ssrc;
                                finalReport['firCount'] = report.firCount;
                                finalReport['pliCount'] = report.pliCount;
                                finalReport['nackCount'] = report.nackCount;
                                finalReport['qpSum'] = report.qpSum;
                                if (!!report.kind) {
                                    finalReport['mediaType'] = report.kind;
                                }
                                else if (!!report.mediaType) {
                                    finalReport['mediaType'] = report.mediaType;
                                }
                                else {
                                    finalReport['mediaType'] = (report.id.indexOf('VideoStream') !== -1) ? 'video' : 'audio';
                                }
                                if (finalReport['mediaType'] === 'video') {
                                    finalReport['framesEncoded'] = report.framesEncoded;
                                }
                                finalReport['packetsSent'] = report.packetsSent;
                                finalReport['bytesSent'] = report.bytesSent;
                            }
                            if (report.type === 'candidate-pair' && report.totalRoundTripTime !== undefined) {
                                finalReport['availableOutgoingBitrate'] = report.availableOutgoingBitrate;
                                finalReport['rtt'] = report.currentRoundTripTime;
                                finalReport['averageRtt'] = report.totalRoundTripTime / report.responsesReceived;
                            }
                            if (report.type === 'remote-inbound-rtp' || report.type === 'remote-outbound-rtp') {
                            }
                            logger.log(finalReport);
                        }
                    });
                }); });
            }
            else {
                _this.getRTCPeerConnection().getReceivers().forEach(function (receiver) { return receiver.getStats()
                    .then(function (response) {
                    response.forEach(function (report) {
                        if (_this.isReportWanted(report)) {
                            var finalReport = {};
                            finalReport['type'] = report.type;
                            finalReport['timestamp'] = report.timestamp;
                            finalReport['id'] = report.id;
                            if (report.type === 'inbound-rtp') {
                                finalReport['ssrc'] = report.ssrc;
                                finalReport['firCount'] = report.firCount;
                                finalReport['pliCount'] = report.pliCount;
                                finalReport['nackCount'] = report.nackCount;
                                finalReport['qpSum'] = report.qpSum;
                                if (!!report.kind) {
                                    finalReport['mediaType'] = report.kind;
                                }
                                else if (!!report.mediaType) {
                                    finalReport['mediaType'] = report.mediaType;
                                }
                                else {
                                    finalReport['mediaType'] = (report.id.indexOf('VideoStream') !== -1) ? 'video' : 'audio';
                                }
                                if (finalReport['mediaType'] === 'video') {
                                    finalReport['framesDecoded'] = report.framesDecoded;
                                }
                                finalReport['packetsReceived'] = report.packetsReceived;
                                finalReport['packetsLost'] = report.packetsLost;
                                finalReport['jitter'] = report.jitter;
                                finalReport['bytesReceived'] = report.bytesReceived;
                            }
                            if (report.type === 'candidate-pair' && report.totalRoundTripTime !== undefined) {
                                finalReport['availableIncomingBitrate'] = report.availableIncomingBitrate;
                                finalReport['rtt'] = report.currentRoundTripTime;
                                finalReport['averageRtt'] = report.totalRoundTripTime / report.responsesReceived;
                            }
                            if (report.type === 'remote-inbound-rtp' || report.type === 'remote-outbound-rtp') {
                            }
                            logger.log(finalReport);
                        }
                    });
                }); });
            }
        });
    };
    Stream.prototype.isReportWanted = function (report) {
        return report.type === 'inbound-rtp' && !this.isLocal() ||
            report.type === 'outbound-rtp' && this.isLocal() ||
            (report.type === 'candidate-pair' && report.nominated && report.bytesSent > 0);
    };
    return Stream;
}());
exports.Stream = Stream;

},{"../OpenViduInternal/Enums/OpenViduError":52,"../OpenViduInternal/Enums/TypeOfVideo":53,"../OpenViduInternal/Events/ExceptionEvent":58,"../OpenViduInternal/Events/PublisherSpeakingEvent":61,"../OpenViduInternal/Events/StreamManagerEvent":66,"../OpenViduInternal/Events/StreamPropertyChangedEvent":67,"../OpenViduInternal/Logger/OpenViduLogger":79,"../OpenViduInternal/Utils/Platform":83,"../OpenViduInternal/WebRtcPeer/WebRtcPeer":84,"../OpenViduInternal/WebRtcStats/WebRtcStats":85,"./Filter":43,"./Subscriber":50,"hark":5,"wolfy87-eventemitter":38}],49:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamManager = void 0;
var EventDispatcher_1 = require("./EventDispatcher");
var StreamManagerEvent_1 = require("../OpenViduInternal/Events/StreamManagerEvent");
var VideoElementEvent_1 = require("../OpenViduInternal/Events/VideoElementEvent");
var ExceptionEvent_1 = require("../OpenViduInternal/Events/ExceptionEvent");
var VideoInsertMode_1 = require("../OpenViduInternal/Enums/VideoInsertMode");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var Platform_1 = require("../OpenViduInternal/Utils/Platform");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
var StreamManager = (function (_super) {
    __extends(StreamManager, _super);
    function StreamManager(stream, targetElement) {
        var _this = _super.call(this) || this;
        _this.videos = [];
        _this.lazyLaunchVideoElementCreatedEvent = false;
        platform = Platform_1.PlatformUtils.getInstance();
        _this.stream = stream;
        _this.stream.streamManager = _this;
        _this.remote = !_this.stream.isLocal();
        if (!!targetElement) {
            var targEl = void 0;
            if (typeof targetElement === 'string') {
                targEl = document.getElementById(targetElement);
            }
            else if (targetElement instanceof HTMLElement) {
                targEl = targetElement;
            }
            if (!!targEl) {
                _this.firstVideoElement = {
                    targetElement: targEl,
                    video: document.createElement('video'),
                    id: '',
                    canplayListenerAdded: false
                };
                if (platform.isSafariBrowser() || (platform.isIPhoneOrIPad() && (platform.isChromeMobileBrowser() || platform.isEdgeMobileBrowser() || platform.isOperaMobileBrowser() || platform.isFirefoxMobileBrowser()))) {
                    _this.firstVideoElement.video.setAttribute('playsinline', 'true');
                }
                _this.targetElement = targEl;
                _this.element = targEl;
            }
        }
        _this.canPlayListener = function () {
            _this.deactivateStreamPlayingEventExceptionTimeout();
            _this.ee.emitEvent('streamPlaying', [new StreamManagerEvent_1.StreamManagerEvent(_this, 'streamPlaying', undefined)]);
        };
        return _this;
    }
    StreamManager.prototype.on = function (type, handler) {
        _super.prototype.onAux.call(this, type, "Event '" + type + "' triggered by '" + (this.remote ? 'Subscriber' : 'Publisher') + "'", handler);
        if (type === 'videoElementCreated') {
            if (!!this.stream && this.lazyLaunchVideoElementCreatedEvent) {
                this.ee.emitEvent('videoElementCreated', [new VideoElementEvent_1.VideoElementEvent(this.videos[0].video, this, 'videoElementCreated')]);
                this.lazyLaunchVideoElementCreatedEvent = false;
            }
        }
        if (type === 'streamPlaying') {
            if (this.videos[0] && this.videos[0].video &&
                this.videos[0].video.currentTime > 0 &&
                this.videos[0].video.paused === false &&
                this.videos[0].video.ended === false &&
                this.videos[0].video.readyState === 4) {
                this.ee.emitEvent('streamPlaying', [new StreamManagerEvent_1.StreamManagerEvent(this, 'streamPlaying', undefined)]);
            }
        }
        if (this.stream.hasAudio) {
            if (type === 'publisherStartSpeaking') {
                this.stream.enableHarkSpeakingEvent();
            }
            if (type === 'publisherStopSpeaking') {
                this.stream.enableHarkStoppedSpeakingEvent();
            }
            if (type === 'streamAudioVolumeChange') {
                this.stream.enableHarkVolumeChangeEvent(false);
            }
        }
        return this;
    };
    StreamManager.prototype.once = function (type, handler) {
        _super.prototype.onceAux.call(this, type, "Event '" + type + "' triggered once by '" + (this.remote ? 'Subscriber' : 'Publisher') + "'", handler);
        if (type === 'videoElementCreated') {
            if (!!this.stream && this.lazyLaunchVideoElementCreatedEvent) {
                this.ee.emitEvent('videoElementCreated', [new VideoElementEvent_1.VideoElementEvent(this.videos[0].video, this, 'videoElementCreated')]);
            }
        }
        if (type === 'streamPlaying') {
            if (this.videos[0] && this.videos[0].video &&
                this.videos[0].video.currentTime > 0 &&
                this.videos[0].video.paused === false &&
                this.videos[0].video.ended === false &&
                this.videos[0].video.readyState === 4) {
                this.ee.emitEvent('streamPlaying', [new StreamManagerEvent_1.StreamManagerEvent(this, 'streamPlaying', undefined)]);
            }
        }
        if (this.stream.hasAudio) {
            if (type === 'publisherStartSpeaking') {
                this.stream.enableOnceHarkSpeakingEvent();
            }
            if (type === 'publisherStopSpeaking') {
                this.stream.enableOnceHarkStoppedSpeakingEvent();
            }
            if (type === 'streamAudioVolumeChange') {
                this.stream.enableOnceHarkVolumeChangeEvent(false);
            }
        }
        return this;
    };
    StreamManager.prototype.off = function (type, handler) {
        _super.prototype.offAux.call(this, type, handler);
        if (type === 'publisherStartSpeaking') {
            var remainingStartSpeakingEventListeners = this.ee.getListeners(type).length + this.stream.session.ee.getListeners(type).length;
            if (remainingStartSpeakingEventListeners === 0) {
                this.stream.disableHarkSpeakingEvent(false);
            }
        }
        if (type === 'publisherStopSpeaking') {
            var remainingStopSpeakingEventListeners = this.ee.getListeners(type).length + this.stream.session.ee.getListeners(type).length;
            if (remainingStopSpeakingEventListeners === 0) {
                this.stream.disableHarkStoppedSpeakingEvent(false);
            }
        }
        if (type === 'streamAudioVolumeChange') {
            var remainingVolumeEventListeners = this.ee.getListeners(type).length;
            if (remainingVolumeEventListeners === 0) {
                this.stream.disableHarkVolumeChangeEvent(false);
            }
        }
        return this;
    };
    StreamManager.prototype.addVideoElement = function (video) {
        this.initializeVideoProperties(video);
        if (!this.remote && this.stream.displayMyRemote()) {
            if (video.srcObject !== this.stream.getMediaStream()) {
                video.srcObject = this.stream.getMediaStream();
            }
        }
        for (var _i = 0, _a = this.videos; _i < _a.length; _i++) {
            var v = _a[_i];
            if (v.video === video) {
                return 0;
            }
        }
        var returnNumber = 1;
        for (var _b = 0, _c = this.stream.session.streamManagers; _b < _c.length; _b++) {
            var streamManager = _c[_b];
            if (streamManager.disassociateVideo(video)) {
                returnNumber = -1;
                break;
            }
        }
        this.stream.session.streamManagers.forEach(function (streamManager) {
            streamManager.disassociateVideo(video);
        });
        this.pushNewStreamManagerVideo({
            video: video,
            id: video.id,
            canplayListenerAdded: false
        });
        logger.info('New video element associated to ', this);
        return returnNumber;
    };
    StreamManager.prototype.createVideoElement = function (targetElement, insertMode) {
        var targEl;
        if (typeof targetElement === 'string') {
            targEl = document.getElementById(targetElement);
            if (!targEl) {
                throw new Error("The provided 'targetElement' couldn't be resolved to any HTML element: " + targetElement);
            }
        }
        else if (targetElement instanceof HTMLElement) {
            targEl = targetElement;
        }
        else {
            throw new Error("The provided 'targetElement' couldn't be resolved to any HTML element: " + targetElement);
        }
        var video = this.createVideo();
        this.initializeVideoProperties(video);
        var insMode = !!insertMode ? insertMode : VideoInsertMode_1.VideoInsertMode.APPEND;
        switch (insMode) {
            case VideoInsertMode_1.VideoInsertMode.AFTER:
                targEl.parentNode.insertBefore(video, targEl.nextSibling);
                break;
            case VideoInsertMode_1.VideoInsertMode.APPEND:
                targEl.appendChild(video);
                break;
            case VideoInsertMode_1.VideoInsertMode.BEFORE:
                targEl.parentNode.insertBefore(video, targEl);
                break;
            case VideoInsertMode_1.VideoInsertMode.PREPEND:
                targEl.insertBefore(video, targEl.childNodes[0]);
                break;
            case VideoInsertMode_1.VideoInsertMode.REPLACE:
                targEl.parentNode.replaceChild(video, targEl);
                break;
            default:
                insMode = VideoInsertMode_1.VideoInsertMode.APPEND;
                targEl.appendChild(video);
                break;
        }
        var v = {
            targetElement: targEl,
            video: video,
            insertMode: insMode,
            id: video.id,
            canplayListenerAdded: false
        };
        this.pushNewStreamManagerVideo(v);
        this.ee.emitEvent('videoElementCreated', [new VideoElementEvent_1.VideoElementEvent(v.video, this, 'videoElementCreated')]);
        this.lazyLaunchVideoElementCreatedEvent = !!this.firstVideoElement;
        return video;
    };
    StreamManager.prototype.updatePublisherSpeakingEventsOptions = function (publisherSpeakingEventsOptions) {
        var currentHarkOptions = !!this.stream.harkOptions ? this.stream.harkOptions : (this.stream.session.openvidu.advancedConfiguration.publisherSpeakingEventsOptions || {});
        var newInterval = (typeof publisherSpeakingEventsOptions.interval === 'number') ?
            publisherSpeakingEventsOptions.interval : ((typeof currentHarkOptions.interval === 'number') ? currentHarkOptions.interval : 100);
        var newThreshold = (typeof publisherSpeakingEventsOptions.threshold === 'number') ?
            publisherSpeakingEventsOptions.threshold : ((typeof currentHarkOptions.threshold === 'number') ? currentHarkOptions.threshold : -50);
        this.stream.harkOptions = {
            interval: newInterval,
            threshold: newThreshold
        };
        if (!!this.stream.speechEvent) {
            this.stream.speechEvent.setInterval(newInterval);
            this.stream.speechEvent.setThreshold(newThreshold);
        }
    };
    StreamManager.prototype.initializeVideoProperties = function (video) {
        if (!(!this.remote && this.stream.displayMyRemote())) {
            if (video.srcObject !== this.stream.getMediaStream()) {
                video.srcObject = this.stream.getMediaStream();
            }
        }
        video.autoplay = true;
        video.controls = false;
        if (platform.isSafariBrowser() || (platform.isIPhoneOrIPad() && (platform.isChromeMobileBrowser() || platform.isEdgeMobileBrowser() || platform.isOperaMobileBrowser() || platform.isFirefoxMobileBrowser()))) {
            video.setAttribute('playsinline', 'true');
        }
        if (!video.id) {
            video.id = (this.remote ? 'remote-' : 'local-') + 'video-' + this.stream.streamId;
            if (!this.id && !!this.targetElement) {
                this.id = video.id;
            }
        }
        if (!this.remote && !this.stream.displayMyRemote()) {
            video.muted = true;
            if (video.style.transform === 'rotateY(180deg)' && !this.stream.outboundStreamOpts.publisherProperties.mirror) {
                this.removeMirrorVideo(video);
            }
            else if (this.stream.outboundStreamOpts.publisherProperties.mirror && !this.stream.isSendScreen()) {
                this.mirrorVideo(video);
            }
        }
    };
    StreamManager.prototype.removeAllVideos = function () {
        var _this = this;
        for (var i = this.stream.session.streamManagers.length - 1; i >= 0; --i) {
            if (this.stream.session.streamManagers[i] === this) {
                this.stream.session.streamManagers.splice(i, 1);
            }
        }
        this.videos.forEach(function (streamManagerVideo) {
            if (!!streamManagerVideo.video && !!streamManagerVideo.video.removeEventListener) {
                streamManagerVideo.video.removeEventListener('canplay', _this.canPlayListener);
            }
            streamManagerVideo.canplayListenerAdded = false;
            if (!!streamManagerVideo.targetElement) {
                streamManagerVideo.video.parentNode.removeChild(streamManagerVideo.video);
                _this.ee.emitEvent('videoElementDestroyed', [new VideoElementEvent_1.VideoElementEvent(streamManagerVideo.video, _this, 'videoElementDestroyed')]);
            }
            _this.removeSrcObject(streamManagerVideo);
            _this.videos.filter(function (v) { return !v.targetElement; });
        });
    };
    StreamManager.prototype.disassociateVideo = function (video) {
        var disassociated = false;
        for (var i = 0; i < this.videos.length; i++) {
            if (this.videos[i].video === video) {
                this.videos[i].video.removeEventListener('canplay', this.canPlayListener);
                this.videos.splice(i, 1);
                disassociated = true;
                logger.info('Video element disassociated from ', this);
                break;
            }
        }
        return disassociated;
    };
    StreamManager.prototype.addPlayEventToFirstVideo = function () {
        if ((!!this.videos[0]) && (!!this.videos[0].video) && (!this.videos[0].canplayListenerAdded)) {
            this.activateStreamPlayingEventExceptionTimeout();
            this.videos[0].video.addEventListener('canplay', this.canPlayListener);
            this.videos[0].canplayListenerAdded = true;
        }
    };
    StreamManager.prototype.updateMediaStream = function (mediaStream) {
        this.videos.forEach(function (streamManagerVideo) {
            streamManagerVideo.video.srcObject = mediaStream;
            if (platform.isIonicIos()) {
                var vParent = streamManagerVideo.video.parentElement;
                var newVideo = streamManagerVideo.video;
                vParent.replaceChild(newVideo, streamManagerVideo.video);
                streamManagerVideo.video = newVideo;
            }
        });
    };
    StreamManager.prototype.emitEvent = function (type, eventArray) {
        this.ee.emitEvent(type, eventArray);
    };
    StreamManager.prototype.createVideo = function () {
        return document.createElement('video');
    };
    StreamManager.prototype.removeSrcObject = function (streamManagerVideo) {
        streamManagerVideo.video.srcObject = null;
        this.deactivateStreamPlayingEventExceptionTimeout();
    };
    StreamManager.prototype.pushNewStreamManagerVideo = function (streamManagerVideo) {
        this.videos.push(streamManagerVideo);
        this.addPlayEventToFirstVideo();
        if (this.stream.session.streamManagers.indexOf(this) === -1) {
            this.stream.session.streamManagers.push(this);
        }
    };
    StreamManager.prototype.mirrorVideo = function (video) {
        if (!platform.isIonicIos()) {
            video.style.transform = 'rotateY(180deg)';
            video.style.webkitTransform = 'rotateY(180deg)';
        }
    };
    StreamManager.prototype.removeMirrorVideo = function (video) {
        video.style.transform = 'unset';
        video.style.webkitTransform = 'unset';
    };
    StreamManager.prototype.activateStreamPlayingEventExceptionTimeout = function () {
        var _this = this;
        if (!this.remote) {
            return;
        }
        if (this.streamPlayingEventExceptionTimeout != null) {
            return;
        }
        var msTimeout = this.stream.session.openvidu.advancedConfiguration.noStreamPlayingEventExceptionTimeout || 4000;
        this.streamPlayingEventExceptionTimeout = setTimeout(function () {
            var msg = 'StreamManager of Stream ' + _this.stream.streamId + ' (' + (_this.remote ? 'Subscriber' : 'Publisher') + ') did not trigger "streamPlaying" event in ' + msTimeout + ' ms';
            logger.warn(msg);
            _this.stream.session.emitEvent('exception', [new ExceptionEvent_1.ExceptionEvent(_this.stream.session, ExceptionEvent_1.ExceptionEventName.NO_STREAM_PLAYING_EVENT, _this, msg)]);
            delete _this.streamPlayingEventExceptionTimeout;
        }, msTimeout);
    };
    StreamManager.prototype.deactivateStreamPlayingEventExceptionTimeout = function () {
        clearTimeout(this.streamPlayingEventExceptionTimeout);
        delete this.streamPlayingEventExceptionTimeout;
    };
    return StreamManager;
}(EventDispatcher_1.EventDispatcher));
exports.StreamManager = StreamManager;

},{"../OpenViduInternal/Enums/VideoInsertMode":54,"../OpenViduInternal/Events/ExceptionEvent":58,"../OpenViduInternal/Events/StreamManagerEvent":66,"../OpenViduInternal/Events/VideoElementEvent":68,"../OpenViduInternal/Logger/OpenViduLogger":79,"../OpenViduInternal/Utils/Platform":83,"./EventDispatcher":42}],50:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
var StreamManager_1 = require("./StreamManager");
var OpenViduLogger_1 = require("../OpenViduInternal/Logger/OpenViduLogger");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    function Subscriber(stream, targEl, properties) {
        var _this = _super.call(this, stream, targEl) || this;
        _this.element = _this.targetElement;
        _this.stream = stream;
        _this.properties = properties;
        return _this;
    }
    Subscriber.prototype.subscribeToAudio = function (value) {
        this.stream.getMediaStream().getAudioTracks().forEach(function (track) {
            track.enabled = value;
        });
        this.stream.audioActive = value;
        logger.info("'Subscriber' has " + (value ? 'subscribed to' : 'unsubscribed from') + ' its audio stream');
        return this;
    };
    Subscriber.prototype.subscribeToVideo = function (value) {
        this.stream.getMediaStream().getVideoTracks().forEach(function (track) {
            track.enabled = value;
        });
        this.stream.videoActive = value;
        logger.info("'Subscriber' has " + (value ? 'subscribed to' : 'unsubscribed from') + ' its video stream');
        return this;
    };
    return Subscriber;
}(StreamManager_1.StreamManager));
exports.Subscriber = Subscriber;

},{"../OpenViduInternal/Logger/OpenViduLogger":79,"./StreamManager":49}],51:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalRecorderState = void 0;
var LocalRecorderState;
(function (LocalRecorderState) {
    LocalRecorderState["READY"] = "READY";
    LocalRecorderState["RECORDING"] = "RECORDING";
    LocalRecorderState["PAUSED"] = "PAUSED";
    LocalRecorderState["FINISHED"] = "FINISHED";
})(LocalRecorderState = exports.LocalRecorderState || (exports.LocalRecorderState = {}));

},{}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenViduError = exports.OpenViduErrorName = void 0;
var OpenViduErrorName;
(function (OpenViduErrorName) {
    OpenViduErrorName["BROWSER_NOT_SUPPORTED"] = "BROWSER_NOT_SUPPORTED";
    OpenViduErrorName["DEVICE_ACCESS_DENIED"] = "DEVICE_ACCESS_DENIED";
    OpenViduErrorName["DEVICE_ALREADY_IN_USE"] = "DEVICE_ALREADY_IN_USE";
    OpenViduErrorName["SCREEN_CAPTURE_DENIED"] = "SCREEN_CAPTURE_DENIED";
    OpenViduErrorName["SCREEN_SHARING_NOT_SUPPORTED"] = "SCREEN_SHARING_NOT_SUPPORTED";
    OpenViduErrorName["SCREEN_EXTENSION_NOT_INSTALLED"] = "SCREEN_EXTENSION_NOT_INSTALLED";
    OpenViduErrorName["SCREEN_EXTENSION_DISABLED"] = "SCREEN_EXTENSION_DISABLED";
    OpenViduErrorName["INPUT_VIDEO_DEVICE_NOT_FOUND"] = "INPUT_VIDEO_DEVICE_NOT_FOUND";
    OpenViduErrorName["INPUT_AUDIO_DEVICE_NOT_FOUND"] = "INPUT_AUDIO_DEVICE_NOT_FOUND";
    OpenViduErrorName["INPUT_AUDIO_DEVICE_GENERIC_ERROR"] = "INPUT_AUDIO_DEVICE_GENERIC_ERROR";
    OpenViduErrorName["NO_INPUT_SOURCE_SET"] = "NO_INPUT_SOURCE_SET";
    OpenViduErrorName["PUBLISHER_PROPERTIES_ERROR"] = "PUBLISHER_PROPERTIES_ERROR";
    OpenViduErrorName["OPENVIDU_PERMISSION_DENIED"] = "OPENVIDU_PERMISSION_DENIED";
    OpenViduErrorName["OPENVIDU_NOT_CONNECTED"] = "OPENVIDU_NOT_CONNECTED";
    OpenViduErrorName["GENERIC_ERROR"] = "GENERIC_ERROR";
})(OpenViduErrorName = exports.OpenViduErrorName || (exports.OpenViduErrorName = {}));
var OpenViduError = (function () {
    function OpenViduError(name, message) {
        this.name = name;
        this.message = message;
    }
    return OpenViduError;
}());
exports.OpenViduError = OpenViduError;

},{}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOfVideo = void 0;
var TypeOfVideo;
(function (TypeOfVideo) {
    TypeOfVideo["CAMERA"] = "CAMERA";
    TypeOfVideo["SCREEN"] = "SCREEN";
    TypeOfVideo["CUSTOM"] = "CUSTOM";
    TypeOfVideo["IPCAM"] = "IPCAM";
})(TypeOfVideo = exports.TypeOfVideo || (exports.TypeOfVideo = {}));

},{}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoInsertMode = void 0;
var VideoInsertMode;
(function (VideoInsertMode) {
    VideoInsertMode["AFTER"] = "AFTER";
    VideoInsertMode["APPEND"] = "APPEND";
    VideoInsertMode["BEFORE"] = "BEFORE";
    VideoInsertMode["PREPEND"] = "PREPEND";
    VideoInsertMode["REPLACE"] = "REPLACE";
})(VideoInsertMode = exports.VideoInsertMode || (exports.VideoInsertMode = {}));

},{}],55:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionEvent = void 0;
var Event_1 = require("./Event");
var ConnectionEvent = (function (_super) {
    __extends(ConnectionEvent, _super);
    function ConnectionEvent(cancelable, target, type, connection, reason) {
        var _this = _super.call(this, cancelable, target, type) || this;
        _this.connection = connection;
        _this.reason = reason;
        return _this;
    }
    ConnectionEvent.prototype.callDefaultBehavior = function () { };
    return ConnectionEvent;
}(Event_1.Event));
exports.ConnectionEvent = ConnectionEvent;

},{"./Event":57}],56:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionPropertyChangedEvent = void 0;
var Event_1 = require("./Event");
var ConnectionPropertyChangedEvent = (function (_super) {
    __extends(ConnectionPropertyChangedEvent, _super);
    function ConnectionPropertyChangedEvent(target, connection, changedProperty, newValue, oldValue) {
        var _this = _super.call(this, false, target, 'connectionPropertyChanged') || this;
        _this.connection = connection;
        _this.changedProperty = changedProperty;
        _this.newValue = newValue;
        _this.oldValue = oldValue;
        return _this;
    }
    ConnectionPropertyChangedEvent.prototype.callDefaultBehavior = function () { };
    return ConnectionPropertyChangedEvent;
}(Event_1.Event));
exports.ConnectionPropertyChangedEvent = ConnectionPropertyChangedEvent;

},{"./Event":57}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
var Event = (function () {
    function Event(cancelable, target, type) {
        this.hasBeenPrevented = false;
        this.cancelable = cancelable;
        this.target = target;
        this.type = type;
    }
    Event.prototype.isDefaultPrevented = function () {
        return this.hasBeenPrevented;
    };
    Event.prototype.preventDefault = function () {
        this.callDefaultBehavior = function () { };
        this.hasBeenPrevented = true;
    };
    return Event;
}());
exports.Event = Event;

},{}],58:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionEvent = exports.ExceptionEventName = void 0;
var Event_1 = require("./Event");
var ExceptionEventName;
(function (ExceptionEventName) {
    ExceptionEventName["ICE_CANDIDATE_ERROR"] = "ICE_CANDIDATE_ERROR";
    ExceptionEventName["ICE_CONNECTION_FAILED"] = "ICE_CONNECTION_FAILED";
    ExceptionEventName["ICE_CONNECTION_DISCONNECTED"] = "ICE_CONNECTION_DISCONNECTED";
    ExceptionEventName["NO_STREAM_PLAYING_EVENT"] = "NO_STREAM_PLAYING_EVENT";
})(ExceptionEventName = exports.ExceptionEventName || (exports.ExceptionEventName = {}));
var ExceptionEvent = (function (_super) {
    __extends(ExceptionEvent, _super);
    function ExceptionEvent(session, name, origin, message, data) {
        var _this = _super.call(this, false, session, 'exception') || this;
        _this.name = name;
        _this.origin = origin;
        _this.message = message;
        _this.data = data;
        return _this;
    }
    ExceptionEvent.prototype.callDefaultBehavior = function () { };
    return ExceptionEvent;
}(Event_1.Event));
exports.ExceptionEvent = ExceptionEvent;

},{"./Event":57}],59:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterEvent = void 0;
var Event_1 = require("./Event");
var FilterEvent = (function (_super) {
    __extends(FilterEvent, _super);
    function FilterEvent(target, eventType, data) {
        var _this = _super.call(this, false, target, eventType) || this;
        _this.data = data;
        return _this;
    }
    FilterEvent.prototype.callDefaultBehavior = function () { };
    return FilterEvent;
}(Event_1.Event));
exports.FilterEvent = FilterEvent;

},{"./Event":57}],60:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkQualityLevelChangedEvent = void 0;
var Event_1 = require("./Event");
var NetworkQualityLevelChangedEvent = (function (_super) {
    __extends(NetworkQualityLevelChangedEvent, _super);
    function NetworkQualityLevelChangedEvent(target, newValue, oldValue, connection) {
        var _this = _super.call(this, false, target, 'networkQualityLevelChanged') || this;
        _this.newValue = newValue;
        _this.oldValue = oldValue;
        _this.connection = connection;
        return _this;
    }
    NetworkQualityLevelChangedEvent.prototype.callDefaultBehavior = function () { };
    return NetworkQualityLevelChangedEvent;
}(Event_1.Event));
exports.NetworkQualityLevelChangedEvent = NetworkQualityLevelChangedEvent;

},{"./Event":57}],61:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherSpeakingEvent = void 0;
var Event_1 = require("./Event");
var PublisherSpeakingEvent = (function (_super) {
    __extends(PublisherSpeakingEvent, _super);
    function PublisherSpeakingEvent(target, type, connection, streamId) {
        var _this = _super.call(this, false, target, type) || this;
        _this.type = type;
        _this.connection = connection;
        _this.streamId = streamId;
        return _this;
    }
    PublisherSpeakingEvent.prototype.callDefaultBehavior = function () { };
    return PublisherSpeakingEvent;
}(Event_1.Event));
exports.PublisherSpeakingEvent = PublisherSpeakingEvent;

},{"./Event":57}],62:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingEvent = void 0;
var Event_1 = require("./Event");
var RecordingEvent = (function (_super) {
    __extends(RecordingEvent, _super);
    function RecordingEvent(target, type, id, name, reason) {
        var _this = _super.call(this, false, target, type) || this;
        _this.id = id;
        if (name !== id) {
            _this.name = name;
        }
        _this.reason = reason;
        return _this;
    }
    RecordingEvent.prototype.callDefaultBehavior = function () { };
    return RecordingEvent;
}(Event_1.Event));
exports.RecordingEvent = RecordingEvent;

},{"./Event":57}],63:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionDisconnectedEvent = void 0;
var Event_1 = require("./Event");
var OpenViduLogger_1 = require("../Logger/OpenViduLogger");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var SessionDisconnectedEvent = (function (_super) {
    __extends(SessionDisconnectedEvent, _super);
    function SessionDisconnectedEvent(target, reason) {
        var _this = _super.call(this, true, target, 'sessionDisconnected') || this;
        _this.reason = reason;
        return _this;
    }
    SessionDisconnectedEvent.prototype.callDefaultBehavior = function () {
        logger.info("Calling default behavior upon '" + this.type + "' event dispatched by 'Session'");
        var session = this.target;
        session.remoteConnections.forEach(function (remoteConnection) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            var connectionId = remoteConnection.connectionId;
            if (!!((_a = session.remoteConnections.get(connectionId)) === null || _a === void 0 ? void 0 : _a.stream)) {
                (_b = session.remoteConnections.get(connectionId)) === null || _b === void 0 ? void 0 : _b.stream.disposeWebRtcPeer();
                (_c = session.remoteConnections.get(connectionId)) === null || _c === void 0 ? void 0 : _c.stream.disposeMediaStream();
                if ((_d = session.remoteConnections.get(connectionId)) === null || _d === void 0 ? void 0 : _d.stream.streamManager) {
                    (_e = session.remoteConnections.get(connectionId)) === null || _e === void 0 ? void 0 : _e.stream.streamManager.removeAllVideos();
                }
                var streamId = (_g = (_f = session.remoteConnections.get(connectionId)) === null || _f === void 0 ? void 0 : _f.stream) === null || _g === void 0 ? void 0 : _g.streamId;
                if (!!streamId) {
                    session.remoteStreamsCreated.delete(streamId);
                }
                (_h = session.remoteConnections.get(connectionId)) === null || _h === void 0 ? void 0 : _h.dispose();
            }
            session.remoteConnections.delete(connectionId);
        });
    };
    return SessionDisconnectedEvent;
}(Event_1.Event));
exports.SessionDisconnectedEvent = SessionDisconnectedEvent;

},{"../Logger/OpenViduLogger":79,"./Event":57}],64:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalEvent = void 0;
var Event_1 = require("./Event");
var SignalEvent = (function (_super) {
    __extends(SignalEvent, _super);
    function SignalEvent(target, type, data, from) {
        var _this = _super.call(this, false, target, 'signal') || this;
        if (!!type) {
            _this.type = 'signal:' + type;
        }
        _this.data = data;
        _this.from = from;
        return _this;
    }
    SignalEvent.prototype.callDefaultBehavior = function () { };
    return SignalEvent;
}(Event_1.Event));
exports.SignalEvent = SignalEvent;

},{"./Event":57}],65:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamEvent = void 0;
var Event_1 = require("./Event");
var Publisher_1 = require("../../OpenVidu/Publisher");
var Session_1 = require("../../OpenVidu/Session");
var OpenViduLogger_1 = require("../Logger/OpenViduLogger");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var StreamEvent = (function (_super) {
    __extends(StreamEvent, _super);
    function StreamEvent(cancelable, target, type, stream, reason) {
        var _this = _super.call(this, cancelable, target, type) || this;
        _this.stream = stream;
        _this.reason = reason;
        return _this;
    }
    StreamEvent.prototype.callDefaultBehavior = function () {
        if (this.type === 'streamDestroyed') {
            if (this.target instanceof Session_1.Session) {
                logger.info("Calling default behavior upon '" + this.type + "' event dispatched by 'Session'");
                this.stream.disposeWebRtcPeer();
            }
            else if (this.target instanceof Publisher_1.Publisher) {
                logger.info("Calling default behavior upon '" + this.type + "' event dispatched by 'Publisher'");
                clearInterval(this.target.screenShareResizeInterval);
                this.stream.isLocalStreamReadyToPublish = false;
                var openviduPublishers = this.target.openvidu.publishers;
                for (var i = 0; i < openviduPublishers.length; i++) {
                    if (openviduPublishers[i] === this.target) {
                        openviduPublishers.splice(i, 1);
                        break;
                    }
                }
            }
            this.stream.disposeMediaStream();
            if (this.stream.streamManager)
                this.stream.streamManager.removeAllVideos();
            this.stream.session.remoteStreamsCreated.delete(this.stream.streamId);
            var remoteConnection = this.stream.session.remoteConnections.get(this.stream.connection.connectionId);
            if (!!remoteConnection && !!remoteConnection.remoteOptions) {
                var streamOptionsServer = remoteConnection.remoteOptions.streams;
                for (var i = streamOptionsServer.length - 1; i >= 0; --i) {
                    if (streamOptionsServer[i].id === this.stream.streamId) {
                        streamOptionsServer.splice(i, 1);
                    }
                }
            }
        }
    };
    return StreamEvent;
}(Event_1.Event));
exports.StreamEvent = StreamEvent;

},{"../../OpenVidu/Publisher":46,"../../OpenVidu/Session":47,"../Logger/OpenViduLogger":79,"./Event":57}],66:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamManagerEvent = void 0;
var Event_1 = require("./Event");
var StreamManagerEvent = (function (_super) {
    __extends(StreamManagerEvent, _super);
    function StreamManagerEvent(target, type, value) {
        var _this = _super.call(this, false, target, type) || this;
        _this.value = value;
        return _this;
    }
    StreamManagerEvent.prototype.callDefaultBehavior = function () { };
    return StreamManagerEvent;
}(Event_1.Event));
exports.StreamManagerEvent = StreamManagerEvent;

},{"./Event":57}],67:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamPropertyChangedEvent = void 0;
var Event_1 = require("./Event");
var StreamPropertyChangedEvent = (function (_super) {
    __extends(StreamPropertyChangedEvent, _super);
    function StreamPropertyChangedEvent(target, stream, changedProperty, newValue, oldValue, reason) {
        var _this = _super.call(this, false, target, 'streamPropertyChanged') || this;
        _this.stream = stream;
        _this.changedProperty = changedProperty;
        _this.newValue = newValue;
        _this.oldValue = oldValue;
        _this.reason = reason;
        return _this;
    }
    StreamPropertyChangedEvent.prototype.callDefaultBehavior = function () { };
    return StreamPropertyChangedEvent;
}(Event_1.Event));
exports.StreamPropertyChangedEvent = StreamPropertyChangedEvent;

},{"./Event":57}],68:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoElementEvent = void 0;
var Event_1 = require("./Event");
var VideoElementEvent = (function (_super) {
    __extends(VideoElementEvent, _super);
    function VideoElementEvent(element, target, type) {
        var _this = _super.call(this, false, target, type) || this;
        _this.element = element;
        return _this;
    }
    VideoElementEvent.prototype.callDefaultBehavior = function () { };
    return VideoElementEvent;
}(Event_1.Event));
exports.VideoElementEvent = VideoElementEvent;

},{"./Event":57}],69:[function(require,module,exports){
function Mapper() {
    var sources = {};
    this.forEach = function (callback) {
        for (var key in sources) {
            var source = sources[key];
            for (var key2 in source)
                callback(source[key2]);
        }
        ;
    };
    this.get = function (id, source) {
        var ids = sources[source];
        if (ids == undefined)
            return undefined;
        return ids[id];
    };
    this.remove = function (id, source) {
        var ids = sources[source];
        if (ids == undefined)
            return;
        delete ids[id];
        for (var i in ids) {
            return false;
        }
        delete sources[source];
    };
    this.set = function (value, id, source) {
        if (value == undefined)
            return this.remove(id, source);
        var ids = sources[source];
        if (ids == undefined)
            sources[source] = ids = {};
        ids[id] = value;
    };
}
;
Mapper.prototype.pop = function (id, source) {
    var value = this.get(id, source);
    if (value == undefined)
        return undefined;
    this.remove(id, source);
    return value;
};
module.exports = Mapper;

},{}],70:[function(require,module,exports){
var JsonRpcClient = require('./jsonrpcclient');
exports.JsonRpcClient = JsonRpcClient;

},{"./jsonrpcclient":71}],71:[function(require,module,exports){
var RpcBuilder = require('../');
var WebSocketWithReconnection = require('./transports/webSocketWithReconnection');
var OpenViduLogger = require('../../../Logger/OpenViduLogger').OpenViduLogger;
Date.now = Date.now || function () {
    return +new Date;
};
var PING_INTERVAL = 5000;
var RECONNECTING = 'RECONNECTING';
var CONNECTED = 'CONNECTED';
var DISCONNECTED = 'DISCONNECTED';
var Logger = OpenViduLogger.getInstance();
function JsonRpcClient(configuration) {
    var self = this;
    var wsConfig = configuration.ws;
    var notReconnectIfNumLessThan = -1;
    var pingNextNum = 0;
    var enabledPings = true;
    var pingPongStarted = false;
    var pingInterval;
    var status = DISCONNECTED;
    var onreconnecting = wsConfig.onreconnecting;
    var onreconnected = wsConfig.onreconnected;
    var onconnected = wsConfig.onconnected;
    var onerror = wsConfig.onerror;
    configuration.rpc.pull = function (params, request) {
        request.reply(null, "push");
    };
    wsConfig.onreconnecting = function () {
        Logger.debug("--------- ONRECONNECTING -----------");
        if (status === RECONNECTING) {
            Logger.error("Websocket already in RECONNECTING state when receiving a new ONRECONNECTING message. Ignoring it");
            return;
        }
        stopPing();
        status = RECONNECTING;
        if (onreconnecting) {
            onreconnecting();
        }
    };
    wsConfig.onreconnected = function () {
        Logger.debug("--------- ONRECONNECTED -----------");
        if (status === CONNECTED) {
            Logger.error("Websocket already in CONNECTED state when receiving a new ONRECONNECTED message. Ignoring it");
            return;
        }
        status = CONNECTED;
        updateNotReconnectIfLessThan();
        if (onreconnected) {
            onreconnected();
        }
    };
    wsConfig.onconnected = function () {
        Logger.debug("--------- ONCONNECTED -----------");
        if (status === CONNECTED) {
            Logger.error("Websocket already in CONNECTED state when receiving a new ONCONNECTED message. Ignoring it");
            return;
        }
        status = CONNECTED;
        enabledPings = true;
        usePing();
        if (onconnected) {
            onconnected();
        }
    };
    wsConfig.onerror = function (error) {
        Logger.debug("--------- ONERROR -----------");
        status = DISCONNECTED;
        stopPing();
        if (onerror) {
            onerror(error);
        }
    };
    var ws = new WebSocketWithReconnection(wsConfig);
    Logger.debug('Connecting websocket to URI: ' + wsConfig.uri);
    var rpcBuilderOptions = {
        request_timeout: configuration.rpc.requestTimeout,
        ping_request_timeout: configuration.rpc.heartbeatRequestTimeout
    };
    var rpc = new RpcBuilder(RpcBuilder.packers.JsonRPC, rpcBuilderOptions, ws, function (request) {
        Logger.debug('Received request: ' + JSON.stringify(request));
        try {
            var func = configuration.rpc[request.method];
            if (func === undefined) {
                Logger.error("Method " + request.method + " not registered in client");
            }
            else {
                func(request.params, request);
            }
        }
        catch (err) {
            Logger.error('Exception processing request: ' + JSON.stringify(request));
            Logger.error(err);
        }
    });
    this.send = function (method, params, callback) {
        var requestTime = Date.now();
        rpc.encode(method, params, function (error, result) {
            if (error) {
                try {
                    Logger.error("ERROR:" + error.message + " in Request: method:" +
                        method + " params:" + JSON.stringify(params) + " request:" +
                        error.request);
                    if (error.data) {
                        Logger.error("ERROR DATA:" + JSON.stringify(error.data));
                    }
                }
                catch (e) { }
                error.requestTime = requestTime;
            }
            if (callback) {
                if (result != undefined && result.value !== 'pong') {
                    Logger.debug('Response: ' + JSON.stringify(result));
                }
                callback(error, result);
            }
        });
    };
    function updateNotReconnectIfLessThan() {
        Logger.debug("notReconnectIfNumLessThan = " + pingNextNum + ' (old=' +
            notReconnectIfNumLessThan + ')');
        notReconnectIfNumLessThan = pingNextNum;
    }
    function sendPing() {
        if (enabledPings) {
            var params = null;
            if (pingNextNum == 0 || pingNextNum == notReconnectIfNumLessThan) {
                params = {
                    interval: configuration.heartbeat || PING_INTERVAL
                };
            }
            pingNextNum++;
            self.send('ping', params, (function (pingNum) {
                return function (error, result) {
                    if (error) {
                        Logger.debug("Error in ping request #" + pingNum + " (" +
                            error.message + ")");
                        if (pingNum > notReconnectIfNumLessThan) {
                            enabledPings = false;
                            updateNotReconnectIfLessThan();
                            Logger.debug("Server did not respond to ping message #" +
                                pingNum + ". Reconnecting... ");
                            ws.reconnectWs();
                        }
                    }
                };
            })(pingNextNum));
        }
        else {
            Logger.debug("Trying to send ping, but ping is not enabled");
        }
    }
    function usePing() {
        if (!pingPongStarted) {
            Logger.debug("Starting ping (if configured)");
            pingPongStarted = true;
            if (configuration.heartbeat != undefined) {
                pingInterval = setInterval(sendPing, configuration.heartbeat);
                sendPing();
            }
        }
    }
    function stopPing() {
        clearInterval(pingInterval);
        pingPongStarted = false;
        enabledPings = false;
        pingNextNum = -1;
        rpc.cancel();
    }
    this.close = function (code, reason) {
        Logger.debug("Closing  with code: " + code + " because: " + reason);
        if (pingInterval != undefined) {
            Logger.debug("Clearing ping interval");
            clearInterval(pingInterval);
        }
        pingPongStarted = false;
        enabledPings = false;
        ws.close(code, reason);
    };
    this.reconnect = function () {
        ws.reconnectWs();
    };
    this.resetPing = function () {
        enabledPings = true;
        pingNextNum = 0;
        usePing();
    };
    this.getReadyState = function () {
        return ws.getReadyState();
    };
}
module.exports = JsonRpcClient;

},{"../":74,"../../../Logger/OpenViduLogger":79,"./transports/webSocketWithReconnection":73}],72:[function(require,module,exports){
var WebSocketWithReconnection = require('./webSocketWithReconnection');
exports.WebSocketWithReconnection = WebSocketWithReconnection;

},{"./webSocketWithReconnection":73}],73:[function(require,module,exports){
"use strict";
var OpenViduLogger = require('../../../../Logger/OpenViduLogger').OpenViduLogger;
var Logger = OpenViduLogger.getInstance();
var MAX_RETRIES = 2000;
var RETRY_TIME_MS = 3000;
var CONNECTING = 0;
var OPEN = 1;
var CLOSING = 2;
var CLOSED = 3;
function WebSocketWithReconnection(config) {
    var closing = false;
    var registerMessageHandler;
    var wsUri = config.uri;
    var reconnecting = false;
    var ws = new WebSocket(wsUri);
    ws.onopen = function () {
        Logger.debug("WebSocket connected to " + wsUri);
        if (config.onconnected) {
            config.onconnected();
        }
    };
    ws.onerror = function (error) {
        Logger.error("Could not connect to " + wsUri + " (invoking onerror if defined)", error);
        if (config.onerror) {
            config.onerror(error);
        }
    };
    var reconnectionOnClose = function () {
        if (ws.readyState === CLOSED) {
            if (closing) {
                Logger.debug("Connection closed by user");
            }
            else {
                if (config.ismasternodecrashed()) {
                    Logger.error("Master Node has crashed. Stopping reconnection process");
                }
                else {
                    Logger.debug("Connection closed unexpectedly. Reconnecting...");
                    reconnect(MAX_RETRIES, 1);
                }
            }
        }
        else {
            Logger.debug("Close callback from previous websocket. Ignoring it");
        }
    };
    ws.onclose = reconnectionOnClose;
    function reconnect(maxRetries, numRetries) {
        Logger.debug("reconnect (attempt #" + numRetries + ", max=" + maxRetries + ")");
        if (numRetries === 1) {
            if (reconnecting) {
                Logger.warn("Trying to reconnect when already reconnecting... Ignoring this reconnection.");
                return;
            }
            else {
                reconnecting = true;
            }
            if (config.onreconnecting) {
                config.onreconnecting();
            }
        }
        reconnectAux(maxRetries, numRetries);
    }
    function addReconnectionQueryParamsIfMissing(uriString) {
        var searchParams = new URLSearchParams((new URL(uriString)).search);
        if (!searchParams.has("reconnect")) {
            uriString = (Array.from(searchParams).length > 0) ? (uriString + '&reconnect=true') : (uriString + '?reconnect=true');
        }
        return uriString;
    }
    function reconnectAux(maxRetries, numRetries) {
        Logger.debug("Reconnection attempt #" + numRetries);
        ws.close(4104, 'Connection closed for reconnection');
        wsUri = addReconnectionQueryParamsIfMissing(wsUri);
        ws = new WebSocket(wsUri);
        ws.onopen = function () {
            Logger.debug("Reconnected to " + wsUri + " after " + numRetries + " attempts...");
            reconnecting = false;
            registerMessageHandler();
            if (config.onreconnected()) {
                config.onreconnected();
            }
            ws.onclose = reconnectionOnClose;
        };
        ws.onerror = function (error) {
            Logger.warn("Reconnection error: ", error);
            if (numRetries === maxRetries) {
                if (config.ondisconnect) {
                    config.ondisconnect();
                }
            }
            else {
                setTimeout(function () {
                    reconnect(maxRetries, numRetries + 1);
                }, RETRY_TIME_MS);
            }
        };
    }
    this.close = function (code, reason) {
        closing = true;
        ws.close(code, reason);
    };
    this.reconnectWs = function () {
        Logger.debug("reconnectWs");
        reconnect(MAX_RETRIES, 1);
    };
    this.send = function (message) {
        ws.send(message);
    };
    this.addEventListener = function (type, callback) {
        registerMessageHandler = function () {
            ws.addEventListener(type, callback);
        };
        registerMessageHandler();
    };
    this.getReadyState = function () {
        return ws.readyState;
    };
}
module.exports = WebSocketWithReconnection;

},{"../../../../Logger/OpenViduLogger":79}],74:[function(require,module,exports){
var defineProperty_IE8 = false;
if (Object.defineProperty) {
    try {
        Object.defineProperty({}, "x", {});
    }
    catch (e) {
        defineProperty_IE8 = true;
    }
}
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
        var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () { }, fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis ?
                this :
                oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
        return fBound;
    };
}
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var packers = require('./packers');
var Mapper = require('./Mapper');
var BASE_TIMEOUT = 5000;
function unifyResponseMethods(responseMethods) {
    if (!responseMethods)
        return {};
    for (var key in responseMethods) {
        var value = responseMethods[key];
        if (typeof value == 'string')
            responseMethods[key] = {
                response: value
            };
    }
    ;
    return responseMethods;
}
;
function unifyTransport(transport) {
    if (!transport)
        return;
    if (transport instanceof Function)
        return {
            send: transport
        };
    if (transport.send instanceof Function)
        return transport;
    if (transport.postMessage instanceof Function) {
        transport.send = transport.postMessage;
        return transport;
    }
    if (transport.write instanceof Function) {
        transport.send = transport.write;
        return transport;
    }
    if (transport.onmessage !== undefined)
        return;
    if (transport.pause instanceof Function)
        return;
    throw new SyntaxError("Transport is not a function nor a valid object");
}
;
function RpcNotification(method, params) {
    if (defineProperty_IE8) {
        this.method = method;
        this.params = params;
    }
    else {
        Object.defineProperty(this, 'method', {
            value: method,
            enumerable: true
        });
        Object.defineProperty(this, 'params', {
            value: params,
            enumerable: true
        });
    }
}
;
function RpcBuilder(packer, options, transport, onRequest) {
    var self = this;
    if (!packer)
        throw new SyntaxError('Packer is not defined');
    if (!packer.pack || !packer.unpack)
        throw new SyntaxError('Packer is invalid');
    var responseMethods = unifyResponseMethods(packer.responseMethods);
    if (options instanceof Function) {
        if (transport != undefined)
            throw new SyntaxError("There can't be parameters after onRequest");
        onRequest = options;
        transport = undefined;
        options = undefined;
    }
    ;
    if (options && options.send instanceof Function) {
        if (transport && !(transport instanceof Function))
            throw new SyntaxError("Only a function can be after transport");
        onRequest = transport;
        transport = options;
        options = undefined;
    }
    ;
    if (transport instanceof Function) {
        if (onRequest != undefined)
            throw new SyntaxError("There can't be parameters after onRequest");
        onRequest = transport;
        transport = undefined;
    }
    ;
    if (transport && transport.send instanceof Function)
        if (onRequest && !(onRequest instanceof Function))
            throw new SyntaxError("Only a function can be after transport");
    options = options || {};
    EventEmitter.call(this);
    if (onRequest)
        this.on('request', onRequest);
    if (defineProperty_IE8)
        this.peerID = options.peerID;
    else
        Object.defineProperty(this, 'peerID', {
            value: options.peerID
        });
    var max_retries = options.max_retries || 0;
    function transportMessage(event) {
        self.decode(event.data || event);
    }
    ;
    this.getTransport = function () {
        return transport;
    };
    this.setTransport = function (value) {
        if (transport) {
            if (transport.removeEventListener)
                transport.removeEventListener('message', transportMessage);
            else if (transport.removeListener)
                transport.removeListener('data', transportMessage);
        }
        ;
        if (value) {
            if (value.addEventListener)
                value.addEventListener('message', transportMessage);
            else if (value.addListener)
                value.addListener('data', transportMessage);
        }
        ;
        transport = unifyTransport(value);
    };
    if (!defineProperty_IE8)
        Object.defineProperty(this, 'transport', {
            get: this.getTransport.bind(this),
            set: this.setTransport.bind(this)
        });
    this.setTransport(transport);
    var request_timeout = options.request_timeout || BASE_TIMEOUT;
    var ping_request_timeout = options.ping_request_timeout || request_timeout;
    var response_timeout = options.response_timeout || BASE_TIMEOUT;
    var duplicates_timeout = options.duplicates_timeout || BASE_TIMEOUT;
    var requestID = 0;
    var requests = new Mapper();
    var responses = new Mapper();
    var processedResponses = new Mapper();
    var message2Key = {};
    function storeResponse(message, id, dest) {
        var response = {
            message: message,
            timeout: setTimeout(function () {
                responses.remove(id, dest);
            }, response_timeout)
        };
        responses.set(response, id, dest);
    }
    ;
    function storeProcessedResponse(ack, from) {
        var timeout = setTimeout(function () {
            processedResponses.remove(ack, from);
        }, duplicates_timeout);
        processedResponses.set(timeout, ack, from);
    }
    ;
    function RpcRequest(method, params, id, from, transport) {
        RpcNotification.call(this, method, params);
        this.getTransport = function () {
            return transport;
        };
        this.setTransport = function (value) {
            transport = unifyTransport(value);
        };
        if (!defineProperty_IE8)
            Object.defineProperty(this, 'transport', {
                get: this.getTransport.bind(this),
                set: this.setTransport.bind(this)
            });
        var response = responses.get(id, from);
        if (!(transport || self.getTransport())) {
            if (defineProperty_IE8)
                this.duplicated = Boolean(response);
            else
                Object.defineProperty(this, 'duplicated', {
                    value: Boolean(response)
                });
        }
        var responseMethod = responseMethods[method];
        this.pack = packer.pack.bind(packer, this, id);
        this.reply = function (error, result, transport) {
            if (error instanceof Function || error && error.send instanceof Function) {
                if (result != undefined)
                    throw new SyntaxError("There can't be parameters after callback");
                transport = error;
                result = null;
                error = undefined;
            }
            else if (result instanceof Function ||
                result && result.send instanceof Function) {
                if (transport != undefined)
                    throw new SyntaxError("There can't be parameters after callback");
                transport = result;
                result = null;
            }
            ;
            transport = unifyTransport(transport);
            if (response)
                clearTimeout(response.timeout);
            if (from != undefined) {
                if (error)
                    error.dest = from;
                if (result)
                    result.dest = from;
            }
            ;
            var message;
            if (error || result != undefined) {
                if (self.peerID != undefined) {
                    if (error)
                        error.from = self.peerID;
                    else
                        result.from = self.peerID;
                }
                if (responseMethod) {
                    if (responseMethod.error == undefined && error)
                        message = {
                            error: error
                        };
                    else {
                        var method = error ?
                            responseMethod.error :
                            responseMethod.response;
                        message = {
                            method: method,
                            params: error || result
                        };
                    }
                }
                else
                    message = {
                        error: error,
                        result: result
                    };
                message = packer.pack(message, id);
            }
            else if (response)
                message = response.message;
            else
                message = packer.pack({
                    result: null
                }, id);
            storeResponse(message, id, from);
            transport = transport || this.getTransport() || self.getTransport();
            if (transport)
                return transport.send(message);
            return message;
        };
    }
    ;
    inherits(RpcRequest, RpcNotification);
    function cancel(message) {
        var key = message2Key[message];
        if (!key)
            return;
        delete message2Key[message];
        var request = requests.pop(key.id, key.dest);
        if (!request)
            return;
        clearTimeout(request.timeout);
        storeProcessedResponse(key.id, key.dest);
    }
    ;
    this.cancel = function (message) {
        if (message)
            return cancel(message);
        for (var message in message2Key)
            cancel(message);
    };
    this.close = function () {
        var transport = this.getTransport();
        if (transport && transport.close)
            transport.close(4003, "Cancel request");
        this.cancel();
        processedResponses.forEach(clearTimeout);
        responses.forEach(function (response) {
            clearTimeout(response.timeout);
        });
    };
    this.encode = function (method, params, dest, transport, callback) {
        if (params instanceof Function) {
            if (dest != undefined)
                throw new SyntaxError("There can't be parameters after callback");
            callback = params;
            transport = undefined;
            dest = undefined;
            params = undefined;
        }
        else if (dest instanceof Function) {
            if (transport != undefined)
                throw new SyntaxError("There can't be parameters after callback");
            callback = dest;
            transport = undefined;
            dest = undefined;
        }
        else if (transport instanceof Function) {
            if (callback != undefined)
                throw new SyntaxError("There can't be parameters after callback");
            callback = transport;
            transport = undefined;
        }
        ;
        if (self.peerID != undefined) {
            params = params || {};
            params.from = self.peerID;
        }
        ;
        if (dest != undefined) {
            params = params || {};
            params.dest = dest;
        }
        ;
        var message = {
            method: method,
            params: params
        };
        if (callback) {
            var id = requestID++;
            var retried = 0;
            message = packer.pack(message, id);
            function dispatchCallback(error, result) {
                self.cancel(message);
                callback(error, result);
            }
            ;
            var request = {
                message: message,
                callback: dispatchCallback,
                responseMethods: responseMethods[method] || {}
            };
            var encode_transport = unifyTransport(transport);
            function sendRequest(transport) {
                var rt = (method === 'ping' ? ping_request_timeout : request_timeout);
                request.timeout = setTimeout(timeout, rt * Math.pow(2, retried++));
                message2Key[message] = {
                    id: id,
                    dest: dest
                };
                requests.set(request, id, dest);
                transport = transport || encode_transport || self.getTransport();
                if (transport)
                    return transport.send(message);
                return message;
            }
            ;
            function retry(transport) {
                transport = unifyTransport(transport);
                console.warn(retried + ' retry for request message:', message);
                var timeout = processedResponses.pop(id, dest);
                clearTimeout(timeout);
                return sendRequest(transport);
            }
            ;
            function timeout() {
                if (retried < max_retries)
                    return retry(transport);
                var error = new Error('Request has timed out');
                error.request = message;
                error.retry = retry;
                dispatchCallback(error);
            }
            ;
            return sendRequest(transport);
        }
        ;
        message = packer.pack(message);
        transport = transport || this.getTransport();
        if (transport)
            return transport.send(message);
        return message;
    };
    this.decode = function (message, transport) {
        if (!message)
            throw new TypeError("Message is not defined");
        try {
            message = packer.unpack(message);
        }
        catch (e) {
            return console.debug(e, message);
        }
        ;
        var id = message.id;
        var ack = message.ack;
        var method = message.method;
        var params = message.params || {};
        var from = params.from;
        var dest = params.dest;
        if (self.peerID != undefined && from == self.peerID)
            return;
        if (id == undefined && ack == undefined) {
            var notification = new RpcNotification(method, params);
            if (self.emit('request', notification))
                return;
            return notification;
        }
        ;
        function processRequest() {
            transport = unifyTransport(transport) || self.getTransport();
            if (transport) {
                var response = responses.get(id, from);
                if (response)
                    return transport.send(response.message);
            }
            ;
            var idAck = (id != undefined) ? id : ack;
            var request = new RpcRequest(method, params, idAck, from, transport);
            if (self.emit('request', request))
                return;
            return request;
        }
        ;
        function processResponse(request, error, result) {
            request.callback(error, result);
        }
        ;
        function duplicatedResponse(timeout) {
            console.warn("Response already processed", message);
            clearTimeout(timeout);
            storeProcessedResponse(ack, from);
        }
        ;
        if (method) {
            if (dest == undefined || dest == self.peerID) {
                var request = requests.get(ack, from);
                if (request) {
                    var responseMethods = request.responseMethods;
                    if (method == responseMethods.error)
                        return processResponse(request, params);
                    if (method == responseMethods.response)
                        return processResponse(request, null, params);
                    return processRequest();
                }
                var processed = processedResponses.get(ack, from);
                if (processed)
                    return duplicatedResponse(processed);
            }
            return processRequest();
        }
        ;
        var error = message.error;
        var result = message.result;
        if (error && error.dest && error.dest != self.peerID)
            return;
        if (result && result.dest && result.dest != self.peerID)
            return;
        var request = requests.get(ack, from);
        if (!request) {
            var processed = processedResponses.get(ack, from);
            if (processed)
                return duplicatedResponse(processed);
            return console.warn("No callback was defined for this message", message);
        }
        ;
        processResponse(request, error, result);
    };
}
;
inherits(RpcBuilder, EventEmitter);
RpcBuilder.RpcNotification = RpcNotification;
module.exports = RpcBuilder;
var clients = require('./clients');
var transports = require('./clients/transports');
RpcBuilder.clients = clients;
RpcBuilder.clients.transports = transports;
RpcBuilder.packers = packers;

},{"./Mapper":69,"./clients":70,"./clients/transports":72,"./packers":77,"events":1,"inherits":6}],75:[function(require,module,exports){
function pack(message, id) {
    var result = {
        jsonrpc: "2.0"
    };
    if (message.method) {
        result.method = message.method;
        if (message.params)
            result.params = message.params;
        if (id != undefined)
            result.id = id;
    }
    else if (id != undefined) {
        if (message.error) {
            if (message.result !== undefined)
                throw new TypeError("Both result and error are defined");
            result.error = message.error;
        }
        else if (message.result !== undefined)
            result.result = message.result;
        else
            throw new TypeError("No result or error is defined");
        result.id = id;
    }
    ;
    return JSON.stringify(result);
}
;
function unpack(message) {
    var result = message;
    if (typeof message === 'string' || message instanceof String) {
        result = JSON.parse(message);
    }
    var version = result.jsonrpc;
    if (version !== '2.0')
        throw new TypeError("Invalid JsonRPC version '" + version + "': " + message);
    if (result.method == undefined) {
        if (result.id == undefined)
            throw new TypeError("Invalid message: " + message);
        var result_defined = result.result !== undefined;
        var error_defined = result.error !== undefined;
        if (result_defined && error_defined)
            throw new TypeError("Both result and error are defined: " + message);
        if (!result_defined && !error_defined)
            throw new TypeError("No result or error is defined: " + message);
        result.ack = result.id;
        delete result.id;
    }
    return result;
}
;
exports.pack = pack;
exports.unpack = unpack;

},{}],76:[function(require,module,exports){
function pack(message) {
    throw new TypeError("Not yet implemented");
}
;
function unpack(message) {
    throw new TypeError("Not yet implemented");
}
;
exports.pack = pack;
exports.unpack = unpack;

},{}],77:[function(require,module,exports){
var JsonRPC = require('./JsonRPC');
var XmlRPC = require('./XmlRPC');
exports.JsonRPC = JsonRPC;
exports.XmlRPC = XmlRPC;

},{"./JsonRPC":75,"./XmlRPC":76}],78:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
var ConsoleLogger = (function () {
    function ConsoleLogger(console) {
        this.logger = console;
        this.log = window.console.log,
            this.info = window.console.info,
            this.debug = window.console.debug,
            this.warn = window.console.warn,
            this.error = window.console.error;
    }
    return ConsoleLogger;
}());
exports.ConsoleLogger = ConsoleLogger;

},{}],79:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenViduLogger = void 0;
var jsnlog_1 = require("jsnlog");
var ConsoleLogger_1 = require("./ConsoleLogger");
var OpenViduLoggerConfiguration_1 = require("./OpenViduLoggerConfiguration");
var OpenViduLogger = (function () {
    function OpenViduLogger() {
        this.JSNLOG_URL = "/openvidu/elk/openvidu-browser-logs";
        this.MAX_JSNLOG_BATCH_LOG_MESSAGES = 100;
        this.MAX_MSECONDS_BATCH_MESSAGES = 5000;
        this.MAX_LENGTH_STRING_JSON = 1000;
        this.defaultConsoleLogger = new ConsoleLogger_1.ConsoleLogger(window.console);
        this.isProdMode = false;
        this.isJSNLogSetup = false;
    }
    OpenViduLogger.configureJSNLog = function (openVidu, token) {
        var _this = this;
        try {
            if ((window['LOG_JSNLOG_RESULTS']) ||
                (this.instance && openVidu.isPro
                    && this.instance.isOpenViduBrowserLogsDebugActive(openVidu)
                    && this.instance.canConfigureJSNLog(openVidu, this.instance))) {
                if (openVidu.sendBrowserLogs === OpenViduLoggerConfiguration_1.OpenViduLoggerConfiguration.debug_app) {
                    this.instance.replaceWindowConsole();
                }
                this.instance.isJSNLogSetup = false;
                this.instance.info("Configuring JSNLogs.");
                var finalUserId_1 = openVidu.finalUserId;
                var sessionId_1 = openVidu.session.sessionId;
                var beforeSendCallback = function (xhr) {
                    var parentReadyStateFunction = xhr.onreadystatechange;
                    xhr.onreadystatechange = function () {
                        if (_this.isInvalidResponse(xhr)) {
                            Object.defineProperty(xhr, "readyState", { value: 4 });
                            Object.defineProperty(xhr, "status", { value: 200 });
                            _this.instance.disableLogger();
                        }
                        parentReadyStateFunction();
                    };
                    xhr.setRequestHeader('Authorization', "Basic " + btoa("".concat(finalUserId_1, "%/%").concat(sessionId_1) + ":" + token));
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    xhr.setRequestHeader('OV-Final-User-Id', finalUserId_1);
                    xhr.setRequestHeader('OV-Session-Id', sessionId_1);
                    xhr.setRequestHeader('OV-Token', token);
                };
                this.instance.currentAppender = jsnlog_1.JL.createAjaxAppender("appender-".concat(finalUserId_1, "-").concat(sessionId_1));
                this.instance.currentAppender.setOptions({
                    beforeSend: beforeSendCallback,
                    maxBatchSize: 1000,
                    batchSize: this.instance.MAX_JSNLOG_BATCH_LOG_MESSAGES,
                    batchTimeout: this.instance.MAX_MSECONDS_BATCH_MESSAGES
                });
                var logSerializer = function (obj) {
                    var getCircularReplacer = function () {
                        var seen = new WeakSet();
                        return function (key, value) {
                            if (typeof value === "object" && value != null) {
                                if (seen.has(value) || (HTMLElement && value instanceof HTMLElement)) {
                                    return;
                                }
                                seen.add(value);
                            }
                            return value;
                        };
                    };
                    var stringifyJson = JSON.stringify(obj, getCircularReplacer());
                    if (stringifyJson.length > _this.instance.MAX_LENGTH_STRING_JSON) {
                        stringifyJson = "".concat(stringifyJson.substring(0, _this.instance.MAX_LENGTH_STRING_JSON), "...");
                    }
                    if (window['LOG_JSNLOG_RESULTS']) {
                        console.log(stringifyJson);
                    }
                    return stringifyJson;
                };
                jsnlog_1.JL.setOptions({
                    defaultAjaxUrl: openVidu.httpUri + this.instance.JSNLOG_URL,
                    serialize: logSerializer,
                    enabled: true
                });
                (0, jsnlog_1.JL)().setOptions({
                    appenders: [this.instance.currentAppender]
                });
                this.instance.isJSNLogSetup = true;
                this.instance.loggingSessionId = sessionId_1;
                this.instance.info("JSNLog configured.");
            }
        }
        catch (e) {
            console.error("Error configuring JSNLog: ");
            console.error(e);
            this.instance.disableLogger();
        }
    };
    OpenViduLogger.getInstance = function () {
        if (!OpenViduLogger.instance) {
            OpenViduLogger.instance = new OpenViduLogger();
        }
        return OpenViduLogger.instance;
    };
    OpenViduLogger.isInvalidResponse = function (xhr) {
        return xhr.status == 401 || xhr.status == 403 || xhr.status == 404 || xhr.status == 0;
    };
    OpenViduLogger.prototype.canConfigureJSNLog = function (openVidu, logger) {
        return openVidu.session.sessionId != logger.loggingSessionId;
    };
    OpenViduLogger.prototype.isOpenViduBrowserLogsDebugActive = function (openVidu) {
        return openVidu.sendBrowserLogs === OpenViduLoggerConfiguration_1.OpenViduLoggerConfiguration.debug ||
            openVidu.sendBrowserLogs === OpenViduLoggerConfiguration_1.OpenViduLoggerConfiguration.debug_app;
    };
    OpenViduLogger.prototype.getConsoleWithJSNLog = function () {
        return function (openViduLogger) {
            return {
                log: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    openViduLogger.defaultConsoleLogger.log.apply(openViduLogger.defaultConsoleLogger.logger, arguments);
                    if (openViduLogger.isJSNLogSetup) {
                        (0, jsnlog_1.JL)().info(arguments);
                    }
                },
                info: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    openViduLogger.defaultConsoleLogger.info.apply(openViduLogger.defaultConsoleLogger.logger, arguments);
                    if (openViduLogger.isJSNLogSetup) {
                        (0, jsnlog_1.JL)().info(arguments);
                    }
                },
                debug: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    openViduLogger.defaultConsoleLogger.debug.apply(openViduLogger.defaultConsoleLogger.logger, arguments);
                },
                warn: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    openViduLogger.defaultConsoleLogger.warn.apply(openViduLogger.defaultConsoleLogger.logger, arguments);
                    if (openViduLogger.isJSNLogSetup) {
                        (0, jsnlog_1.JL)().warn(arguments);
                    }
                },
                error: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    openViduLogger.defaultConsoleLogger.error.apply(openViduLogger.defaultConsoleLogger.logger, arguments);
                    if (openViduLogger.isJSNLogSetup) {
                        (0, jsnlog_1.JL)().error(arguments);
                    }
                }
            };
        }(this);
    };
    OpenViduLogger.prototype.replaceWindowConsole = function () {
        window.console = this.defaultConsoleLogger.logger;
        window.console.log = this.getConsoleWithJSNLog().log;
        window.console.info = this.getConsoleWithJSNLog().info;
        window.console.debug = this.getConsoleWithJSNLog().debug;
        window.console.warn = this.getConsoleWithJSNLog().warn;
        window.console.error = this.getConsoleWithJSNLog().error;
    };
    OpenViduLogger.prototype.disableLogger = function () {
        jsnlog_1.JL.setOptions({ enabled: false });
        this.isJSNLogSetup = false;
        this.loggingSessionId = undefined;
        this.currentAppender = undefined;
        window.console = this.defaultConsoleLogger.logger;
        window.console.log = this.defaultConsoleLogger.log;
        window.console.info = this.defaultConsoleLogger.info;
        window.console.debug = this.defaultConsoleLogger.debug;
        window.console.warn = this.defaultConsoleLogger.warn;
        window.console.error = this.defaultConsoleLogger.error;
    };
    OpenViduLogger.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.isProdMode) {
            this.defaultConsoleLogger.log.apply(this.defaultConsoleLogger.logger, arguments);
        }
        if (this.isJSNLogSetup) {
            (0, jsnlog_1.JL)().info(arguments);
        }
    };
    OpenViduLogger.prototype.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.isProdMode) {
            this.defaultConsoleLogger.debug.apply(this.defaultConsoleLogger.logger, arguments);
        }
    };
    OpenViduLogger.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.isProdMode) {
            this.defaultConsoleLogger.info.apply(this.defaultConsoleLogger.logger, arguments);
        }
        if (this.isJSNLogSetup) {
            (0, jsnlog_1.JL)().info(arguments);
        }
    };
    OpenViduLogger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.defaultConsoleLogger.warn.apply(this.defaultConsoleLogger.logger, arguments);
        if (this.isJSNLogSetup) {
            (0, jsnlog_1.JL)().warn(arguments);
        }
    };
    OpenViduLogger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.defaultConsoleLogger.error.apply(this.defaultConsoleLogger.logger, arguments);
        if (this.isJSNLogSetup) {
            (0, jsnlog_1.JL)().error(arguments);
        }
    };
    OpenViduLogger.prototype.flush = function () {
        if (this.isJSNLogSetup && this.currentAppender != null) {
            this.currentAppender.sendBatch();
        }
    };
    OpenViduLogger.prototype.enableProdMode = function () {
        this.isProdMode = true;
    };
    return OpenViduLogger;
}());
exports.OpenViduLogger = OpenViduLogger;

},{"./ConsoleLogger":78,"./OpenViduLoggerConfiguration":80,"jsnlog":7}],80:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenViduLoggerConfiguration = void 0;
var OpenViduLoggerConfiguration;
(function (OpenViduLoggerConfiguration) {
    OpenViduLoggerConfiguration["disabled"] = "disabled";
    OpenViduLoggerConfiguration["debug"] = "debug";
    OpenViduLoggerConfiguration["debug_app"] = "debug_app";
})(OpenViduLoggerConfiguration = exports.OpenViduLoggerConfiguration || (exports.OpenViduLoggerConfiguration = {}));

},{}],81:[function(require,module,exports){
window.getScreenId = function (firefoxString, callback, custom_parameter) {
    if (navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob)) {
        callback({
            video: true
        });
        return;
    }
    if (!!navigator.mozGetUserMedia) {
        callback(null, 'firefox', {
            video: {
                mozMediaSource: firefoxString,
                mediaSource: firefoxString
            }
        });
        return;
    }
    window.addEventListener('message', onIFrameCallback);
    function onIFrameCallback(event) {
        if (!event.data)
            return;
        if (event.data.chromeMediaSourceId) {
            if (event.data.chromeMediaSourceId === 'PermissionDeniedError') {
                callback('permission-denied');
            }
            else {
                callback(null, event.data.chromeMediaSourceId, getScreenConstraints(null, event.data.chromeMediaSourceId, event.data.canRequestAudioTrack));
            }
            window.removeEventListener('message', onIFrameCallback);
        }
        if (event.data.chromeExtensionStatus) {
            callback(event.data.chromeExtensionStatus, null, getScreenConstraints(event.data.chromeExtensionStatus));
            window.removeEventListener('message', onIFrameCallback);
        }
    }
    if (!custom_parameter) {
        setTimeout(postGetSourceIdMessage, 100);
    }
    else {
        setTimeout(function () {
            postGetSourceIdMessage(custom_parameter);
        }, 100);
    }
};
function getScreenConstraints(error, sourceId, canRequestAudioTrack) {
    var screen_constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: error ? 'screen' : 'desktop',
                maxWidth: window.screen.width > 1920 ? window.screen.width : 1920,
                maxHeight: window.screen.height > 1080 ? window.screen.height : 1080
            },
            optional: []
        }
    };
    if (!!canRequestAudioTrack) {
        screen_constraints.audio = {
            mandatory: {
                chromeMediaSource: error ? 'screen' : 'desktop',
            },
            optional: []
        };
    }
    if (sourceId) {
        screen_constraints.video.mandatory.chromeMediaSourceId = sourceId;
        if (screen_constraints.audio && screen_constraints.audio.mandatory) {
            screen_constraints.audio.mandatory.chromeMediaSourceId = sourceId;
        }
    }
    return screen_constraints;
}
function postGetSourceIdMessage(custom_parameter) {
    if (!iframe) {
        loadIFrame(function () {
            postGetSourceIdMessage(custom_parameter);
        });
        return;
    }
    if (!iframe.isLoaded) {
        setTimeout(function () {
            postGetSourceIdMessage(custom_parameter);
        }, 100);
        return;
    }
    if (!custom_parameter) {
        iframe.contentWindow.postMessage({
            captureSourceId: true
        }, '*');
    }
    else if (!!custom_parameter.forEach) {
        iframe.contentWindow.postMessage({
            captureCustomSourceId: custom_parameter
        }, '*');
    }
    else {
        iframe.contentWindow.postMessage({
            captureSourceIdWithAudio: true
        }, '*');
    }
}
var iframe;
window.getScreenConstraints = function (callback) {
    loadIFrame(function () {
        getScreenId(function (error, sourceId, screen_constraints) {
            if (!screen_constraints) {
                screen_constraints = {
                    video: true
                };
            }
            callback(error, screen_constraints.video);
        });
    });
};
function loadIFrame(loadCallback) {
    if (iframe) {
        loadCallback();
        return;
    }
    iframe = document.createElement('iframe');
    iframe.onload = function () {
        iframe.isLoaded = true;
        loadCallback();
    };
    iframe.src = 'https://openvidu.github.io/openvidu-screen-sharing-chrome-extension/';
    iframe.style.display = 'none';
    (document.body || document.documentElement).appendChild(iframe);
}
window.getChromeExtensionStatus = function (callback) {
    if (!!navigator.mozGetUserMedia) {
        callback('installed-enabled');
        return;
    }
    window.addEventListener('message', onIFrameCallback);
    function onIFrameCallback(event) {
        if (!event.data)
            return;
        if (event.data.chromeExtensionStatus) {
            callback(event.data.chromeExtensionStatus);
            window.removeEventListener('message', onIFrameCallback);
        }
    }
    setTimeout(postGetChromeExtensionStatusMessage, 100);
};
function postGetChromeExtensionStatusMessage() {
    if (!iframe) {
        loadIFrame(postGetChromeExtensionStatusMessage);
        return;
    }
    if (!iframe.isLoaded) {
        setTimeout(postGetChromeExtensionStatusMessage, 100);
        return;
    }
    iframe.contentWindow.postMessage({
        getChromeExtensionStatus: true
    }, '*');
}
exports.getScreenId = window.getScreenId;

},{}],82:[function(require,module,exports){
var chromeMediaSource = 'screen';
var sourceId;
var screenCallback;
if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.userAgent !== 'undefined') {
    var isFirefox = typeof window.InstallTrigger !== 'undefined';
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isChrome = !!window.chrome && !isOpera;
    window.addEventListener('message', function (event) {
        if (event.origin != window.location.origin) {
            return;
        }
        onMessageCallback(event.data);
    });
}
function onMessageCallback(data) {
    if (data == 'PermissionDeniedError') {
        if (screenCallback)
            return screenCallback('PermissionDeniedError');
        else
            throw new Error('PermissionDeniedError');
    }
    if (data == 'rtcmulticonnection-extension-loaded') {
        chromeMediaSource = 'desktop';
    }
    if (data.sourceId && screenCallback) {
        screenCallback(sourceId = data.sourceId, data.canRequestAudioTrack === true);
    }
}
function isChromeExtensionAvailable(callback) {
    if (!callback)
        return;
    if (chromeMediaSource == 'desktop')
        return callback(true);
    window.postMessage('are-you-there', '*');
    setTimeout(function () {
        if (chromeMediaSource == 'screen') {
            callback(false);
        }
        else
            callback(true);
    }, 2000);
}
function getSourceId(callback) {
    if (!callback)
        throw '"callback" parameter is mandatory.';
    if (sourceId)
        return callback(sourceId);
    screenCallback = callback;
    window.postMessage('get-sourceId', '*');
}
function getCustomSourceId(arr, callback) {
    if (!arr || !arr.forEach)
        throw '"arr" parameter is mandatory and it must be an array.';
    if (!callback)
        throw '"callback" parameter is mandatory.';
    if (sourceId)
        return callback(sourceId);
    screenCallback = callback;
    window.postMessage({
        'get-custom-sourceId': arr
    }, '*');
}
function getSourceIdWithAudio(callback) {
    if (!callback)
        throw '"callback" parameter is mandatory.';
    if (sourceId)
        return callback(sourceId);
    screenCallback = callback;
    window.postMessage('audio-plus-tab', '*');
}
function getChromeExtensionStatus(extensionid, callback) {
    if (isFirefox)
        return callback('not-chrome');
    if (arguments.length != 2) {
        callback = extensionid;
        extensionid = 'lfcgfepafnobdloecchnfaclibenjold';
    }
    var image = document.createElement('img');
    image.src = 'chrome-extension://' + extensionid + '/icon.png';
    image.onload = function () {
        chromeMediaSource = 'screen';
        window.postMessage('are-you-there', '*');
        setTimeout(function () {
            if (chromeMediaSource == 'screen') {
                callback('installed-disabled');
            }
            else
                callback('installed-enabled');
        }, 2000);
    };
    image.onerror = function () {
        callback('not-installed');
    };
}
function getScreenConstraintsWithAudio(callback) {
    getScreenConstraints(callback, true);
}
function getScreenConstraints(callback, captureSourceIdWithAudio) {
    sourceId = '';
    var firefoxScreenConstraints = {
        mozMediaSource: 'window',
        mediaSource: 'window'
    };
    if (isFirefox)
        return callback(null, firefoxScreenConstraints);
    var screen_constraints = {
        mandatory: {
            chromeMediaSource: chromeMediaSource,
            maxWidth: screen.width > 1920 ? screen.width : 1920,
            maxHeight: screen.height > 1080 ? screen.height : 1080
        },
        optional: []
    };
    if (chromeMediaSource == 'desktop' && !sourceId) {
        if (captureSourceIdWithAudio) {
            getSourceIdWithAudio(function (sourceId, canRequestAudioTrack) {
                screen_constraints.mandatory.chromeMediaSourceId = sourceId;
                if (canRequestAudioTrack) {
                    screen_constraints.canRequestAudioTrack = true;
                }
                callback(sourceId == 'PermissionDeniedError' ? sourceId : null, screen_constraints);
            });
        }
        else {
            getSourceId(function (sourceId) {
                screen_constraints.mandatory.chromeMediaSourceId = sourceId;
                callback(sourceId == 'PermissionDeniedError' ? sourceId : null, screen_constraints);
            });
        }
        return;
    }
    if (chromeMediaSource == 'desktop') {
        screen_constraints.mandatory.chromeMediaSourceId = sourceId;
    }
    callback(null, screen_constraints);
}
exports.getScreenConstraints = getScreenConstraints;
exports.getScreenConstraintsWithAudio = getScreenConstraintsWithAudio;
exports.isChromeExtensionAvailable = isChromeExtensionAvailable;
exports.getChromeExtensionStatus = getChromeExtensionStatus;
exports.getSourceId = getSourceId;

},{}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformUtils = void 0;
var platform = require("platform");
var PlatformUtils = (function () {
    function PlatformUtils() {
    }
    PlatformUtils.getInstance = function () {
        if (!this.instance) {
            this.instance = new PlatformUtils();
        }
        return PlatformUtils.instance;
    };
    PlatformUtils.prototype.isChromeBrowser = function () {
        return platform.name === "Chrome";
    };
    PlatformUtils.prototype.isSafariBrowser = function () {
        return platform.name === "Safari";
    };
    PlatformUtils.prototype.isChromeMobileBrowser = function () {
        return platform.name === "Chrome Mobile";
    };
    PlatformUtils.prototype.isFirefoxBrowser = function () {
        return platform.name === "Firefox";
    };
    PlatformUtils.prototype.isFirefoxMobileBrowser = function () {
        return platform.name === "Firefox Mobile" || platform.name === "Firefox for iOS";
    };
    PlatformUtils.prototype.isOperaBrowser = function () {
        return platform.name === "Opera";
    };
    PlatformUtils.prototype.isOperaMobileBrowser = function () {
        return platform.name === "Opera Mobile";
    };
    PlatformUtils.prototype.isEdgeBrowser = function () {
        var version = (platform === null || platform === void 0 ? void 0 : platform.version) ? parseFloat(platform.version) : -1;
        return platform.name === "Microsoft Edge" && version >= 80;
    };
    PlatformUtils.prototype.isEdgeMobileBrowser = function () {
        var _a, _b;
        var version = (platform === null || platform === void 0 ? void 0 : platform.version) ? parseFloat(platform.version) : -1;
        return platform.name === "Microsoft Edge" && (((_a = platform.os) === null || _a === void 0 ? void 0 : _a.family) === 'Android' || ((_b = platform.os) === null || _b === void 0 ? void 0 : _b.family) === 'iOS') && version > 45;
    };
    PlatformUtils.prototype.isAndroidBrowser = function () {
        return platform.name === "Android Browser";
    };
    PlatformUtils.prototype.isElectron = function () {
        return platform.name === "Electron";
    };
    PlatformUtils.prototype.isSamsungBrowser = function () {
        return (platform.name === "Samsung Internet Mobile" ||
            platform.name === "Samsung Internet");
    };
    PlatformUtils.prototype.isIPhoneOrIPad = function () {
        var userAgent = !!platform.ua ? platform.ua : navigator.userAgent;
        var isTouchable = "ontouchend" in document;
        var isIPad = /\b(\w*Macintosh\w*)\b/.test(userAgent) && isTouchable;
        var isIPhone = /\b(\w*iPhone\w*)\b/.test(userAgent) &&
            /\b(\w*Mobile\w*)\b/.test(userAgent) &&
            isTouchable;
        return isIPad || isIPhone;
    };
    PlatformUtils.prototype.isIOSWithSafari = function () {
        var userAgent = !!platform.ua ? platform.ua : navigator.userAgent;
        return this.isIPhoneOrIPad() && (/\b(\w*Apple\w*)\b/.test(navigator.vendor) &&
            /\b(\w*Safari\w*)\b/.test(userAgent) &&
            !/\b(\w*CriOS\w*)\b/.test(userAgent) &&
            !/\b(\w*FxiOS\w*)\b/.test(userAgent));
    };
    PlatformUtils.prototype.isIonicIos = function () {
        return this.isIPhoneOrIPad() && platform.ua.indexOf("Safari") === -1;
    };
    PlatformUtils.prototype.isIonicAndroid = function () {
        return (platform.os.family === "Android" && platform.name == "Android Browser");
    };
    PlatformUtils.prototype.isMobileDevice = function () {
        return platform.os.family === "iOS" || platform.os.family === "Android";
    };
    PlatformUtils.prototype.isReactNative = function () {
        return false;
    };
    PlatformUtils.prototype.isChromium = function () {
        return this.isChromeBrowser() || this.isChromeMobileBrowser() ||
            this.isOperaBrowser() || this.isOperaMobileBrowser() ||
            this.isEdgeBrowser() || this.isEdgeMobileBrowser() ||
            this.isSamsungBrowser() ||
            this.isIonicAndroid() || this.isIonicIos() ||
            this.isElectron();
    };
    PlatformUtils.prototype.canScreenShare = function () {
        var version = (platform === null || platform === void 0 ? void 0 : platform.version) ? parseFloat(platform.version) : -1;
        if (this.isMobileDevice()) {
            return false;
        }
        return (this.isChromeBrowser() ||
            this.isFirefoxBrowser() ||
            this.isOperaBrowser() ||
            this.isElectron() ||
            this.isEdgeBrowser() ||
            (this.isSafariBrowser() && version >= 13));
    };
    PlatformUtils.prototype.getName = function () {
        return platform.name || "";
    };
    PlatformUtils.prototype.getVersion = function () {
        return platform.version || "";
    };
    PlatformUtils.prototype.getFamily = function () {
        return platform.os.family || "";
    };
    PlatformUtils.prototype.getDescription = function () {
        return platform.description || "";
    };
    return PlatformUtils;
}());
exports.PlatformUtils = PlatformUtils;

},{"platform":12}],84:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRtcPeerSendrecv = exports.WebRtcPeerSendonly = exports.WebRtcPeerRecvonly = exports.WebRtcPeer = void 0;
var freeice = require("freeice");
var uuid_1 = require("uuid");
var ExceptionEvent_1 = require("../Events/ExceptionEvent");
var OpenViduLogger_1 = require("../Logger/OpenViduLogger");
var Platform_1 = require("../Utils/Platform");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
var WebRtcPeer = (function () {
    function WebRtcPeer(configuration) {
        var _this = this;
        this.remoteCandidatesQueue = [];
        this.localCandidatesQueue = [];
        this.iceCandidateList = [];
        this.candidategatheringdone = false;
        platform = Platform_1.PlatformUtils.getInstance();
        this.configuration = __assign(__assign({}, configuration), { iceServers: !!configuration.iceServers &&
                configuration.iceServers.length > 0
                ? configuration.iceServers
                : freeice(), mediaStream: configuration.mediaStream !== undefined
                ? configuration.mediaStream
                : null, mode: !!configuration.mode ? configuration.mode : "sendrecv", id: !!configuration.id ? configuration.id : this.generateUniqueId() });
        logger.debug("[WebRtcPeer] configuration:\n".concat(JSON.stringify(this.configuration, null, 2)));
        this.pc = new RTCPeerConnection({ iceServers: this.configuration.iceServers });
        this.pc.addEventListener("icecandidate", function (event) {
            if (event.candidate !== null) {
                var candidateInit = event.candidate;
                var iceCandidate = new RTCIceCandidate(candidateInit);
                _this.configuration.onIceCandidate(iceCandidate);
                if (iceCandidate.candidate !== '') {
                    _this.localCandidatesQueue.push(iceCandidate);
                }
            }
        });
        this.pc.addEventListener('signalingstatechange', function () {
            if (_this.pc.signalingState === 'stable') {
                while (_this.iceCandidateList.length > 0) {
                    var candidate = _this.iceCandidateList.shift();
                    _this.pc.addIceCandidate(candidate);
                }
            }
        });
    }
    WebRtcPeer.prototype.getId = function () {
        return this.configuration.id;
    };
    WebRtcPeer.prototype.dispose = function () {
        logger.debug('Disposing WebRtcPeer');
        if (this.pc) {
            if (this.pc.signalingState === 'closed') {
                return;
            }
            this.pc.close();
            this.remoteCandidatesQueue = [];
            this.localCandidatesQueue = [];
        }
    };
    WebRtcPeer.prototype.createOfferLegacy = function () {
        if (!!this.configuration.mediaStream) {
            this.deprecatedPeerConnectionTrackApi();
        }
        var hasAudio = this.configuration.mediaConstraints.audio;
        var hasVideo = this.configuration.mediaConstraints.video;
        var options = {
            offerToReceiveAudio: this.configuration.mode !== "sendonly" && hasAudio,
            offerToReceiveVideo: this.configuration.mode !== "sendonly" && hasVideo,
        };
        logger.debug("[createOfferLegacy] RTCPeerConnection.createOffer() options:", JSON.stringify(options));
        return this.pc.createOffer(options);
    };
    WebRtcPeer.prototype.createOffer = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function () {
            var _i, _j, track, tcInit, trackSettings, trackConsts, trackWidth, trackHeight, trackPixels, maxLayers, l, layerDiv, encoding, tc, sendParams, needSetParams, error_1, message, _k, _l, kind, sdpOffer, error_2, message;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        if (!("addTransceiver" in this.pc)) {
                            logger.warn("[createOffer] Method RTCPeerConnection.addTransceiver() is NOT available; using LEGACY offerToReceive{Audio,Video}");
                            return [2, this.createOfferLegacy()];
                        }
                        else {
                            logger.debug("[createOffer] Method RTCPeerConnection.addTransceiver() is available; using it");
                        }
                        if (!(this.configuration.mode !== "recvonly")) return [3, 7];
                        if (!this.configuration.mediaStream) {
                            throw new Error("[WebRtcPeer.createOffer] Direction is '".concat(this.configuration.mode, "', but no stream was configured to be sent"));
                        }
                        _i = 0, _j = this.configuration.mediaStream.getTracks();
                        _m.label = 1;
                    case 1:
                        if (!(_i < _j.length)) return [3, 6];
                        track = _j[_i];
                        tcInit = {
                            direction: this.configuration.mode,
                            streams: [this.configuration.mediaStream],
                        };
                        if (track.kind === "video" && this.configuration.simulcast) {
                            trackSettings = track.getSettings();
                            trackConsts = track.getConstraints();
                            trackWidth = (_c = (_b = (_a = trackSettings.width) !== null && _a !== void 0 ? _a : trackConsts.width.ideal) !== null && _b !== void 0 ? _b : trackConsts.width) !== null && _c !== void 0 ? _c : 0;
                            trackHeight = (_f = (_e = (_d = trackSettings.height) !== null && _d !== void 0 ? _d : trackConsts.height.ideal) !== null && _e !== void 0 ? _e : trackConsts.height) !== null && _f !== void 0 ? _f : 0;
                            logger.info("[createOffer] Video track dimensions: ".concat(trackWidth, "x").concat(trackHeight));
                            trackPixels = trackWidth * trackHeight;
                            maxLayers = 0;
                            if (trackPixels >= 960 * 540) {
                                maxLayers = 3;
                            }
                            else if (trackPixels >= 480 * 270) {
                                maxLayers = 2;
                            }
                            else {
                                maxLayers = 1;
                            }
                            tcInit.sendEncodings = [];
                            for (l = 0; l < maxLayers; l++) {
                                layerDiv = Math.pow(2, (maxLayers - l - 1));
                                encoding = {
                                    rid: "rdiv" + layerDiv.toString(),
                                    scalabilityMode: "L1T1",
                                };
                                if (["detail", "text"].includes(track.contentHint)) {
                                    encoding.scaleResolutionDownBy = 1.0;
                                    encoding.maxFramerate = Math.floor(30 / layerDiv);
                                }
                                else {
                                    encoding.scaleResolutionDownBy = layerDiv;
                                }
                                tcInit.sendEncodings.push(encoding);
                            }
                        }
                        tc = this.pc.addTransceiver(track, tcInit);
                        if (!(track.kind === "video")) return [3, 5];
                        sendParams = tc.sender.getParameters();
                        needSetParams = false;
                        if (!((_g = sendParams.degradationPreference) === null || _g === void 0 ? void 0 : _g.length)) {
                            if (["detail", "text"].includes(track.contentHint)) {
                                sendParams.degradationPreference = "maintain-resolution";
                            }
                            else {
                                sendParams.degradationPreference = "balanced";
                            }
                            logger.info("[createOffer] Video sender Degradation Preference set: ".concat(sendParams.degradationPreference));
                            needSetParams = true;
                        }
                        if (this.configuration.simulcast) {
                            if (((_h = sendParams.encodings) === null || _h === void 0 ? void 0 : _h.length) !== tcInit.sendEncodings.length) {
                                sendParams.encodings = tcInit.sendEncodings;
                                needSetParams = true;
                            }
                        }
                        if (!needSetParams) return [3, 5];
                        logger.debug("[createOffer] Setting new RTCRtpSendParameters to video sender");
                        _m.label = 2;
                    case 2:
                        _m.trys.push([2, 4, , 5]);
                        return [4, tc.sender.setParameters(sendParams)];
                    case 3:
                        _m.sent();
                        return [3, 5];
                    case 4:
                        error_1 = _m.sent();
                        message = "[WebRtcPeer.createOffer] Cannot set RTCRtpSendParameters to video sender";
                        if (error_1 instanceof Error) {
                            message += ": ".concat(error_1.message);
                        }
                        throw new Error(message);
                    case 5:
                        _i++;
                        return [3, 1];
                    case 6: return [3, 8];
                    case 7:
                        for (_k = 0, _l = ["audio", "video"]; _k < _l.length; _k++) {
                            kind = _l[_k];
                            if (!this.configuration.mediaConstraints[kind]) {
                                continue;
                            }
                            this.configuration.mediaStream = new MediaStream();
                            this.pc.addTransceiver(kind, {
                                direction: this.configuration.mode,
                                streams: [this.configuration.mediaStream],
                            });
                        }
                        _m.label = 8;
                    case 8:
                        _m.trys.push([8, 10, , 11]);
                        return [4, this.pc.createOffer()];
                    case 9:
                        sdpOffer = _m.sent();
                        return [3, 11];
                    case 10:
                        error_2 = _m.sent();
                        message = "[WebRtcPeer.createOffer] Browser failed creating an SDP Offer";
                        if (error_2 instanceof Error) {
                            message += ": ".concat(error_2.message);
                        }
                        throw new Error(message);
                    case 11: return [2, sdpOffer];
                }
            });
        });
    };
    WebRtcPeer.prototype.deprecatedPeerConnectionTrackApi = function () {
        for (var _i = 0, _a = this.configuration.mediaStream.getTracks(); _i < _a.length; _i++) {
            var track = _a[_i];
            this.pc.addTrack(track, this.configuration.mediaStream);
        }
    };
    WebRtcPeer.prototype.createAnswer = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if ("getTransceivers" in _this.pc) {
                logger.debug("[createAnswer] Method RTCPeerConnection.getTransceivers() is available; using it");
                var _loop_1 = function (kind) {
                    if (!_this.configuration.mediaConstraints[kind]) {
                        return "continue";
                    }
                    var tc = _this.pc
                        .getTransceivers()
                        .find(function (tc) { return tc.receiver.track.kind === kind; });
                    if (tc) {
                        tc.direction = _this.configuration.mode;
                    }
                    else {
                        return { value: reject(new Error("".concat(kind, " requested, but no transceiver was created from remote description"))) };
                    }
                };
                for (var _i = 0, _a = ["audio", "video"]; _i < _a.length; _i++) {
                    var kind = _a[_i];
                    var state_1 = _loop_1(kind);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
                _this.pc
                    .createAnswer()
                    .then(function (sdpAnswer) { return resolve(sdpAnswer); })
                    .catch(function (error) { return reject(error); });
            }
            else {
                var offerAudio = void 0, offerVideo = true;
                if (!!_this.configuration.mediaConstraints) {
                    offerAudio = (typeof _this.configuration.mediaConstraints.audio === 'boolean') ?
                        _this.configuration.mediaConstraints.audio : true;
                    offerVideo = (typeof _this.configuration.mediaConstraints.video === 'boolean') ?
                        _this.configuration.mediaConstraints.video : true;
                    var constraints = {
                        offerToReceiveAudio: offerAudio,
                        offerToReceiveVideo: offerVideo
                    };
                    _this.pc.createAnswer(constraints)
                        .then(function (sdpAnswer) { return resolve(sdpAnswer); })
                        .catch(function (error) { return reject(error); });
                }
            }
        });
    };
    WebRtcPeer.prototype.processLocalOffer = function (offer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.pc.setLocalDescription(offer)
                .then(function () {
                var localDescription = _this.pc.localDescription;
                if (!!localDescription) {
                    logger.debug('Local description set', localDescription.sdp);
                    return resolve();
                }
                else {
                    return reject('Local description is not defined');
                }
            })
                .catch(function (error) { return reject(error); });
        });
    };
    WebRtcPeer.prototype.processRemoteOffer = function (sdpOffer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var offer = {
                type: 'offer',
                sdp: sdpOffer
            };
            logger.debug('SDP offer received, setting remote description', offer);
            if (_this.pc.signalingState === 'closed') {
                return reject('RTCPeerConnection is closed when trying to set remote description');
            }
            _this.setRemoteDescription(offer)
                .then(function () { return resolve(); })
                .catch(function (error) { return reject(error); });
        });
    };
    WebRtcPeer.prototype.processLocalAnswer = function (answer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            logger.debug('SDP answer created, setting local description');
            if (_this.pc.signalingState === 'closed') {
                return reject('RTCPeerConnection is closed when trying to set local description');
            }
            _this.pc.setLocalDescription(answer)
                .then(function () { return resolve(); })
                .catch(function (error) { return reject(error); });
        });
    };
    WebRtcPeer.prototype.processRemoteAnswer = function (sdpAnswer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var answer = {
                type: 'answer',
                sdp: sdpAnswer
            };
            logger.debug('SDP answer received, setting remote description');
            if (_this.pc.signalingState === 'closed') {
                return reject('RTCPeerConnection is closed when trying to set remote description');
            }
            _this.setRemoteDescription(answer)
                .then(function () {
                resolve();
            })
                .catch(function (error) { return reject(error); });
        });
    };
    WebRtcPeer.prototype.setRemoteDescription = function (sdp) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.pc.setRemoteDescription(sdp)];
            });
        });
    };
    WebRtcPeer.prototype.addIceCandidate = function (iceCandidate) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            logger.debug('Remote ICE candidate received', iceCandidate);
            _this.remoteCandidatesQueue.push(iceCandidate);
            switch (_this.pc.signalingState) {
                case 'closed':
                    reject(new Error('PeerConnection object is closed'));
                    break;
                case 'stable':
                    if (!!_this.pc.remoteDescription) {
                        _this.pc.addIceCandidate(iceCandidate).then(function () { return resolve(); }).catch(function (error) { return reject(error); });
                    }
                    else {
                        _this.iceCandidateList.push(iceCandidate);
                        resolve();
                    }
                    break;
                default:
                    _this.iceCandidateList.push(iceCandidate);
                    resolve();
            }
        });
    };
    WebRtcPeer.prototype.addIceConnectionStateChangeListener = function (otherId) {
        var _this = this;
        this.pc.addEventListener('iceconnectionstatechange', function () {
            var iceConnectionState = _this.pc.iceConnectionState;
            switch (iceConnectionState) {
                case 'disconnected':
                    var msg1 = 'IceConnectionState of RTCPeerConnection ' + _this.configuration.id + ' (' + otherId + ') change to "disconnected". Possible network disconnection';
                    logger.warn(msg1);
                    _this.configuration.onIceConnectionStateException(ExceptionEvent_1.ExceptionEventName.ICE_CONNECTION_DISCONNECTED, msg1);
                    break;
                case 'failed':
                    var msg2 = 'IceConnectionState of RTCPeerConnection ' + _this.configuration.id + ' (' + otherId + ') to "failed"';
                    logger.error(msg2);
                    _this.configuration.onIceConnectionStateException(ExceptionEvent_1.ExceptionEventName.ICE_CONNECTION_FAILED, msg2);
                    break;
                case 'closed':
                    logger.log('IceConnectionState of RTCPeerConnection ' + _this.configuration.id + ' (' + otherId + ') change to "closed"');
                    break;
                case 'new':
                    logger.log('IceConnectionState of RTCPeerConnection ' + _this.configuration.id + ' (' + otherId + ') change to "new"');
                    break;
                case 'checking':
                    logger.log('IceConnectionState of RTCPeerConnection ' + _this.configuration.id + ' (' + otherId + ') change to "checking"');
                    break;
                case 'connected':
                    logger.log('IceConnectionState of RTCPeerConnection ' + _this.configuration.id + ' (' + otherId + ') change to "connected"');
                    break;
                case 'completed':
                    logger.log('IceConnectionState of RTCPeerConnection ' + _this.configuration.id + ' (' + otherId + ') change to "completed"');
                    break;
            }
        });
    };
    WebRtcPeer.prototype.generateUniqueId = function () {
        return (0, uuid_1.v4)();
    };
    return WebRtcPeer;
}());
exports.WebRtcPeer = WebRtcPeer;
var WebRtcPeerRecvonly = (function (_super) {
    __extends(WebRtcPeerRecvonly, _super);
    function WebRtcPeerRecvonly(configuration) {
        var _this = this;
        configuration.mode = 'recvonly';
        _this = _super.call(this, configuration) || this;
        return _this;
    }
    return WebRtcPeerRecvonly;
}(WebRtcPeer));
exports.WebRtcPeerRecvonly = WebRtcPeerRecvonly;
var WebRtcPeerSendonly = (function (_super) {
    __extends(WebRtcPeerSendonly, _super);
    function WebRtcPeerSendonly(configuration) {
        var _this = this;
        configuration.mode = 'sendonly';
        _this = _super.call(this, configuration) || this;
        return _this;
    }
    return WebRtcPeerSendonly;
}(WebRtcPeer));
exports.WebRtcPeerSendonly = WebRtcPeerSendonly;
var WebRtcPeerSendrecv = (function (_super) {
    __extends(WebRtcPeerSendrecv, _super);
    function WebRtcPeerSendrecv(configuration) {
        var _this = this;
        configuration.mode = 'sendrecv';
        _this = _super.call(this, configuration) || this;
        return _this;
    }
    return WebRtcPeerSendrecv;
}(WebRtcPeer));
exports.WebRtcPeerSendrecv = WebRtcPeerSendrecv;

},{"../Events/ExceptionEvent":58,"../Logger/OpenViduLogger":79,"../Utils/Platform":83,"freeice":2,"uuid":22}],85:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRtcStats = void 0;
var OpenViduLogger_1 = require("../Logger/OpenViduLogger");
var Platform_1 = require("../Utils/Platform");
var logger = OpenViduLogger_1.OpenViduLogger.getInstance();
var platform;
;
var WebRtcStats = (function () {
    function WebRtcStats(stream) {
        this.stream = stream;
        this.STATS_ITEM_NAME = 'webrtc-stats-config';
        this.webRtcStatsEnabled = false;
        this.statsInterval = 1;
        platform = Platform_1.PlatformUtils.getInstance();
    }
    WebRtcStats.prototype.isEnabled = function () {
        return this.webRtcStatsEnabled;
    };
    WebRtcStats.prototype.initWebRtcStats = function () {
        var _this = this;
        var webrtcObj = localStorage.getItem(this.STATS_ITEM_NAME);
        if (!!webrtcObj) {
            this.webRtcStatsEnabled = true;
            var webrtcStatsConfig = JSON.parse(webrtcObj);
            logger.warn('WebRtc stats enabled for stream ' + this.stream.streamId + ' of connection ' + this.stream.connection.connectionId);
            logger.warn('localStorage item: ' + JSON.stringify(webrtcStatsConfig));
            this.POST_URL = webrtcStatsConfig.httpEndpoint;
            this.statsInterval = webrtcStatsConfig.interval;
            this.webRtcStatsIntervalId = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, this.sendStatsToHttpEndpoint()];
                        case 1:
                            _a.sent();
                            return [2];
                    }
                });
            }); }, this.statsInterval * 1000);
        }
        else {
            logger.debug('WebRtc stats not enabled');
        }
    };
    WebRtcStats.prototype.getSelectedIceCandidateInfo = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var statsReport, transportStat, candidatePairs, localCandidates, remoteCandidates, selectedCandidatePair, selectedCandidatePairId, length_1, iterator, i, candidatePair, localCandidateId, remoteCandidateId, finalLocalCandidate, candList, cand, _i, cand_1, c, finalRemoteCandidate, candList, cand, _a, cand_2, c;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.stream.getRTCPeerConnection().getStats()];
                    case 1:
                        statsReport = _b.sent();
                        candidatePairs = new Map();
                        localCandidates = new Map();
                        remoteCandidates = new Map();
                        statsReport.forEach(function (stat) {
                            if (stat.type === 'transport' && (platform.isChromium() || platform.isSafariBrowser() || platform.isReactNative())) {
                                transportStat = stat;
                            }
                            switch (stat.type) {
                                case 'candidate-pair':
                                    candidatePairs.set(stat.id, stat);
                                    break;
                                case 'local-candidate':
                                    localCandidates.set(stat.id, stat);
                                    break;
                                case 'remote-candidate':
                                    remoteCandidates.set(stat.id, stat);
                                    break;
                            }
                        });
                        if (transportStat != null) {
                            selectedCandidatePairId = transportStat.selectedCandidatePairId;
                            selectedCandidatePair = candidatePairs.get(selectedCandidatePairId);
                        }
                        else {
                            length_1 = candidatePairs.size;
                            iterator = candidatePairs.values();
                            for (i = 0; i < length_1; i++) {
                                candidatePair = iterator.next().value;
                                if (candidatePair['selected']) {
                                    selectedCandidatePair = candidatePair;
                                    break;
                                }
                            }
                        }
                        localCandidateId = selectedCandidatePair.localCandidateId;
                        remoteCandidateId = selectedCandidatePair.remoteCandidateId;
                        finalLocalCandidate = localCandidates.get(localCandidateId);
                        if (!!finalLocalCandidate) {
                            candList = this.stream.getLocalIceCandidateList();
                            cand = candList.filter(function (c) {
                                return (!!c.candidate &&
                                    (c.candidate.indexOf(finalLocalCandidate.ip) >= 0 || c.candidate.indexOf(finalLocalCandidate.address) >= 0) &&
                                    c.candidate.indexOf(finalLocalCandidate.port) >= 0);
                            });
                            finalLocalCandidate.raw = [];
                            for (_i = 0, cand_1 = cand; _i < cand_1.length; _i++) {
                                c = cand_1[_i];
                                finalLocalCandidate.raw.push(c.candidate);
                            }
                        }
                        else {
                            finalLocalCandidate = 'ERROR: No active local ICE candidate. Probably ICE-TCP is being used';
                        }
                        finalRemoteCandidate = remoteCandidates.get(remoteCandidateId);
                        if (!!finalRemoteCandidate) {
                            candList = this.stream.getRemoteIceCandidateList();
                            cand = candList.filter(function (c) {
                                return (!!c.candidate &&
                                    (c.candidate.indexOf(finalRemoteCandidate.ip) >= 0 || c.candidate.indexOf(finalRemoteCandidate.address) >= 0) &&
                                    c.candidate.indexOf(finalRemoteCandidate.port) >= 0);
                            });
                            finalRemoteCandidate.raw = [];
                            for (_a = 0, cand_2 = cand; _a < cand_2.length; _a++) {
                                c = cand_2[_a];
                                finalRemoteCandidate.raw.push(c.candidate);
                            }
                        }
                        else {
                            finalRemoteCandidate = 'ERROR: No active remote ICE candidate. Probably ICE-TCP is being used';
                        }
                        return [2, resolve({
                                localCandidate: finalLocalCandidate,
                                remoteCandidate: finalRemoteCandidate
                            })];
                }
            });
        }); });
    };
    WebRtcStats.prototype.stopWebRtcStats = function () {
        if (this.webRtcStatsEnabled) {
            clearInterval(this.webRtcStatsIntervalId);
            logger.warn('WebRtc stats stopped for disposed stream ' + this.stream.streamId + ' of connection ' + this.stream.connection.connectionId);
        }
    };
    WebRtcStats.prototype.sendStats = function (url, response) {
        return __awaiter(this, void 0, void 0, function () {
            var configuration, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        configuration = {
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify(response),
                            method: 'POST',
                        };
                        return [4, fetch(url, configuration)];
                    case 1:
                        _a.sent();
                        return [3, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger.error("sendStats error: ".concat(JSON.stringify(error_1)));
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    WebRtcStats.prototype.sendStatsToHttpEndpoint = function () {
        return __awaiter(this, void 0, void 0, function () {
            var webrtcStats, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, this.getCommonStats()];
                    case 1:
                        webrtcStats = _a.sent();
                        response = this.generateJSONStatsResponse(webrtcStats);
                        return [4, this.sendStats(this.POST_URL, response)];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        error_2 = _a.sent();
                        logger.log(error_2);
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    WebRtcStats.prototype.getCommonStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var statsReport, response_1, videoTrackStats_1, candidatePairStats_1, error_3;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4, this.stream.getRTCPeerConnection().getStats()];
                                case 1:
                                    statsReport = _a.sent();
                                    response_1 = this.getWebRtcStatsResponseOutline();
                                    videoTrackStats_1 = ['framesReceived', 'framesDropped', 'framesSent', 'frameHeight', 'frameWidth'];
                                    candidatePairStats_1 = ['availableOutgoingBitrate', 'currentRoundTripTime'];
                                    statsReport.forEach(function (stat) {
                                        var mediaType = stat.mediaType != null ? stat.mediaType : stat.kind;
                                        var addStat = function (direction, key) {
                                            if (stat[key] != null && response_1[direction] != null) {
                                                if (!mediaType && (videoTrackStats_1.indexOf(key) > -1)) {
                                                    mediaType = 'video';
                                                }
                                                if (direction != null && mediaType != null && key != null && response_1[direction][mediaType] != null) {
                                                    response_1[direction][mediaType][key] = Number(stat[key]);
                                                }
                                                else if (direction != null && key != null && candidatePairStats_1.includes(key)) {
                                                    response_1[direction][key] = Number(stat[key]);
                                                }
                                            }
                                        };
                                        switch (stat.type) {
                                            case "outbound-rtp":
                                                addStat('outbound', 'bytesSent');
                                                addStat('outbound', 'packetsSent');
                                                addStat('outbound', 'framesEncoded');
                                                addStat('outbound', 'nackCount');
                                                addStat('outbound', 'firCount');
                                                addStat('outbound', 'pliCount');
                                                addStat('outbound', 'qpSum');
                                                break;
                                            case "inbound-rtp":
                                                addStat('inbound', 'bytesReceived');
                                                addStat('inbound', 'packetsReceived');
                                                addStat('inbound', 'packetsLost');
                                                addStat('inbound', 'jitter');
                                                addStat('inbound', 'framesDecoded');
                                                addStat('inbound', 'nackCount');
                                                addStat('inbound', 'firCount');
                                                addStat('inbound', 'pliCount');
                                                break;
                                            case 'track':
                                                addStat('inbound', 'jitterBufferDelay');
                                                addStat('inbound', 'framesReceived');
                                                addStat('outbound', 'framesDropped');
                                                addStat('outbound', 'framesSent');
                                                addStat(_this.stream.isLocal() ? 'outbound' : 'inbound', 'frameHeight');
                                                addStat(_this.stream.isLocal() ? 'outbound' : 'inbound', 'frameWidth');
                                                break;
                                            case 'candidate-pair':
                                                addStat('candidatepair', 'currentRoundTripTime');
                                                addStat('candidatepair', 'availableOutgoingBitrate');
                                                break;
                                        }
                                    });
                                    if (!(response_1 === null || response_1 === void 0 ? void 0 : response_1.candidatepair) || Object.keys(response_1.candidatepair).length === 0) {
                                        delete response_1.candidatepair;
                                    }
                                    return [2, resolve(response_1)];
                                case 2:
                                    error_3 = _a.sent();
                                    logger.error('Error getting common stats: ', error_3);
                                    return [2, reject(error_3)];
                                case 3: return [2];
                            }
                        });
                    }); })];
            });
        });
    };
    WebRtcStats.prototype.generateJSONStatsResponse = function (stats) {
        return {
            '@timestamp': new Date().toISOString(),
            participant_id: this.stream.connection.data,
            session_id: this.stream.session.sessionId,
            platform: platform.getName(),
            platform_description: platform.getDescription(),
            stream: 'webRTC',
            webrtc_stats: stats
        };
    };
    WebRtcStats.prototype.getWebRtcStatsResponseOutline = function () {
        if (this.stream.isLocal()) {
            return {
                outbound: {
                    audio: {},
                    video: {}
                },
                candidatepair: {}
            };
        }
        else {
            return {
                inbound: {
                    audio: {},
                    video: {}
                }
            };
        }
    };
    return WebRtcStats;
}());
exports.WebRtcStats = WebRtcStats;

},{"../Logger/OpenViduLogger":79,"../Utils/Platform":83}]},{},[40])