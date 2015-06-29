#Easily build Server pages in meteor.

Meteor is great at building sophisticated Single Page Applications. But if the application also has traditional (informational) pages - fast load, seo friendly, multipage - it is surprisingly difficult to do.

## viloma:server-pages - solves this by supporting server only pages. It supports template management, static assets, authentication and dev workflow. 

Some of the issues in server side routing are -

1. meteor should not automatically reloads - when any change is made to server pages.
2. all files included in client bundle making it large
3. handling of templates on server side
4. authentication on SSR rendered pages 
5. cannot

for server-pages - solves problem 1 & 2 by having static pages placed in a directory that is hidden from meteor called - .spages
.spages/public - files are made available over http - at the address files/filename
.spages/templates - templates are automatically loaded and compiled on server side

- server rendered pages - do not load all meteor and app packages - so are fast.
- these files are not pushed to the client - keeping it separate and client bundles small.
- 


What this does not solve -
1. SSR seems to mean - rendering same pages on client and server. That is not what this does.
2. 