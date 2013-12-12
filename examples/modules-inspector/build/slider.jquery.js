/*!
Copyright 2010-2012 Gaetan Renaudeau
http://sliderjs.org/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
(function ($, ns, U) {
  // Implementing sliderjs.util with jQuery function to ensure old browser support.
  U.version = 'jquery';
  U.html = function (element, html) {
    $(element).html(html);
  }
  U.append = function (element, html) {
    var node = $(html).first();
    $(element).append(node);
    return node[0];
  }
  U.find = function (element, css) {
    return $(element).find(css).toArray();
  }
  U.show = function (element) {
    $(element).show();
  }
  U.hide = function (element) {
    $(element).hide();
  }
  U.addClass = function (element, c) {
    $(element).addClass(c);
  }
  U.removeClass = function (element, c) {
    $(element).removeClass(c);
  }
  U.css = function (element, prop, value) {
    if(arguments.length==2) return $(element).css(prop);
    $(element).css(prop, value);
  }
  U.width = function (element, w) {
    if(arguments.length==1) return $(element).width();
    $(element).width(w);
  }
  U.height = function (element, h) {
    if(arguments.length==1) return $(element).height();
    $(element).height(h);
  }
  U.on = function (element, eventName, fun) {
    $(element).bind(eventName, fun);
  }
  U.off = function (element, eventName, fun) {
    $(element).unbind(eventName, fun);
  }

  // $(container).sliderjs({ ...opts... })
  $.fn.sliderjs = function (options) {
    return ns.Slider(this[0], options);
  };

})(jQuery, window.sliderjs, window.sliderjs.util);
