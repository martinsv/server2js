var path = require('path'),
    compiler = require( 'superstartup-closure-compiler' );

module.exports = function(grunt)
{

  grunt.loadNpmTasks('grunt-closure-tools');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-regarde');

  var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

  var folderMount = function folderMount(connect, point) {
    return connect.static(path.resolve(point));
  };

  //grunt.loadTasks('closure-tools/tasks');
  // Project configuration.
  grunt.initConfig({
    // closureBuilder not used on purpose.
    closureCompiler: {
      options: {
        compilerFile: compiler.getPathSS()
      },
      server2js: {
        options: {
          compilerOpts: {
            compilation_level: 'ADVANCED_OPTIMIZATIONS',
            warning_level: 'verbose',
            summary_detail_level: 3,
            define: ["'goog.DEBUG=false'", "'ss.STANDALONE=true'"],
            output_wrapper: '"!function(){%output%}.call(this);"',
            externs: 'build/json.extern.js'
          }
        },
        src: [
          'closure-library/closure/goog/base.js',
          'src/server2js.export.js',
          'src/server2.js'
          ],
        dest: 'dist/server2.min.js'
      },
      testHelpers: {
        options: {
          compilerOpts: {
            compilation_level: 'SIMPLE_OPTIMIZATIONS',
            externs: 'test/libs/externs.goog.string.js'
          }
        },
        src: [
          'closure-library/closure/goog/base.js',
          'closure-library/closure/goog/string/string.js',
          'test/libs/build.goog.string.js'
        ],
        dest: 'test/libs/goog.stack.js'
      }
    },
    closureDepsWriter: {
      options: {
        closureLibraryPath: 'closure-library'
      },
       // any name that describes your operation
      targetName: {
        src: ['server2.js', 'build/server2js.export.js'],
        dest: 'build/deps.js'
      }
    },

    /**
     * Live Reload
     *
     */
   regarde: {
      all: {
        files: ['test/**/*.js', 'src/**/*.js', 'lib/**/*.js', './*.js'],
        tasks: ['livereload', 'test:node']
      }
    },

    //
    // watch is not yet compatible with livereload
    //
    watch: {
      test: {
        options: {
          nospawn: true
        },
        files: ['test/**/*.js', 'src/**/*.js', 'lib/**/*.js', './*.js'],
        tasks: ['test']
      }
    },

    /**
     * TESTING
     *
     */
    connect: {
      livereload: {
        options: {
          port: 9001,
          middleware: function(connect, options) {
            return [lrSnippet, folderMount(connect, '.')];
          }
        }
      },
      test: {
        options: {
          port: 8888,
          base: './',
          keepalive: false
        }
      }
    },
    qunit: {
      source: {
        options: {
          urls: ['http://localhost:8888/test/']
        }
      },
      compiled: {
        options:{
          urls: ['http://localhost:8888/test/index.html?compiled=true']
        }
      }
    },

    nodeunit: {
      all: ['test/node/**/*.js']
    }
  });

  grunt.registerTask('test', 'Test all or specific targets', function(target) {
    var nodeTest = [
      'nodeunit:all'
    ];

    var webTest = [
      'connect:test',
      'qunit:source',
      'qunit:compiled'
    ];

    // clear temp folder v0.4 way
    grunt.file.expand( ['temp/*'] )
      .forEach( grunt.file.delete );

    //return;
    switch( target ) {
      case 'node':
        grunt.task.run(nodeTest);
      break;
      case 'web':
        grunt.task.run(webTest);
      break;
      default:
        grunt.task.run(nodeTest);
        grunt.task.run(webTest);
      break;
    }

  });

  // Default task.
  grunt.registerTask('default', 'test');
  grunt.registerTask('build', 'closureCompiler:server2js');
  grunt.registerTask('live', ['livereload-start', 'connect:livereload', 'regarde']);
};