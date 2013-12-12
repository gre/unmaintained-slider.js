Author notes
===

Here we go! I finally release Slider.js v2 (alpha), hours of work here, but this is just the beginning :)

This current SliderJS version 2 is currently in development.

Good news for you, I've finally decided that SliderJS (v2) will be open-source.
Please don't make me regret that choice, the project is open to contribution and wait your donation!

<a href="https://flattr.com/submit/auto?user_id=greweb&url=http%3A%2F%2Fgithub.com%2Fgre%2Fslider.js" target="_blank"><img src="http://api.flattr.com/button/flattr-badge-large.png" alt="Flattr this" title="Flattr this" border="0"></a>

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=renaudeau%2egaetan%40gmail%2ecom&lc=US&item_name=SliderJS&item_number=sliderjs&no_note=0&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHostedGuest"><img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" border="0" alt="PayPal - The safer, easier way to pay online!" /></a>

BitCoin: <a href="bitcoin:1N5cGh6QwdFrHhEnFMknrJq517rzLvKevD?amount=0.05">1N5cGh6QwdFrHhEnFMknrJq517rzLvKevD</a>

LiteCoin: <a href="litecoin:LUJgwVbifnajAoGfT2bBKxnFvV584PkLNX?amount=1">LUJgwVbifnajAoGfT2bBKxnFvV584PkLNX</a>

Documentation
===

**>>> Please understand that the current build system, the code architecture and the following documentation is likely going to change ;) <<<**

> I'm going to refactor and modularize a bit more the source code, probably using CommonJS and Browserify conventions.

What can you extend with Slider.js
---

- create a new module in `/src/modules/`
 - [name].js

- create a new theme  in `/src/themes/`
 - [name].less

- create a new transition:
 - in `/transitions/css/`: [name].css or [name].less
 - in `/transitions/canvas/`: [name].js
 - in `/transitions/glsl/`: [name].glsl


Example of a module
---

A module is a slider feature.

Each module defines a value which can be set by the slider (in the constructor, or with the .opt() method).
It can be a simple number, string, ... or any complex type.

```javascript
sliderjs.modules("mymodulename", function (sandbox, $) {
  // ... do something private ...
  return {
    def: 42, // optional, set the default value
    init: function () {  // optional, called when the module start. do all your bind here
      ...
      this.change(sandbox.value()) // trigger the change() once on load
    },
    accept: function (value, old) { // optional, accept & transform the value
    },
    change: function (value, old) { // optional, called each time the value is changed (with .opt)
      ...
    },
    destroy: function () { // optional, called when the module stop. do all your unbind here
      ...
    }
  }
});
```

Each instance of Slider will load your module,
it will have a `.mymodulename()` method with is a shortcut to .opt("mymodulename", ...)

The sandbox param is your only way to interact with the outside world! (the slider, ...)
---

- events: 

```javascript
sandbox.on
sandbox.off
sandbox.trigger

sandbox.opt(optname)
sandbox.opt(optname, newValueToSet)

// shortcut of opt for this module
sandbox.value()
sandbox.value(newValueToSet) 
```

The $ param is the sliderjs.util package
---


A very modular library
======================

every feature is independent from others.
every feature is splitted in a file.

- easy to develop: directly see what feature doesn't work (e.g. transition.js:66)
- easy to maintain
- easy to extend: add your feature with the sliderjs.feature("myfeature", { ... }) function.

Themes: layout themes and color themes

Extend features of Slider.js
----------------------------

```javascript
sliderjs.feature(optname, o)
```

optname: the name of the option to add.

o is an object with:

* o.init: Option Init Handler.
   This is called once in the Slider constructor.
   You usually need it if you want to listen to some events.
* o.update: Option Change Handler. called on opt change.
* o.def: the default option value to set.
* o.fn: define your own feature function (instead of the default opt shortcut)

You can also define in o some private functions and properties to add to the Slider prototype
 This will be stored in ns.Slider.prototype.{optname}_*

 ex:

```javascript
   sliderjs.feature("foo", {
     bar: function (){},
     answer: 42
   })
```
means a slider instance has : slider.foo_bar() and slider.foo_answer

Writing themes
==============

A theme should be the most atomic possible - one theme, one color or one theme, one layout.

Conventions
-----------
If you want different scales of intensity take these conventions (like for clothes) :
XS : extra small
S : small
M : medium the "normal" intensity
L : large
XL : extra large
XXL : extra extra large

please append it in the name of the theme, and keep the caps.
for the normal "M" size, please let people use it without the M. Example:
.sliderjs.th-shadow, .sliderjs.th-shadow-M  { ... }

but keep the "shadow-M.less" file name


What do you need?
==================

Slider.js is (since the v2) a standalone library and uses the native DOM api.
Slider.js also provides plugin for jQuery. 
You can use one to ensure browser compatibility.

Note for Slider.js developers
=============================

Issues and feature requests
---------------------------

Please use Github for sending issues and pull requests.

Conventions and coding style
----------------------------

* A source file is indented with 2 spaces starts with a concise description of what the file adds and contains an ending empty line.
* Focus on KISS and DRY principles. Do negative coding optimizations (economize characters but keep readability).
* Respect the dir hierarchy and the file name convention. (e.g. each core feature is implemented in src/features/{featurename}.js)

Writing a new module
---------------------

A module should not produce error if some modules are missing: it should be loosely-coupled.

accept: convert the received object to a valid data structure. It helps to avoid incoherent state of value.

accept: function (value) { return value } // accept everything without any transformation


Event Driven : 
    .on : bind an event
    .off : unbind an event
    .trigger : trigger an event

Request : 
    .opt("module") : request the value, 
    .opt("module", "newValue") : request to change the value.

If you can, prefer using events (.on .off .trigger) than change options between modules (with .opt). 

Choose a concise name which make sense. It must follow the lower camel case convention and be alphabetic only. Make sure the name you take doesn't exists.
Try to make features as modular as possible. 
If you need communicating between modules try to only use events (e.g. bind an option changes) and touchopt (trigger the refresh of an option).
Don't put static functions and constants into the feature.
Throwing exception is recommanded for basic data validation. But don't use too much. It helps the user of sliderjs to know what's wrong with its arguments.
Write unit test when you have finished it.

Committing in SliderJS
----------------------
The project is build with a Rakefile and via the `rake` command.

You should keep it running in a terminal, it will watch for file change and recompile the build each time.

Run the test page before commiting changes.

License
=======

Copyright 2010 - 2013 Gaetan Renaudeau

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
