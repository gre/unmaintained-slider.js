(function ($) {
/**
 * SelectorTemplating.js
 * License: GPL v3
 * Author: gaetanrenaudeau.fr  - 2012
 * Link: https://gist.github.com/gists/1731611
 */
this.SelectorTemplating = function (container, onTemplated) {  
  var self = this,
      rootTemplate, // type of Arguments
      fragments = []; // Array of { selector: ".container", tmpl: function(i){ return "html"; } }

  self.add = function (containerSelector, template, callback, priority) {
    fragments.push({ 
      tmpl: template, 
      cb: callback,
      selector: containerSelector, 
      priority: priority || 0
    });
    return self;
  }

  self.remove = function (template) {
    var i = $.indexOf($.map(fragments, function (t) { return t.tmpl }), template);
    if (i >= 0) fragments.splice(i, 1);
    return self;
  }

  self.refresh = function (template) {
    self.compile();
  }

  // Template the whole thing
  self.compile = function () {
    var cbs = [], 
        i = 0, 
        waitList, el, nodes, created,
        somethingChangedThisLoop;

    // empty the container 
    self.destroy();

    // all fragments goes to a waitlist, we need to append them all.
    // When a selector matches nodes, we append the template in nodes and remove from the waitlist.
    waitList = [].concat(fragments);
    waitList.sort(function (a, b) {
      return (a.priority != b.priority) ? 
      (b.priority - a.priority) : // higher priority first
      (a.selector < b.selector ? -1 : 1); // try to put root selector first (guess)
    });

    while (waitList.length) {
      el = waitList[i];
      // Try to find the container
      nodes = !el.selector ? [container] : $.find(container, el.selector);
      if (nodes.length) {
        somethingChangedThisLoop = true;
        // template into each containers.
        created = $.map(nodes, function(node, i) {
          return $.append(node, el.tmpl(i));
        });
        el.nodes = created;
        // remove from the waitlist
        waitList.splice(i, 1);
        i = 0;
      }
      else {
        // continue the loop if we have waitList and something has changed the last loop.
        if (++i >= waitList.length) {
          i = 0;
          if(!somethingChangedThisLoop) break;
          somethingChangedThisLoop = false;
        }
      }
    }

    $.each(fragments, function (template) {
      template.cb && template.cb(template.nodes, container);
    });

    onTemplated && onTemplated();
    return self;
  }
  
  // Clean the template
  self.destroy = function () {
    $.html(container, '');
    $.each(fragments, function (template) {
      template.nodes = [];
    });
    return self;
  }
}

}(sliderjs.util));

