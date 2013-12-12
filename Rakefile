# Rakefile inspired from Backbone.js
#
#
require 'rubygems'

begin
  require 'watchr'
rescue LoadError
  puts "watchr not found.\nInstall it by running 'gem install watchr'"
  exit
end

begin
  require 'less'
rescue LoadError
  puts "less not found.\nInstall it by running 'gem install less'"
  exit
end

begin
  require 'closure-compiler'
rescue LoadError
  puts "closure-compiler not found.\nInstall it by running 'gem install closure-compiler'"
  exit
end

OUTPUT = "build"
def copying 
  File.read 'COPYING' 
end

GLSL_EXT = "glsl"

def generateGlslTransitionSource (filepath)
  name = File.basename(filepath, "."+GLSL_EXT)
  r = File.read filepath
  opts = r.match(/^\/\/!(.*)$/)
  if opts and opts[1]
    opts = opts[1]
  else
    opts = "{}"
  end
  "/*~~~"+name+"~~~ glsl transitions */\n"+
  "sliderjs.glslTransitions('"+name+"', sliderjs.util.extend("+opts+", {\n"+
  "  shader: '"+r.split("\n").join("\\n").split("'").join("\\'")+
  "'\n"+
  "}));\n"
end

def slider_glsl_files
  Dir['src/transitions/glsl/*.'+GLSL_EXT]
end

def slider_themes
  Dir['src/themes/*.less'].
    map { |f| File.basename(f, ".less") }
end

def slider_glsl_source
  slider_glsl_files.
    map { |f| generateGlslTransitionSource(f) }.
    join "\n"
end

def slider_js_files
  Dir['src/globals.js', 'src/utils.js', 'src/core.js', 'src/SelectorTemplating.js', 'src/modules/*.js', 'src/transitions/canvas/*.js']
end

def slider_js_source
  (slider_js_files.
    map { |f| File.read f }.
    join "\n")+
  slider_glsl_source
end

slider_js_output = OUTPUT+"/slider.js"
slider_min_js_output = OUTPUT+"/slider.min.js"

outputs = ["examples/flickr-stream/public/sliderjs/", "examples/modules-inspector/"]

def slider_less_files
  Dir['src/slider.less', 'src/modules/*.less', 'src/themes/*.less', 'src/transitions/css/*.less']
end
def slider_less_source
  slider_less_files.
    map { |f| File.read f }.
    join "\n"
end
slider_min_css_output = OUTPUT+"/slider.min.css"

def slider_test_files
  Dir['src/test/common.js', 'src/test/slider.js', 'src/test/*/*.js']
end
def slider_test_source
  slider_test_files.
    map { |f| File.read f }.
    join "\n"
end
slider_test_output = OUTPUT+"/tests.js"

desc "default target"
task :default => :watch do end

desc "make the source code"
task :make => [:js, :css, :tests, :outputs] do end

desc "watch for building"
task :watch => [:clean, :make] do
  script = Watchr::Script.new

  (slider_glsl_files.concat(slider_js_files)).each { |file|
    script.watch(file) { 
      |file| system("rake make")
    }
  }
  ###
  #slider_glsl_files { |file|
  #  script.watch(file) { 
  #    |file| system("rake js")
  #  }
  #}
  ###
  slider_less_files.each { |file|
    script.watch(file) { 
      |file| system("rake make")
    }
  }
  slider_test_files.each { |file|
    script.watch(file) {
      |file| system("rake make")
    }
  }

  controller = Watchr::Controller.new(script, Watchr.handler.new)
  puts "now watching files change..."
  controller.run
end

task :js => :build_dir do
  puts "compiling slider.min.js ..."
  closure = Closure::Compiler.new()
  source = slider_js_source
  slider_jquery = "src/slider.jquery.js"
  slider_jquery_source = File.read slider_jquery
  File.open("build/slider.jquery.js", "w+") do |file|
    file.write "/*!"+copying+"*/\n"+slider_jquery_source
  end
  File.open("build/slider.jquery.min.js", 'w+') do |file|
    file.write "/*!"+copying+"*/\n"+closure.compress(slider_jquery_source)
  end

  File.open(slider_js_output, "w+") do |file|
    file.write  "/*!"+copying+"*/\n"+source
  end
  File.open(slider_min_js_output, 'w+') do |file|
    file.write "/*!"+copying+"*/\n"+closure.compress(source)
  end
  puts "slider.min.js compiled"
end

task :css => :build_dir do
  puts "compiling slider.min.css ..."
  parser = Less::Parser.new()
  tree = parser.parse(slider_less_source)
  File.open(slider_min_css_output, 'w+') do |file|
    file.write "/*!"+copying+"*/\n"+tree.to_css(:compress => true)
  end
  puts "slider.min.css compiled"
end

task :outputs do
  outputs.each { |dirpath|
    mkdir_p dirpath
    cp_r OUTPUT, dirpath
  }
  File.open("examples/modules-inspector/THEMES.js", "w+") do |file|
    file.write 'THEMES = ["'+slider_themes.join('", "')+'"];'+"\n"
  end

end

task :tests => :build_dir do
  puts "compiling tests.js ..."
  File.open(slider_test_output, 'w+') do |file|
    file.write slider_test_source
  end
  puts "tests.js compiled"
end

task :build_dir do
  mkdir_p OUTPUT
end

desc "clean compiled files"
task :clean do
  rm_rf OUTPUT+"/"
end

desc "build the docco documentation"
task :doc do
  check 'docco', 'docco', 'https://github.com/jashkenas/docco'
  system "docco slider.js"
end

# Check for the existence of an executable.
def check(exec, name, url)
  return unless `which #{exec}`.empty?
  puts "#{name} not found.\nInstall it from #{url}"
  exit
end

