'use strict';

module.exports = function(grunt) {
  // Define the configuration for all the tasks
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    shell: {
      clean: {
        command: [
          'rm -rf www',
          'mkdir www'
        ].join(' && ')
      },
      clone_dev: {
        command: [
          'cp -r src/fonts www/',
          'cp -r src/img www/'
        ].join(' && ')
      },
      clone_prod: {
        command: [
          'cp -r src/fonts www/',
          'cp src/icon.png www/icon.png',
          'cp src/index.html www/index.html'
        ].join(' && ')
      },
      phonegap_build: {
        command: 'phonegap build'
      },
      bower_move: {
        command: function() {
          var htmlFile = grunt.file.read('src/index.html'),
            bowerIncludes = htmlFile.match(/bower_components[^'"]+/g);

          bowerIncludes.forEach(function(item, index) {
            var ext = '.js';
            if (/\.js$/.test(item)) {
              ext = '';
            }
            console.log(item + ext);
            bowerIncludes[index] = 'cp --parents ' + item + ext + ' www/';
          });
          return 'mkdir -p www/bower_components && ' + bowerIncludes.join(' && ');
        }
      }
    },
    babel: {
      options: {
        modules: 'amdStrict'
        //sourceMap: true
      },
      dev: {
        files: [{
          expand: true,
          cwd: 'src/js',
          src: ['**/*.js'],
          dest: 'www/js'
        }]
      },
      prod: {
        options: {
          compact: true
        },
        files: [{
          expand: true,
          cwd: 'src/js',
          src: ['**/*.js'],
          dest: 'www/js'
        }]
      }
    },
    watch: {
      babel: {
        files: 'src/js/*.js',
        tasks: ['babel:dev'],
        options: {
          spawn: false,
          interrupt: true
        }
      },
      html: {
        files: 'src/index.html',
        tasks: ['string-replace:html']
      },
      css: {
        files: 'src/css/*.css',
        tasks: ['string-replace:css']
      },
      express: {
        files:  [ 'api/*.js' ],
        tasks:  [ 'express:dev' ],
        options: {
          spawn: false
        }
      }
    },
    'string-replace': {
      html: {
        files: {
          'www/index.html': 'src/index.html'
        },
        options: {
          replacements: [{
            pattern: /\.css[^"]*\"/ig,
            replacement: '.css?v=' + Date.now() + '"'
          }]
        }
      },
      css: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['**/*.css'],
          dest: 'www/css'
        }],
        options: {
          replacements: [{
            pattern: /\.(png|jpeg|gif|svg)\)/g,
            replacement: '.$1?v='+ Date.now() +')'
          }]
        }
      }
    },
    express: {
      options: {
        port: 8020
      },
      dev: {
        options: {
          script: 'api/server.js'
        }
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['*.css'],
          dest: 'www/css'
        }]
      }
    },
    imagemin: {
      options: {
        optimizationLevel: 3,
        svgoPlugins: [{ removeViewBox: false }]
      },
      img: {
        files: [{
          expand: true,
          cwd: 'src/img',
          src: ['**/*.{png,svg}'],
          dest: 'www/img'
        }]
      },
      res: {
        files: [{
          expand: true,
          cwd: 'src/res',
          src: ['**/*.png'],
          dest: 'www/res'
        }]
      }
    }
  });

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');

  grunt.registerTask('default', [
    'shell:clean',
    'shell:clone_dev',
    'babel:dev',
    'string-replace',
    'express:dev',
    'watch'
  ]);

  grunt.registerTask('build', [
    'shell:clean',
    'shell:clone_prod',
    'shell:bower_move',
    'babel:prod',
    'cssmin',
    'imagemin',
    'shell:phonegap_build'
  ]);
  //grunt.registerTask('watch', ['babel', 'watch']);
};
