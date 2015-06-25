
# WesyerJS

WesyerJS est un outil NodeJS qui permets d'automatiser toutes vos tâches.
Il consiste à exécuter des opérations sur des fichiers et écrire le résultat dans un dossier de destination.

## Installation

Pour installer WesyerJS, vous devez d'abort installer le [Gestionnaire de paquets NodeJS (npm)](https://www.npmjs.com/).

Ensuite, tapez la commande suivante dans votre terminal :

```
npm install wesyer-js -g
```

**NOTE :** L'argument *-g* installe WesyerJS de manière globale sur votre machine. Cela permets d'utiliser WesyerJS dans n'importe quel dossier et d'accéder à la commande 'wy'

## Utilisation
*Toutes les commandes suivantes nécessitent d'avoir installé WesyerJS de manière globale avec l'argument -g*

### Etape 1 - Créer un project

WesyerJS fonctionne avec un système de projets.
Pour en créer un, utilisez la commande suivante :

```
wy init my-project
cd my-project
```

**NOTE :** Vous pouvez remplacer *my-project* par un autre nom

Vont vous êtres demandées certaines informations concernant votre projet :

 Propriété       | Optionnel | Qu'est-ce que c'est ?
 --------------- | --------- | ------------
 description     | Oui       | The description of your project
 author          | Oui       | l auteur of the project
 license         | Oui       | The license of the project
 verbose         | Non       | Choisissez si WesyerJS doit afficher toutes les erreurs rencontrées - Cela peut être utile dans le cadre du développement
 server port     | Non       | Si vous choisissez d'utiliser la fonction de création de serveur local, indiquez ici le port à utiliser (par défaut, 8080)
 root file       | Non       | Le fichier à délivrer au client lorsqu'il tentera d'accéder à la racine du serveur (ex: localhost:1347/)
 encoding        | Non       | L'encodage de tous les fichiers du projet (par défaut : utf-8)
 server encoding | Non       | L'encodage de tous les fichiers du serveur (par défaut : utf-8)
 server verbose  | Non       | Choisissez si le serveur doit afficher toutes les erreurs rencontrées

**NOTE :** Appuyez sur la touche ```Entrée``` définira la valeur par défaut pour la propriété demandée (cette valeur est affichée en vert)

Si vous faites un petit coup de ```ls -a```, vous allez voir qu'un dossier et un fichier ont été créés.

Premièrement, le dossier ```.wesyer``` contient les fichiers requis par WesyerJS. **Ne toucher pas à ce dossier !!!**

Il y a également un fichier ```taskfile.js```, dont le contenu est le suivant :

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

### Etape 2 - Créer une tâche

Pour utiliser WesyerJS, vous devez créer une tâche.
Pour cela, ouvrez le fichier ```taskfile.js``` dans votre éditeur de code favori, et ajoutez ceci à la fin du fichier :

```javascript
Wesyer.task('default', function() {
	console.log('Cette tâche fonctionne parfaitement :-)');
});
```

Et tapez dans le terminal :

```
wy
```

Si vous voyez un message ```Cette tâche fonctionne parfaitement :-)``` dans votre console, alors tout marche bien !

#### Explications

Nous avons créer une tâche en utilisant la fonction ```Wesyer.task()```. Celle-ci requiert deux paramètres : le nom de la tâche, et le callback.
Pour exécuter une tâche, vous devez tapez ```wy <taskname>``` dans votre terminal. Mais si vous ne spécifiez pas de nom de tâche, alors la tâche **default** sera exécutée.

### Etape 3 - Télécharger un module

Nous allons maintenant voir comment utiliser les modules. Mais d'abord, nous devons en télécharger un :

```
wy install test-module
```

S'il existe sur le serveur, il sera téléchargé.

**NOTE :** Si vous souhaitez utiliser un autre serveur, changez l'URL dans ```config['modules']['repository']```
Lorsque vous téléchargerez un module, l'URL finale téléchargée sera ```<server-url>/<module-name>/archive.zip``` (exemple : ```https://wesyerjs.olympe.in/modules/test-module/archive.zip```)

Le module va être téléchargé en tant qu'archive ZIP à l'emplacement ```.wesyer/archive.zip``` et va être extrait dans le dossier ```.wesyer/<module-name>```

**ATTENTION :** Ne téléchargez **SURTOUT PAS** deux modules en même temps ! Cela peut corrompre le dossier contenant les modules ou faire des actions non désirables !

Maintenant, le module ```test-module``` est télécharger dans le dossier ```.wesyer``` !

### Etape 4 - Utilisons notre nouveau module

J'ai dit au début que WesyerJS travaille avec des fichiers.
Maintenant, je dis que les modules nous permettent de travailler dessus.
Et nous allons voir cela tout de suite !

En fait, le module que nous avons téléchargé permets de remplacer tous les ```__FILE__``` dans chaque fichier par le chemin relatif du fichier.

Pour commencer, créez un dossier ```src``` ainsi qu'un dossier ```out``` dans le dossier de votre projet.
Créez un fichier nommé ```test.txt``` dans le dossier ```src```, avec le contenu suivant :

```
Le chemin relatif de ce fichier est : __FILE__
```

Sauvegardez-le.

