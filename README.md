# Easily add Server pages to your meteor.

Meteor is great at building sophisticated Single Page Applications. But if the application also has traditional (informational) pages - fast load, seo friendly, multipage sections - it is surprisingly difficult to do.

### Server Pages - solves this by supporting 
1. managing templates - just as they are managed on the client
2. serving static files - from a folder (using ideas from  williamledoux:static-server)
3. preventing restart on every save in development - but autoloading on refresh.
4. rendering along with head sections. (using SSR - thanks to meteorhacks:ssr )
5. getting userId on server side - using a token-cookie linked to userId. To be used for customization only - not for any sensitive information or workflow.

### Installation
```
meteor add viloma:server-pages
```
### Server Side Routes 
These can be defined using Iron:Router - note that The **"where: server"** - is Important! 
```
if(Meteor.isServer){
    Router.route('/event/:evtid', function() {
        var evt = Events.findOne({_id: this.params.evtid});
      ServerPages.render("eventpage", {e: evt}, this.response);
    }, {where:'server'});
}
```

### Server Side Static files and Templates
You place need to place static files and templates under .spages folder under project root folder - 

projectroot/.spages/public - for static files
projectroot/.spages/templates - for templates

* All the files under /.spages/public - are served from url /files/ .
* All templates under /.spages/templates - are loaded for rendering
* changes to files in the .spages folder - do not cause meteor to restart - making for a  much better development workflow.
* templates changes are still picked up on page refresh.
* Static files and templates are packaged and included in the build.

### sample templates
``` 
<template name='eventpage'> 
    ..... 
</template>
<template name='head'> 
    <script ... > <link ... > This is common head tag for all pages 
</template>
<template name='head-eventpage'> 
    <meta ... > head elements for eventpage template go here  
</template>
```

### lastly if you dont want to use .spages folder - but just want to compile a template - put it in private folder 
```
ServerPages.compileTemplate(Assets.getText('filename.txt'))
```

* [meteorhacks:ssr] - rendering blaze and jade templates on server side.
* [staticserver] - rendering static files from server [@thomasfuchs].

License
----
MIT

[meteorhacks:ssr]:https://github.com/williamledoux/meteor-static-server
[staticserver]:https://github.com/meteorhacks/meteor-ssr
