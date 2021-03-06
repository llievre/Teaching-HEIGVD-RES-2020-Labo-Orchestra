# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**. 
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
| | ![](images/diagramme.png) |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | *Chaque musicien va envoyer chaque seconde un datagramme UDP* |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | *Un auditeur va écouter sur le port UDP 2205*. L'auditeur va ajouter les nouveaux musiciens à sa liste et va renvoyer cette liste en tant que payload JSON. |
|Question | What **payload** should we put in the UDP datagrams? |
| | *L'UID du musicien, le son de l'instrument joué et le timestamp du début de son activation*. Je fais le choix de passer le timestamp d'activation dans les trames pour avoir une plus grande précision du vrai temps d'activation même si cela consomme un peu plus de place dans la trame. |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | *Sender :* Un tableau associatif reliant les instruments et leurs sons correspondants afin d'envoyer le bon son. Rien a update. On va utiliser cette liste à chaque fois qu'on envoie une trame pour envoyer le bon son.<br />*Receiver :* Un tableau associatif reliant les instruments et leurs sons correspondants afin de pouvoir identifier l'instrument. Si un musicien ne joue plus pendant 5 secondes, il sera supprimé de la liste. |


## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | *Il existe une fonction JSON.stringify*()<br />![](images/stringify.png) |
|Question | What is **npm**?  |
| | *npm est le gestionnaire de paquet de Node.js, il nous permet donc d'installer et désinstaller les paquets et leurs dépendances.* |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | *La commande `npm install` permet d'installer les paquets. Par défaut il va installer les modules présents dans le fichier package.json.<br /> Des arguments peuvent être passé à la commande pour installer un paquet spécifique<br />L'argument `--save` permet de sauvegarder la référence du paquet dans le package.json* |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | *Le site est utilisé pour rechercher les paquets et obtenir des informations. On y trouve des indications pour l'installer, les dépendances, etc...* |
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |
| | Avec le module nommé `uuid` installable avec npm |
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | *Il existe une fonction setInterval*() fournie par Node.js dans le module Timers<br />![](images/setInterval.png) |
|Question | In Node.js, how can we **emit UDP datagrams**? |
| | *Avec le module `dgram` fourni avec Node.js et on utilise la fonction send définie dans ce module*<br />![](images/udp.png) |
|Question | In Node.js, how can we **access the command line arguments**? |
| | *Les arguments se trouvent dans process.argv.*<br />![](images/processargv.png) |


## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | *Après avoir créé un fichier Dockerfile où l'on indique l'image de base, les fichiers à copier et autre paramètres on peut utiliser la commande `docker build NAME` dans le but de créer  l'image. Par exemple : `docker build -t res/musician .`* |
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | L'Entrypoint permet de définir qu'on lance une application au démarrage du conteneur. Ici on lance nodejs comme point d'entrée du conteneur. |
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | *On utilise la commande `docker run NAME`. Par exemple : `docker run res/musician`.* |
|Question | How do we get the list of all **running containers**?  |
| | *Avec la commande `docker ps`* |
|Question | How do we **stop/kill** one running container?  |
| | *On peut stopper avec `docker stop NAME` ou tuer avec `docker kill NAME`* |
|Question | How can we check that our running containers are effectively sending UDP datagrams?  |
| | *On peut regarder dans les logs du conteneur ou démarrer un autre conteneur et écouter le trafic qui passe sur le port en UDP avec un outil comme netcat par exemple.* |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |
| | *On peut facilement se connecter avec `dgram`. On bind le socket sur l'adresse et le port désiré et ensuite on peut indiquer pour chaque message reçu la marche à suivre à faire.*<br />![](images/dgram-multi-auditor.png) |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | *On y stock les instruments et la liste des musiciens pour les gérer facilement on utilisant un identifiant unique (uuid pour les musiciens, le son pour les instruments).<br />![](images/map.png)* |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | *On utilise Moment en utilisant l'instruction require et ensuite on l'utilise pour formatter les dates ou les comparer avec la fonction diff.<br />![](images/moment.png)* |
|Question | When and how do we **get rid of inactive players**?  |
| | *Chaque seconde on regarde sur la différence de temps est plus grande que 5 secondes entre la dernière fois qu'il a joué et le temps courant, si c'est le cas, on supprime le musicien du Map<br />![](images/delete.png)* |
|Question | How do I implement a **simple TCP server** in Node.js?  |
| | On crée l'objet :<br />![](images/tcp1.png)<br />On indique le port sur lequel il va écouter:<br />![](images/tcp2.png)<br />On renseigne ensuite ce qu'on veut faire quand le serveur reçoit une connexion:<br />![](images/tcp3.png) |


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | *J'ai testé manuelement le fonctionnement avec 1-2 conteneurs musiciens et 1 auditeur avant de lancer le script validate.sh*<br />![](images/validate.png) |


## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should try to run it.