Maintenant, modifiez la tache ```default``` (dans ```taskfile.js```) et remplacez son contenu avec celui-ci :

```javascript
Wesyer.task('default', function() {
	
	Wesyer
		.for('src/*')
		.pipe('test-module')
		.out('out/', {root: true})

});
```

#### Explications

Pour travailler sur des fichiers, vous devez le dire à WesyerJS. La commande ```for``` est là pour ça et permets de sélectionner des fichiers.
La fonction ```pipe``` permets de *passer* un fichier à un module (ici, le module que nous avons télécharger juste avant).
Et la commande ```out``` permets d'écrire le résultat de notre travail dans un autre dossier.
Cette dernière fonction est un peu compliqué à comprendre par rapport aux autre. Récapitulons :

- On a choisi de travailler sur tous les fichiers dans le dossier ```src```
- On les as *pipés* avec le module ```test-module```
- On veut écrire le résultat dans le dossier ```out```

Si vous ne passez pas l'objet ```{root: true}``` à la fonction ```out```, WesyerJS va essayer d'écrire notre fichier ```test.txt``` dans ```out/src/test.txt```
L'argument ```{root: true}``` dit à WesyerJS *"Ecrit ces fichiers à la racine du répertoire final !"*
Donc notre fichier va être écrit à cet endroit : ```out/test.txt```

Maintenant, lancez la tâche en tapant ```wy``` dans votre terminal.

Si vous voyez un fichier nommé ```test.txt``` apparaître dans le dossier ```out```, alors tout marche bien ;-) !

Ouvrez ce nouveau fichier. Il devrait contenir ceci :

```
Le chemin relatif de ce fichier est : src/test.txt
```

Enjoy !

### Etape 5 - Créer un module

Vous souhaitez peut-être faire d'autres choses que de juste remplacer ```__FILE__``` par un chemin relatif dans tous vos fichiers !

Alors voyons voir comment créer un module. Le nôtre va remplacer ```l auteur``` by ```MOI``` dans tous les fichiers (c'est pour l'exemple).

Premièrement, utilisez la commande suivante :

```
cd ..
wy create-module mon-module
cd mon-module
```

**NOTE :** Je ne décrit pas ici les propriétés qui vous sont demandées sur le module car elles sont relativement simples.

Ouvrez le fichier ```package.json``` nouvellement créé. Il contient ceci :

```json
{
    "files": [
        "index.js"
    ],
    "name": "mon-module",
    "description": "Un simple module de test pour le tutoriel sur WesyerJS",
    "author": "Clément Nerma",
    "main": "index.js",
    "license": "Apache 2.0",
    "version": "0.1.0"
}
```

Le champ ```files``` contient tous les fichiers que votre module va utiliser.
Le champ ```main``` indique quel est le fichier principal de votre module.

Maintenant, ouvrez le fichier ```index.js```. Il est vide, mais nous allons le remplir ;-) !

Vous pouvez jetez un oeil à l'[API WesyerJS](https://github.com/ClementNerma/WesyerJS/wiki/API) pour voir ce que vous pouvez faire avec les fichiers sélectionnez (regardez la section ```Wesyer.Files```)

So, let's code ! Ecrivez ceci dans le fichier ```index.js``` :

```javascript
return input.apply(function(content) {
	return content.replace(/l auteur/g, 'MOI');	
});
```

Simple, n'est-ce pas ?

La variable ```input``` est une instance de la classe ```Wesyer.File``` qui représente le fichier d'entrée (comme ```src/mon-fichier-de-test.txt```).
C'est toujours **un seul** fichier.

La fonction ```apply``` permets de récupérer le contenu du fichier pour effectuer des opératinos dessus. Nous avons remplacés toutes les occurences de ```l auteur``` par ```MOI``` dans le contenu, et nous l'avons retourné grâce au mot-clé ```return```.
Le contenu ainsi retourné est en fait écrit à la place de l'ancien contenu du fichier

Notre module est maintenant prêt à être utiliser dans un project !
Voyons voir comment le "compiler". Ecrivez dans le terminal :

```
wy build-module
```

Cela va créer un fichier ZIP contenant votre module. Tous les fichiers contenus dans ce ZIP sont inscrit dans le champ ```files``` dans ```package.json```, et ce dernier fichier est rajouté au groupe !

### Etape 6 - Installons notre module !

Maintenant, retournons dans notre projet

```
cd ../my-project
```

Et installons notre module :

```
wy install mon-module --local ../mon-module/mon-module.zip
```

Un dossier ```mon-module``` va être créé dans le dossier ```.wesyer```. C'est tout !
Vous pouvez désormais utiliser le module ```mon-module``` dans vos tâches !

# License

Ce projet est sous licence Creative Commons Attribution 4.0 International - No commercial - No derivative terms (licence complète à http://creativecommons.org/licenses/by-nc-nd/4.0/)

# Wiki

Vous pouvez trouvez le wiki à l'adresse https://github.com/ClementNerma/WesyerJS/wiki

# Bugs et pertes de données

Je ne peux en aucun cas être tenu reponsable de quelque dommage causé à votre ordinateur causé par WesyerJS, incluant perte de données, bugs, etc.
(Même si tout va bien fonctionner ;-) !)
