Author notes
===

> Slider.js was a great experiment I wrote in 2010 with the idea to bring the power of WebGL for image slideshows. The library has been very tough to finish because the focus was so wide and it was very hard (or impossible) to match all needs with such a monolithic library approach. 2012 brought to light a new way of doing things: Browserify and a defined way to make modules (CommonJS). I've been working the last years in exploding the great concepts of Slider.js into individual and small focused libraries: doing one simple thing but doing it well.
- `glsl-transition` and `glsl-transition-core` only focus on implementing a Transition in WebGL. Note that `glsl-transition` uses some http://stack.gl modules which make the library easier to maintain, more solid and less bugged. I have then started http://GLSL.io/ , an ambitious project to make the description of a transition a "standard" among slideshow engines. A GLSL Transition is just a GLSL fragment shader with 4 uniforms: a `float progress`, a `vec2 resolution` and `sampler2D from, to`. Users can also define their own extra uniforms that becomes "parameters" of the transition. Of course a valid transition is when "from" is displayed at progress=0.0 and "to" at progress=1.0. A transition should display a smooth progressing when progress move from 0.0 to 1.0.
- `kenburns` is another well focused micro-library that produces kenburns effect for DOM, Canvas2D and WebGL (3 implementations).
- ...and much more micro libraries...

And finally in 2015, I'm working on `diaporama` that is a simpler, more tested, less monolithic *slider.js*.

I'm also working on a Slideshow Editor that will make it very easy to create slideshows with `diaporama`.

Keep in touch.

Gaëtan Renaudeau

---

---

---


FOLLOWING IS UNMAINTAINED AND OUTDATED


---



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
