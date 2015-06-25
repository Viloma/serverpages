Package.describe({
  name: 'viloma:server-pages',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Package to allow Server side page serving',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.registerBuildPlugin({name:'server-pages-build',sources:['server-pages-build.js']});
Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('williamledoux:static-server');
  api.use('meteorhacks:ssr');
  api.addFiles('server-pages.js', "server");
  api.addFiles('dummy.spages', "server");
 api.export('ServerPages', 'server');

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('viloma:server-pages');
  api.addFiles('server-pages-tests.js');
});

