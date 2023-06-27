<template>
    <div class="scrollable">
        <div class="welcomeText">
            Welcome to uml-cafe
        </div>
        <div class="information">
            <p>
                This is an alpha stage open source uml based modeling client. Please be patient with development, or help us with it! There is so much to do! Be aware that the profile and code itself are subject to changes so any projects you create now may not be compatible easily with future versions. To start right click the Model in the containment tree to the left and start creating! 
            </p>
            <p>
                Open-UML is built upon a pretty simple technical stack and is made up of 4 parts right now:
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cafe">uml-cafe</a> The vue based application built for the browser that allows interaction with a managed model in the backend. The diagramming ability is built upon bpmn.io's <a href="https://github.com/bpmn-io/diagram-js">diagram-js</a>.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-cpp">uml-cpp</a> The core of the uml data operations in the backend. Keeps a persistent record of uml model elements and allows for aquiring and releasing those elements back to a serialized form in JSON, YAML, or soon XMI.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-js">uml-js</a> The client api in javascript that allows interaction with an endpont hosting a model or models.
            </p>
            <p>
                <a href="https://github.com/nemears/uml-user-service">uml-user-sercvices</a> The web facing api that allows for sessions per user and shared project states.
            </p>
            <p>
                Contact: nickmears2@gmail.com
            </p>
        </div>
    </div>
</template>
<style>
.scrollable {
    overflow-y: auto;
    padding: 10px;
}
.welcomeText {
    font-size: 75px;
    text-align: center;
}
.information {
    font-size: 25px;
}
.information > p {
    margin: 1rem 0;
}
a {
  color: rgb(113, 198, 255);
}
</style>
