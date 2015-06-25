
# WesyerJS

WesyerJS is a NodeJS tool that permit you to automatize all of your tasks.
It permit to perform operations on files and write the result in other files.

## How to install

To install WesyerJS, you first needs to install the [NodeJS Package Manager (npm)](https://www.npmjs.com/).

Then, type the following command in your terminal :

```
npm install wesyer-js -g
```

**NOTE :** The *-g* argument install WesyerJS globally. This permit to use WesyerJS everywhere and access to the 'wy' command.

## How to use
*All of these commands needs to have installed WesyerJS globally with *-g* argument*

### Step 1 - Create a project

WesyerJS works only on projects.
To create a project, use the following command :

```
wy init my-project
cd my-project
```

**NOTE :** You can replace *my-project* by another name

You will be asked about informations :

 Property        | Optionnal | What is it ?
 --------------- | --------- | ------------
 description     | true      | The description of your project
 author          | true      | The author of the project
 license         | true      | The license of the project
 verbose         | false     | Choose if WesyerJS has to say you all about errors - That can be interesting for development
 server port     | false     | If you choose to create a local server to test your pages, the port to use
 root file       | false     | The file to deliver to client when he request server for the root page (/)
 encoding        | false     | The encoding of all files in your project
 server encoding | false     | The file encoding for the server's pages
 server verbose  | false     | Set the server verbose

**NOTE :** Hold ```Return``` (or ```Entrée```) key will set the default value to the asked property (this value is writed in green)

If you perform a ```ls -a``` on this new directory, you can see that one folder and one file has been created.

First, the folder ```.wesyer``` contains files required by WesyerJS to works. **Don't touch to this folder !!!**

There is also a ```taskfile.js``` file, which contains the following content :

```javascript
// Wesyer task file

var config = {
    "description": "",
    "author": "",
    "license": "Apache 2.0",
    "modules": {
        "repository": "https://wesyerjs.olympe.in/modules"
    },
    "verbose": "false",
    "server": {
        "port": 8080,
        "rootFile": [
            "index.html"
        ],
        "encoding": "utf-8",
        "templates": {},
        "verbose": "false",
        "mime-types": {}
    }
};
```

### Step 2 - Create a task

To use WesyerJS, you need to create a task. 
For that, open the ```taskfile.js``` file in your favorite code editor, and add the following content at the end of the file :

```javascript
Wesyer.task('default', function() {
	console.log('This task works great !');
});
```

And type in your terminal :

```
wy
```

If you see a message ```This task works great !``` in your console, then all works great !

#### Explanations

We have create a task by using ```Wesyer.task()``` function. This function require two parameters : the name of the task, and the callback.
To run a task, you have to type ```wy <taskname>``` in your terminal. But if you don't type a task name, the **default** task will be runned.

### Step 3 - Download a module

Now, we will use modules. But first, you need to download one :

```
wy install test-module
```

If it exists on the server, it will be downloaded.

**NOTE :** If you want to use an other server, change the URL in ```config['modules']['repository']```
When you download a module, the final URL is ```<server-url>/<module-name>/archive.zip``` (example : ```https://wesyerjs.olympe.in/modules/test-module/archive.zip```)

The module will be downloaded as a ZIP archive in ```.wesyer/archive.zip``` and will be extracted in folder ```.wesyer/<module-name>```.

**WARNING :** Do **NOT** download two modules at the same time ! This can corrupt project directory or do dangerous things ! 

The ```test-module``` module is now downloaded on the ```.wesyer``` folder !

### Step 4 - Use our new module

I've said at the beginning that WesyerJS works on files.
Now, I say that modules permit to works on these files.
And we'll test that.

In fact, the module we've downloaded permit to replace the ```__FILE__``` text on all files by the file path.

First, create a folder ```src``` and a folder ```out``` in your project directory.
Create into a file named ```test.txt``` in the ```src``` folder, with the following content :

```
The relative path of this file is : __FILE__
```

Save it.

Then, edit the ```default``` task (in ```taskfile.js```) and replace it content with this :

```javascript
Wesyer.task('default', function() {
	
	Wesyer
		.for('src/*')
		.pipe('test-module')
		.out('out/', {root: true})

});
```

#### Explanations

To work on files, you need to say it to WesyerJS. The ```for``` command permit to select files.
The ```pipe``` command permit to *pass* the file to a module (here, the module we've downloaded before).
And the ```out``` command permit to write the result of the work in a directory.
This last function is a little bit complicated than others :

- We've choosed to works on all files in the ```src``` folder
- We've *piped* them with the ```test-module``` module
- We want to write these files on the ```out``` folder

If you don't pass the ```{root: true}``` object to the command, WesyerJS will try to write our ```test.txt``` file on this path : ```out/src/test.txt```
The ```{root: true}``` argument say to WesyerJS *"Write these files at the root of the output directory !"*
So our file will be writed to ```out/test.txt```

Now, run the task by running ```wy``` in your terminal.

If you see a file named ```test.txt``` appear in the ```out``` folder, then all works great ;-) !

Open this new file. The content is now :

```
The relative path of this file is : src/test.txt
```

Enjoy !

### Step 5 - Create a module

You perhaps want to do other things that replace ```__FILE__``` by a path in all of your files !

So, let's see how to create a new module. Our module will replace ```the author``` by ```ME``` in all files (that's for the example)

First, use the following command :

```
cd ..
wy create-module my-module
cd my-module
```

**NOTE :** I don't describe it the asked properties of the module because they are very simples.

Open the ```package.json``` file. It contains the following content :

```json
{
    "files": [
        "index.js"
    ],
    "name": "my-module",
    "description": "A simple test module for the WesyerJS tutorial",
    "author": "Clément Nerma",
    "main": "index.js",
    "license": "Apache 2.0",
    "version": "0.1.0"
}
```

The ```files``` field contains all files that your module will use.
The ```main``` field indicate what is the main file of your module.

Now, open the ```index.js``` file. It is empty. But we will write it ;-) !

You can check out the [WesyerJS API](https://github.com/ClementNerma/WesyerJS/wiki/API) to learn what you can do on files (see the ```Wesyer.Files``` section)

So, let's code ! Write the following content in ```index.js``` :

```javascript
return input.apply(function(content) {
	return content.replace(/the author/g, 'ME');	
});
```

Simple, isn't ?
 
```input``` is an instance of ```Wesyer.File``` that represents the input file (such as ```src/my-test-file.txt```).
This is always a **single** file.

The ```apply``` function permit to get the content of the file and perform operations on. We've replaced all ```the author``` by ```me``` in this content, and we've returned it.
The returned content will in fact overwrite the old file content.

Our module is now ready to be used in a project !

Now, let's see how to build it. Type in your terminal :

```
wy build-module
```

This will create a ZIP file that contains your module. All files contained in this ZIP are in the ```files``` field in ```package.json```, and this last file has been added to the group !

### Step 6 - Install a local module

Now, return to your project

```
cd ../my-project
```

And install our new module :

```
wy install my-module --local ../my-module/my-module.zip
```

A ```my-module``` folder will be created in the ```.wesyer``` directory. That's all !
You can now use the ```my-module``` module in your tasks !

# License

This project is under the license Creative Commons Attribution 4.0 International - No commercial - No derivative terms (see more at http://creativecommons.org/licenses/by-nc-nd/4.0/)

# Wiki

Let's see the wiki !
You can find it at https://github.com/ClementNerma/WesyerJS/wiki

# Bugs and data lost

I'm not responsible for any damage caused to your computer by WesyerJS, including data lost, bugs, etc.
(Even if all will works great ;-) !)
