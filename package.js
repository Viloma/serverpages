Package.describe({
  name: 'viloma:server-pages',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Package to allow Server side page serving',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Viloma/serverpages.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  connect: "2.7.10",
  connectr: "0.0.7"
});

Package.registerBuildPlugin({name:'server-pages-build',sources:['server-pages-build.js']});
Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('deps');
  api.use('mongo');
  api.use('webapp', 'server');
  api.use('templating', 'client');
  api.use('iron:router@1.0.9', 'server', {weak: true});
  api.use('meteorhacks:ssr@2.1.2', 'server');
  api.use('accounts-base', 'server', {weak: true});
  
  api.addFiles('server-page-user-check.spages', "server");
  api.addFiles('server-page-user-setup.js', ["client","server"]);
  api.addFiles('server-pages.js', "server");
//  api.addFiles('server-page-login.html');
 api.export('ServerPages', 'server');

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('viloma:server-pages');
  api.addFiles('server-pages-tests.js');
});

