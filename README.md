FILES/DIRECTORY ORGANIZATION
==============================

Every template for NERDZ must have the same structure of this one, which is:  
  

`./base`: [this folder contains "basic" pages used by the php scripts with the same name (i.e. about.html is used when you go to /about.php)]  
`./base/images`: [this folder contains images for the `base` files, divided in online and offline folders.]  
`./css`: [this folder contains css files. To understand what is used where, read (and/or modify) `template.values`]  
`./home`: [this folder contains files used in the homepage (for registered users), layouts and profile list.]  
`./js`: [this folder contains javascript files. To understand what is used where, read (and/or modify) `template.values`]  
`./pm`: [this folder contains files used for PMs]  
`./preferences`: [This only exists in the default template, as it would be a security risk to have it in every template.]  
`./profile`: [this folder contains files used to show a user profile]  
`./profile/images`: [this folder contains images for the `profile` files]  
`./project`: [this folder contains files used in the projects section]  

  
FILE: template.values
---------------------
This file allows the template creator to specify javascript and css files to be included in following pages:  

> codelist.php, error.php, faq.php, home.php, index.php, informations.php, list.php, pm.php, preferences.php, profile.php, project.php, rank.php, reset.php, share.php, stats.php, terms.php  

Most important, note that in the two `javascript` and `css` sections it's possible to specify the default css and js file:  
`default: "js/default.js"`  
`default: "css/default.css"`  

The file specified will be included in every page listed above and always before other files. By doing so you can create general css rules in the default file and then overwrite them with more specific rules when needed.  

Recently the possibility of including static variables and language strings directly from this file was added. Please see the example in the default template. You will need an updated core.

The file also includes a `langs` section, which is used to specify *only* the default language. The syntax `%lang%` is mandatory so that you can create json language files organized by language.  
  
  
  
FILE: template.variables
------------------------
This file contains the list of every php variable availble in a specific page.  
  
  
  
FILE: NAME
----------
The NAME file must always be present and in the template root folder. It's content is the template name.  
  
  
  
Variables
---------
Template variables are organized in this structure:  
1. Variables ending in *_b* are boolean variables used in ifs and control flow structures  
2. Variables ending in *_a* are array and the various elements (if they're multidimensional arrays) are found in the `template.variables` file. They're used in loops or for static access to single elements.  
3. Variables ending in *_n* are nerdz variables, not arrays nor boolean. They're almost always used in print funtions.  
4. Language variables. They're the variables that don't fit in any of the previous categories. This variables are NOT found in the `template.variables`, as they're generated from the language files (json), and they're case INSENSITIVE.  
  
  
  
JAVASCRIPT API
--------------
Javascript APIs are available to allow for easy template creation.
JQuery is included in every NERDZ page.  
  

Writing files
-------------
To write .html files, see the guide to RAINTPL.  
  
  
CSS
---
The CSS classes `quote` and `spoiler` are mandatory, as they're the classes used for those BBCode tags.  
Add them to the default css or just in the css file(s) used in pages that will be using those tags (home, profile, project).  

The classes `.img_frame` and `.img_frame-extended` are also mandatory, as they're the classes used to show images.  
  

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/nerdzeu/nerdztemplateblack/trend.png)](https://bitdeli.com/free "Bitdeli Badge")