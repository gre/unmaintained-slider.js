(function (ns) {

	// Matches dashed string for camelizing
	var rdashAlpha = /-([a-z]|[0-9])/ig,
      rmsPrefix = /^-ms-/,
      stringToListSplit = /[, ]+/,

      fcamelCase = function( all, letter ) {
        return ( letter + "" ).toUpperCase();
      };

/*
 * util functions.
 * This internal implementation is light and native but can fail on some old browser.
 * Hence, you could override them with a plugin (jQuery, Prototype, ...)
 */
var $ = ns.util = {
  version: 'native',

  /// DOM ///

  html: function (element, html) { 
    if(element) element.innerHTML = html;
  },
  // add only the first node of html in element and return this node.
  append: function (element, html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    return element.appendChild(div.firstChild);
  },
  find: function (element, css) {
    return element.querySelectorAll(css);
  },
  addClass: function (element, c) {
    element.classList.add(c);
  },
  removeClass: function (element, c) {
    element.classList.remove(c);
  },
  camelCase: function (string) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
  },
  css: function (element, prop, value) {
    prop = $.camelCase(prop);
    if(arguments.length==1) return element.style[prop];
    element.style[prop] = value;
  },
  show: function (element) {
    element.style.display = "block";
  },
  hide: function (element) {
    element.style.display = "none";
  },
  width: function (element, w) {
    if (arguments.length==1) return element.style.width;
    element.style.width = w;
  },
  height: function (element, h) {
    if (arguments.length==1) return element.style.height;
    element.style.height = h;
  },
  on: function (element, eventName, fun) {
    element.addEventListener(eventName, fun);
  },
  off: function (element, eventName, fun) {
    element.removeEventListener(eventName, fun);
  },

  /// Utils ///
  
  indexOf: function (t, a) {
    if (t.indexOf) return t.indexOf(a);
    for(var i=0; i<t.length; i++)
      if(t[i]==a)  
        return i;  
    return -1;
  },
  // Make a pub/sub event system (https://gist.github.com/1000193)
  makeEvent: function (_){return {
    pub:function (a,b,c,d){for(d=-1,c=[].concat(_[a]);c[++d];)c[d](b)},
    sub:function (a,b){(_[a]||(_[a]=[])).push(b)},
    del:function (a,b){if(_[a]){var i = $.indexOf(_[a], b);i>=0 && _[a].splice(i, 1);}}
  }},

  each: function (a,f){
    if(a.forEach) a.forEach(f); else for(var i=0; i<a.length; ++i) f(a[i], i, a);
  },
  map: function (a,f){
    var t=[]; $.each(a, function (v,i,l){ t[i]=f(v,i,l); }); return t;
  },
  extend: function (obj) {
    for(var a=1; a<arguments.length; ++a) {
      var source = arguments[a];
      for (var prop in source)
        if (source[prop] !== void 0) obj[prop] = source[prop];
    }
    return obj;
  },
  // difference between two arrays (a - b)
  dif: function (a, b) {
    var t = [];
    for (var i = 0; i<a.length; ++i)
      if ($.indexOf(b, a[i]) < 0)
        t.push(a[i]);
    return t;
  },
  nop: function () {},
  now: function (){ return +new Date() },
  uuid: function (n){ return function (){ return ++n; } }(0),

  // Simplified version of "Simple JavaScript Templating" by John Resig - http://ejohn.org/ - MIT Licensed
  tmpl: function (str){
    return new Function("obj","var p=[];with(obj||{}){p.push('"+
       str.replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      +"');}return p.join('');");
  },
  getList: function (o) { 
    return typeof(o)=="string" ? o.split(stringToListSplit) : (o instanceof Array ? o : []) 
  },
  createRegistrable: function() {
    var keys = [], hashmap = {};
    return function(name, o){ switch (arguments.length) { 
      case 0: return keys;
      case 1: return hashmap[name];
      case 2: keys.push(name); hashmap[name]=o;
    }};
  },
  parseTime: function(time) {
    var typ = typeof time;
    if (typ == "number") return time;
    if (typ == "string") {
      var i = time.indexOf("ms");
      if (i>0) return parseFloat(time.substring(0, i));
      i = time.indexOf("s");
      if (i>0) return 1000*parseFloat(time.substring(0, i));
    }
    return NaN;
  }
}

}(window.sliderjs));


